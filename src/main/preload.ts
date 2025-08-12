import { contextBridge, ipcRenderer } from "electron";
import type {
  AppSettings,
  ElectronAPI,
  PaginationOptions,
  AnkiCard,
  AnkiFieldMapping,
} from "@shared/types";

contextBridge.exposeInMainWorld("electronAPI", {
  searchHistory: (favoritesOnly?: boolean) =>
    ipcRenderer.invoke("search-history", favoritesOnly),
  addSearch: (word: string) => ipcRenderer.invoke("add-search", word),
  toggleFavorite: (word: string, isFavorite: boolean) =>
    ipcRenderer.invoke("toggle-favorite", word, isFavorite),
  isFavorite: (word: string) => ipcRenderer.invoke("is-favorite", word),
  searchImages: (word: string, options?: PaginationOptions) =>
    ipcRenderer.invoke("search-images", word, options),
  generatePhrases: (word: string) =>
    ipcRenderer.invoke("generate-phrases", word),
  generateExplanation: (word: string) =>
    ipcRenderer.invoke("generate-explanation", word),
  generateAudio: (text: string, language: string) =>
    ipcRenderer.invoke("generate-audio", text, language),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: AppSettings) =>
    ipcRenderer.invoke("save-settings", settings),
  validateApiKeys: () => ipcRenderer.invoke("validate-api-keys"),
  // Anki operations
  ankiTestConnection: () => ipcRenderer.invoke("anki-test-connection"),
  ankiGetDecks: () => ipcRenderer.invoke("anki-get-decks"),
  ankiGetModels: () => ipcRenderer.invoke("anki-get-models"),
  ankiGetModelFields: (modelName: string) =>
    ipcRenderer.invoke("anki-get-model-fields", modelName),
  ankiCreateCard: (
    card: AnkiCard,
    deckName?: string,
    modelName?: string,
    fieldMappings?: AnkiFieldMapping[],
  ) =>
    ipcRenderer.invoke(
      "anki-create-card",
      card,
      deckName,
      modelName,
      fieldMappings,
    ),
  ankiCreateCards: (
    cards: AnkiCard[],
    deckName?: string,
    modelName?: string,
    fieldMappings?: AnkiFieldMapping[],
  ) =>
    ipcRenderer.invoke(
      "anki-create-cards",
      cards,
      deckName,
      modelName,
      fieldMappings,
    ),
} as ElectronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
