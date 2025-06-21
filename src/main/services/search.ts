import type { ImageResult, ExamplePhrase, AppSettings } from '@shared/types';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { DuckDuckGoImageProvider } from './providers/DuckDuckGoImageProvider';
import { GoogleImageProvider } from './providers/GoogleImageProvider';
import { PixabayImageProvider } from './providers/PixabayImageProvider';

export class SearchService {
  private openAI: OpenAIProvider;
  private duckDuckGo: DuckDuckGoImageProvider;
  private googleImages: GoogleImageProvider;
  private pixabay: PixabayImageProvider;

  constructor() {
    this.openAI = new OpenAIProvider();
    this.duckDuckGo = new DuckDuckGoImageProvider();
    this.googleImages = new GoogleImageProvider();
    this.pixabay = new PixabayImageProvider();
  }

  async searchImages(word: string, settings?: AppSettings): Promise<ImageResult[]> {
    try {
      const provider = settings?.imageSearchProvider || 'auto';
      
      // Determine which provider to use
      if (provider === 'google' && settings?.googleApiKey && settings?.googleSearchEngineId) {
        try {
          console.log('Attempting Google Custom Search for:', word);
          return await this.googleImages.searchImages(
            word,
            settings.googleApiKey,
            settings.googleSearchEngineId
          );
        } catch (error) {
          console.warn('Google Images search failed, falling back to DuckDuckGo:', error instanceof Error ? error.message : error);
        }
      }
      
      if (provider === 'pixabay' && settings?.pixabayApiKey) {
        try {
          return await this.pixabay.searchImages(word, settings.pixabayApiKey);
        } catch (error) {
          console.warn('Pixabay search failed, falling back to DuckDuckGo:', error);
        }
      }
      
      if (provider === 'duckduckgo' || provider === 'auto') {
        try {
          return await this.duckDuckGo.searchImages(word);
        } catch (error) {
          console.warn('DuckDuckGo search failed:', error);
          
          // Try Google as fallback if available
          if (settings?.googleApiKey && settings?.googleSearchEngineId) {
            try {
              return await this.googleImages.searchImages(
                word,
                settings.googleApiKey,
                settings.googleSearchEngineId
              );
            } catch (googleError) {
              console.warn('Google Images fallback also failed:', googleError);
            }
          }
        }
      }
      
      // Final fallback to mock data
      console.log('All image search providers failed, using mock data');
      return this.getMockImages(word);
    } catch (error) {
      console.error('Image search error:', error);
      return this.getMockImages(word);
    }
  }

  async generatePhrases(word: string, settings?: AppSettings): Promise<ExamplePhrase[]> {
    try {
      if (settings?.openaiApiKey) {
        const targetLanguage = this.getTargetLanguage(settings.preferredLanguage);
        
        try {
          return await this.openAI.generatePhrases(word, targetLanguage, settings.openaiApiKey);
        } catch (error) {
          console.warn('OpenAI phrase generation failed, falling back to mock:', error);
        }
      }
      
      // Fallback to mock phrases
      console.log('No OpenAI API key or generation failed, using mock phrases');
      return this.getMockPhrases(word, settings?.preferredLanguage);
    } catch (error) {
      console.error('Phrase generation error:', error);
      return this.getMockPhrases(word, settings?.preferredLanguage);
    }
  }

  async generateExplanation(word: string, settings?: AppSettings): Promise<string | null> {
    try {
      console.log('Generating explanation for word:', word);
      console.log('OpenAI API key available:', !!settings?.openaiApiKey);
      
      if (settings?.openaiApiKey) {
        try {
          const targetLanguage = this.getTargetLanguage(settings.preferredLanguage);
          console.log('Using target language for explanation:', targetLanguage);
          
          const explanation = await this.openAI.generateExplanation(word, targetLanguage, settings.openaiApiKey);
          console.log('Explanation generated successfully:', explanation ? 'Yes' : 'No');
          return explanation;
        } catch (error) {
          console.warn('OpenAI explanation generation failed:', error);
        }
      }
      
      // No fallback explanation - return null to indicate no explanation available
      console.log('No OpenAI API key or generation failed, no explanation available');
      return null;
    } catch (error) {
      console.error('Explanation generation error:', error);
      return null;
    }
  }

  private getMockImages(word: string): ImageResult[] {
    return Array.from({ length: 6 }, (_, i) => ({
      url: `https://picsum.photos/400/300?random=${word}-${i}`,
      thumbnail: `https://picsum.photos/200/150?random=${word}-${i}`,
      title: `${word} image ${i + 1}`,
      source: 'picsum.photos (mock)'
    }));
  }

  private getMockPhrases(word: string, language?: string): ExamplePhrase[] {
    const categories = ['Descriptive/Aesthetic', 'Practical/Work', 'Question/Amazement', 'Memory/Emotion', 'Learning/Question'];
    const translations = this.getMockTranslations(word, language);
    
    return [
      {
        text: `The ${word} was beautiful in the morning light.`,
        translation: translations[0],
        category: categories[0]
      },
      {
        text: `I need to find a good ${word} for this project.`,
        translation: translations[1],
        category: categories[1]
      },
      {
        text: `Have you ever seen such an amazing ${word}?`,
        translation: translations[2],
        category: categories[2]
      },
      {
        text: `The ${word} reminded me of my childhood.`,
        translation: translations[3],
        category: categories[3]
      },
      {
        text: `Can you help me understand this ${word} better?`,
        translation: translations[4],
        category: categories[4]
      }
    ];
  }

  private getMockTranslations(word: string, language?: string): string[] {
    const lang = language || 'es';
    
    // Simple mock translations - in a real app, this could use a translation service
    const translations: Record<string, string[]> = {
      es: [
        `El/La ${word} era hermoso/a en la luz de la mañana.`,
        `Necesito encontrar un/a buen/a ${word} para este proyecto.`,
        `¿Alguna vez has visto un/a ${word} tan increíble?`,
        `El/La ${word} me recordó mi infancia.`,
        `¿Puedes ayudarme a entender mejor este/a ${word}?`
      ],
      fr: [
        `Le/La ${word} était beau/belle dans la lumière du matin.`,
        `J'ai besoin de trouver un/une bon/bonne ${word} pour ce projet.`,
        `Avez-vous déjà vu un/une ${word} si incroyable?`,
        `Le/La ${word} m'a rappelé mon enfance.`,
        `Pouvez-vous m'aider à mieux comprendre ce/cette ${word}?`
      ]
    };
    
    return translations[lang] || translations.es;
  }

  private getTargetLanguage(preferredLanguage: string): string {
    const languageMap: Record<string, string> = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
    };
    
    return languageMap[preferredLanguage] || 'Spanish';
  }

  // Utility method to validate API keys
  async validateApiKeys(settings: AppSettings): Promise<{ openai: boolean; google: boolean; pixabay: boolean }> {
    const results = { openai: false, google: false, pixabay: false };
    
    try {
      if (settings.openaiApiKey) {
        results.openai = await this.openAI.validateApiKey(settings.openaiApiKey);
      }
      
      if (settings.googleApiKey && settings.googleSearchEngineId) {
        results.google = await this.googleImages.validateCredentials(
          settings.googleApiKey,
          settings.googleSearchEngineId
        );
      }
      
      if (settings.pixabayApiKey) {
        results.pixabay = await this.pixabay.validateApiKey(settings.pixabayApiKey);
      }
    } catch (error) {
      console.error('API key validation error:', error);
    }
    
    return results;
  }
}