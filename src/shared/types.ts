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
  imageSearchProvider: 'duckduckgo' | 'google' | 'pixabay' | 'auto';
  voiceSettings: {
    provider: 'google' | 'web';
    language: string;
    voice?: string;
  };
}