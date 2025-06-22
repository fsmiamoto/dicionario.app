import { join } from "path";
import { app } from "electron";
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs-extra";
import { createHash } from "crypto";

export class OpenAITTSProvider {
  private readonly baseUrl = "https://api.openai.com/v1/audio/speech";
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
    try {
      if (typeof globalThis.fetch !== "undefined") {
        console.log("OpenAI TTS: Using global fetch for request");
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
      console.log("OpenAI TTS: Using Node.js HTTP modules for request");
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
            timeout: 30000, // 30 second timeout
          },
          (res) => {
            let chunks: Buffer[] = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
              try {
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
              } catch (error) {
                reject(new Error(`Failed to process response: ${error}`));
              }
            });
          },
        );

        req.on("error", (error) => {
          console.error("OpenAI TTS: Request error:", error);
          reject(new Error(`Network request failed: ${error.message}`));
        });

        req.on("timeout", () => {
          console.error("OpenAI TTS: Request timeout");
          req.destroy();
          reject(new Error("Request timeout after 30 seconds"));
        });

        if (options.body) {
          req.write(options.body);
        }

        req.end();
      });
    } catch (error) {
      console.error("OpenAI TTS: makeRequest failed:", error);
      throw new Error(`Failed to make HTTP request: ${error}`);
    }
  }

  private getCacheFilePath(text: string, voice: string, model: string): string {
    const hash = createHash("md5")
      .update(`${text}-${voice}-${model}`)
      .digest("hex");
    return join(this.cacheDir, `openai_${hash}.mp3`);
  }

  private getVoiceFromLanguage(language: string, voice?: string): string {
    if (voice) return voice;

    // Map language codes to appropriate OpenAI voices
    const languageVoiceMap: { [key: string]: string } = {
      "en-US": "alloy",
      "en-GB": "echo",
      "es-ES": "fable",
      "es-MX": "onyx",
      "fr-FR": "nova",
      "de-DE": "shimmer",
      "it-IT": "alloy",
      "pt-BR": "echo",
      "ja-JP": "fable",
      "ko-KR": "onyx",
      "zh-CN": "nova",
    };

    return languageVoiceMap[language] || "alloy";
  }

  async generateAudio(
    text: string,
    language: string = "ja-JA",
    apiKey?: string,
    voice?: string,
    model: string = "tts-1",
  ): Promise<string> {
    try {
      if (!apiKey) {
        console.error("OpenAI TTS: API key is required but not provided");
        throw new Error("OpenAI API key required for TTS generation");
      }

      if (!text || text.trim().length === 0) {
        console.error("OpenAI TTS: Empty text provided");
        throw new Error("Text is required for TTS generation");
      }

      console.log(
        `OpenAI TTS: Generating audio for text: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}" (language: ${language}, voice: ${voice || "auto"})`,
      );

      const selectedVoice = this.getVoiceFromLanguage(language, voice);
      console.log(`OpenAI TTS: Using voice: ${selectedVoice}`);

      // Check cache first
      const cacheFile = this.getCacheFilePath(text, selectedVoice, model);
      if (existsSync(cacheFile)) {
        console.log(`OpenAI TTS: Using cached audio file: ${cacheFile}`);
        // Convert cached file to data URL
        const audioBuffer = readFileSync(cacheFile);
        const base64Audio = audioBuffer.toString("base64");
        return `data:audio/mp3;base64,${base64Audio}`;
      }

      // Configure the request payload
      const requestBody = {
        model,
        input: text,
        voice: selectedVoice,
        response_format: "mp3",
      };

      console.log(
        `OpenAI TTS: Making API request with model: ${model}, voice: ${selectedVoice}`,
      );

      // Perform the text-to-speech request
      const response = await this.makeRequest(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = `OpenAI TTS API request failed: ${response.status} ${response.statusText}`;

        try {
          const errorBody = await response.json();
          if (errorBody.error) {
            errorMessage += ` - ${errorBody.error.message || errorBody.error}`;
          }
        } catch (parseError) {
          console.warn("OpenAI TTS: Could not parse error response body");
        }

        console.error(`OpenAI TTS: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      console.log("OpenAI TTS: API request successful, processing audio data");

      // Get the audio data as array buffer
      const audioBuffer = await response.arrayBuffer();

      if (!audioBuffer || audioBuffer.byteLength === 0) {
        console.error("OpenAI TTS: Received empty audio buffer");
        throw new Error("Received empty audio data from OpenAI TTS API");
      }

      console.log(
        `OpenAI TTS: Received audio data (${audioBuffer.byteLength} bytes), saving to cache`,
      );

      // Save to cache
      writeFileSync(cacheFile, Buffer.from(audioBuffer));

      console.log(`OpenAI TTS: Audio successfully cached at: ${cacheFile}`);

      // Convert to data URL for frontend playback
      const base64Audio = Buffer.from(audioBuffer).toString("base64");
      return `data:audio/mp3;base64,${base64Audio}`;
    } catch (error) {
      console.error("OpenAI TTS generation failed:", error);

      // Re-throw with more context if it's a generic error
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          throw new Error(`OpenAI TTS network error: ${error.message}`);
        } else if (error.message.includes("API key")) {
          throw new Error(
            "OpenAI TTS authentication failed. Please check your API key.",
          );
        }
      }

      throw error;
    }
  }

  async getAvailableVoices(): Promise<string[]> {
    // OpenAI TTS supports these 6 voices
    return ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  }

  cleanupOldFiles(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void {
    // Clean up audio files older than maxAgeMs (default: 7 days)
    try {
      const fs = require("fs");
      const files = fs.readdirSync(this.cacheDir);
      const now = Date.now();

      files.forEach((file: string) => {
        // Only clean up OpenAI TTS files
        if (file.startsWith("openai_")) {
          const filePath = join(this.cacheDir, file);
          const stats = fs.statSync(filePath);

          if (now - stats.mtime.getTime() > maxAgeMs) {
            fs.unlinkSync(filePath);
          }
        }
      });
    } catch (error) {
      console.error("Failed to cleanup old OpenAI TTS files:", error);
    }
  }
}
