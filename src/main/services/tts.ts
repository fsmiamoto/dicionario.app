import { GoogleTTSProvider } from "./providers/GoogleTTSProvider";

export class TTSService {
  private googleTTS: GoogleTTSProvider;

  constructor() {
    this.googleTTS = new GoogleTTSProvider();
  }

  async generateAudio(
    text: string,
    language: string = "ja-JP",
    settings?: any,
  ): Promise<string> {
    try {
      // Try Google TTS first if API key is available
      if (
        settings?.googleApiKey &&
        settings?.voiceSettings?.provider === "google"
      ) {
        try {
          return await this.googleTTS.generateAudio(
            text,
            "ja-JP",
            settings.googleApiKey,
            settings.voiceSettings?.voice,
          );
        } catch (error) {
          console.warn(
            "Google TTS failed, falling back to Web Speech API:",
            error,
          );
        }
      }

      // Fallback: Return indication for Web Speech API usage
      // The frontend will handle Web Speech API directly
      return "web-speech-api";
    } catch (error) {
      console.error("TTS service error:", error);
      // Return mock data as last resort
      return `data:audio/wav;base64,mock-audio-${encodeURIComponent(text)}`;
    }
  }

  async getAvailableVoices(
    language: string,
    settings?: any,
  ): Promise<string[]> {
    try {
      if (
        settings?.googleApiKey &&
        settings?.voiceSettings?.provider === "google"
      ) {
        return await this.googleTTS.getAvailableVoices(
          language,
          settings.googleApiKey,
        );
      }

      // Return default voices for Web Speech API
      return ["default"];
    } catch (error) {
      console.error("Failed to get available voices:", error);
      return ["default"];
    }
  }

  cleanupOldFiles(): void {
    try {
      this.googleTTS.cleanupOldFiles();
    } catch (error) {
      console.error("Failed to cleanup old TTS files:", error);
    }
  }
}
