import { join } from "path";
import { app } from "electron";
import { writeFileSync, existsSync, mkdirSync } from "fs-extra";
import { createHash } from "crypto";

export class GoogleTTSProvider {
  private readonly baseUrl =
    "https://texttospeech.googleapis.com/v1/text:synthesize";
  private cacheDir: string;

  constructor() {
    this.cacheDir = join(app.getPath("temp"), "language-study-audio");
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private async makeRequest(url: string, options: any = {}): Promise<any> {
    // Try to use built-in fetch (Node.js 18+)
    if (typeof globalThis.fetch !== "undefined") {
      const response = await globalThis.fetch(url, options);
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        json: () => response.json(),
        arrayBuffer: () => response.arrayBuffer(),
      };
    }

    // Fallback to Node.js http/https modules
    const { default: https } = await import("https");
    const { default: http } = await import("http");
    const { URL } = await import("url");

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === "https:" ? https : http;

      const req = client.request(
        url,
        {
          method: options.method || "GET",
          headers: options.headers || {},
        },
        (res) => {
          let chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const buffer = Buffer.concat(chunks);
            resolve({
              ok: res.statusCode! >= 200 && res.statusCode! < 300,
              status: res.statusCode,
              statusText: res.statusMessage,
              json: () => Promise.resolve(JSON.parse(buffer.toString())),
              arrayBuffer: () =>
                Promise.resolve(
                  buffer.buffer.slice(
                    buffer.byteOffset,
                    buffer.byteOffset + buffer.byteLength,
                  ),
                ),
            });
          });
        },
      );

      req.on("error", reject);

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  private getCacheFilePath(
    text: string,
    language: string,
    voice?: string,
  ): string {
    const hash = createHash("md5")
      .update(`${text}-${language}-${voice || "default"}`)
      .digest("hex");
    return join(this.cacheDir, `${hash}.mp3`);
  }

  async generateAudio(
    text: string,
    language: string = "en-US",
    apiKey?: string,
    voice?: string,
  ): Promise<string> {
    try {
      // Check cache first
      const cacheFile = this.getCacheFilePath(text, language, voice);
      if (existsSync(cacheFile)) {
        return `file://${cacheFile}`;
      }

      if (!apiKey) {
        throw new Error("Google TTS API key required");
      }

      // Configure the request payload
      const requestBody = {
        input: { text },
        voice: {
          languageCode: language,
          name: voice,
          ssmlGender: "NEUTRAL",
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0,
        },
      };

      const url = `${this.baseUrl}?key=${apiKey}`;

      // Perform the text-to-speech request
      const response = await this.makeRequest(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Google TTS API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (!data.audioContent) {
        throw new Error("No audio content received from Google TTS");
      }

      // The audio content is base64 encoded
      const audioBuffer = Buffer.from(data.audioContent, "base64");

      // Save to cache
      writeFileSync(cacheFile, audioBuffer);

      return `file://${cacheFile}`;
    } catch (error) {
      console.error("Google TTS error:", error);
      throw error;
    }
  }

  async getAvailableVoices(
    language: string,
    apiKey?: string,
  ): Promise<string[]> {
    try {
      if (!apiKey) {
        return ["default"];
      }

      const url = `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}&languageCode=${language}`;

      const response = await this.makeRequest(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.warn("Failed to fetch voices from Google TTS");
        return ["default"];
      }

      const data = await response.json();
      return (
        data.voices?.map((voice: any) => voice.name || "default") || ["default"]
      );
    } catch (error) {
      console.error("Failed to get voices:", error);
      return ["default"];
    }
  }

  cleanupOldFiles(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void {
    // Clean up audio files older than maxAgeMs (default: 7 days)
    try {
      const fs = require("fs");
      const files = fs.readdirSync(this.cacheDir);
      const now = Date.now();

      files.forEach((file: string) => {
        const filePath = join(this.cacheDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtime.getTime() > maxAgeMs) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error("Failed to cleanup old audio files:", error);
    }
  }
}
