export interface SearchHistory {
  id: number;
  word: string;
  searchCount: number;
  lastSearched: string;
  createdAt: string;
}

export interface ExamplePhrase {
  text: string;
  translation: string;
  category: string;
}

export interface ImageResult {
  url: string;
  thumbnail: string;
  title?: string;
  source?: string;
}

export interface PaginationOptions {
  page: number;
  perPage: number;
}

export interface PaginatedImageResult {
  images: ImageResult[];
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchResult {
  word: string;
  images: ImageResult[];
  phrases: ExamplePhrase[];
}

export interface AppSettings {
  googleApiKey?: string;
  googleSearchEngineId?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
  pixabayApiKey?: string;
  preferredLanguage: string;
  imageSearchProvider: "duckduckgo" | "google" | "pixabay" | "auto";
  voiceSettings: {
    provider: "openai" | "google" | "web";
    language: string;
    voice?: string;
  };
}

export interface ElectronAPI {
  searchHistory: () => Promise<SearchHistory[]>;
  addSearch: (word: string) => Promise<void>;
  searchImages: (
    word: string,
    options?: PaginationOptions,
  ) => Promise<PaginatedImageResult>;
  generatePhrases: (word: string) => Promise<ExamplePhrase[]>;
  generateExplanation: (word: string) => Promise<string | null>;
  generateAudio: (text: string, language: string) => Promise<string>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  validateApiKeys: () => Promise<{
    openai: boolean;
    google: boolean;
    pixabay: boolean;
  }>;
}
