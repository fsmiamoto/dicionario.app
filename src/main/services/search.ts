import type {
  ImageResult,
  ExamplePhrase,
  AppSettings,
  PaginationOptions,
  PaginatedImageResult,
} from "@shared/types";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { GoogleImageProvider } from "./providers/GoogleImageProvider";

export class SearchService {
  private openAI: OpenAIProvider;
  private googleImages: GoogleImageProvider;

  constructor() {
    this.openAI = new OpenAIProvider();
    this.googleImages = new GoogleImageProvider();
  }

  async searchImages(
    word: string,
    settings?: AppSettings,
    options?: PaginationOptions,
  ): Promise<PaginatedImageResult> {
    const provider = settings?.imageSearchProvider || "auto";
    const pagination = options || { page: 1, perPage: 6 };

    try {
      // Try Google Custom Search if API key is available
      if (settings?.googleApiKey && settings?.googleSearchEngineId) {
        try {
          console.log("Attempting Google Custom Search for:", word);
          const images = await this.googleImages.searchImages(
            word,
            settings.googleApiKey,
            settings.googleSearchEngineId,
            true,
            pagination,
          );
          return this.formatPaginatedResult(images, pagination);
        } catch (error) {
          console.warn(
            "Google Images search failed, falling back to mock:",
            error instanceof Error ? error.message : error,
          );
        }
      }

      // Fallback to mock data
      console.log("No Google API key or search failed, using mock data");
      const mockImages = this.getMockImages(word, pagination);
      return this.formatPaginatedResult(mockImages, pagination);
    } catch (error) {
      console.error("Image search error:", error);
      const mockImages = this.getMockImages(word, pagination);
      return this.formatPaginatedResult(mockImages, pagination);
    }
  }

  async generatePhrases(
    word: string,
    settings?: AppSettings,
  ): Promise<ExamplePhrase[]> {
    try {
      if (settings?.openaiApiKey) {
        const targetLanguage = this.getTargetLanguage(
          settings.preferredLanguage,
        );

        try {
          return await this.openAI.generatePhrases(
            word,
            targetLanguage,
            settings.openaiApiKey,
          );
        } catch (error) {
          console.warn(
            "OpenAI phrase generation failed, falling back to mock:",
            error,
          );
        }
      }

      // Fallback to mock phrases
      console.log("No OpenAI API key or generation failed, using mock phrases");
      return this.getMockPhrases(word, settings?.preferredLanguage);
    } catch (error) {
      console.error("Phrase generation error:", error);
      return this.getMockPhrases(word, settings?.preferredLanguage);
    }
  }

  async generateExplanation(
    word: string,
    settings?: AppSettings,
  ): Promise<string | null> {
    try {
      console.log("Generating explanation for word:", word);
      console.log("OpenAI API key available:", !!settings?.openaiApiKey);

      if (settings?.openaiApiKey) {
        try {
          const targetLanguage = this.getTargetLanguage(
            settings.preferredLanguage,
          );
          console.log("Using target language for explanation:", targetLanguage);

          const explanation = await this.openAI.generateExplanation(
            word,
            targetLanguage,
            settings.openaiApiKey,
          );
          console.log(
            "Explanation generated successfully:",
            explanation ? "Yes" : "No",
          );
          return explanation;
        } catch (error) {
          console.warn("OpenAI explanation generation failed:", error);
        }
      }

      // No fallback explanation - return null to indicate no explanation available
      console.log(
        "No OpenAI API key or generation failed, no explanation available",
      );
      return null;
    } catch (error) {
      console.error("Explanation generation error:", error);
      return null;
    }
  }

  private getMockImages(
    word: string,
    pagination?: PaginationOptions,
  ): ImageResult[] {
    const { page = 1, perPage = 6 } = pagination || {};
    const startIndex = (page - 1) * perPage;

    return Array.from({ length: perPage }, (_, i) => ({
      url: `https://picsum.photos/400/300?random=${word}-${startIndex + i}`,
      thumbnail: `https://picsum.photos/200/150?random=${word}-${startIndex + i}`,
      title: `${word} image ${startIndex + i + 1}`,
      source: "picsum.photos (mock)",
    }));
  }

  private formatPaginatedResult(
    images: ImageResult[],
    pagination: PaginationOptions,
  ): PaginatedImageResult {
    const { page, perPage } = pagination;
    // For simplicity, we'll assume 5 pages maximum for most searches
    // In a real implementation, you'd get this from the API response
    const totalPages = Math.min(5, Math.max(1, Math.ceil(30 / perPage)));

    return {
      images,
      currentPage: page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  private getMockPhrases(word: string, language?: string): ExamplePhrase[] {
    const categories = [
      "Descriptive/Aesthetic",
      "Practical/Work",
      "Question/Amazement",
      "Memory/Emotion",
      "Learning/Question",
    ];
    const translations = this.getMockTranslations(word, language);

    return [
      {
        text: `The ${word} was beautiful in the morning light.`,
        translation: translations[0],
        category: categories[0],
      },
      {
        text: `I need to find a good ${word} for this project.`,
        translation: translations[1],
        category: categories[1],
      },
      {
        text: `Have you ever seen such an amazing ${word}?`,
        translation: translations[2],
        category: categories[2],
      },
      {
        text: `The ${word} reminded me of my childhood.`,
        translation: translations[3],
        category: categories[3],
      },
      {
        text: `Can you help me understand this ${word} better?`,
        translation: translations[4],
        category: categories[4],
      },
    ];
  }

  private getMockTranslations(word: string, language?: string): string[] {
    const lang = language || "es";

    // Simple mock translations - in a real app, this could use a translation service
    const translations: Record<string, string[]> = {
      es: [
        `El/La ${word} era hermoso/a en la luz de la mañana.`,
        `Necesito encontrar un/a buen/a ${word} para este proyecto.`,
        `¿Alguna vez has visto un/a ${word} tan increíble?`,
        `El/La ${word} me recordó mi infancia.`,
        `¿Puedes ayudarme a entender mejor este/a ${word}?`,
      ],
      fr: [
        `Le/La ${word} était beau/belle dans la lumière du matin.`,
        `J'ai besoin de trouver un/une bon/bonne ${word} pour ce projet.`,
        `Avez-vous déjà vu un/une ${word} si incroyable?`,
        `Le/La ${word} m'a rappelé mon enfance.`,
        `Pouvez-vous m'aider à mieux comprendre ce/cette ${word}?`,
      ],
    };

    return translations[lang] || translations.es;
  }

  private getTargetLanguage(preferredLanguage: string): string {
    const languageMap: Record<string, string> = {
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
    };

    return languageMap[preferredLanguage] || "Spanish";
  }

  // Utility method to validate API keys
  async validateApiKeys(
    settings: AppSettings,
  ): Promise<{ openai: boolean; google: boolean }> {
    const results = { openai: false, google: false };

    try {
      if (settings.openaiApiKey) {
        results.openai = await this.openAI.validateApiKey(
          settings.openaiApiKey,
        );
      }

      if (settings.googleApiKey && settings.googleSearchEngineId) {
        results.google = await this.googleImages.validateCredentials(
          settings.googleApiKey,
          settings.googleSearchEngineId,
        );
      }
    } catch (error) {
      console.error("API key validation error:", error);
    }

    return results;
  }
}
