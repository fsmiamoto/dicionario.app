import { contextBridge, ipcRenderer } from "electron";
import type {
  AppSettings,
  ElectronAPI,
  PaginationOptions,
  AnkiCard,
} from "@shared/types";

contextBridge.exposeInMainWorld("electronAPI", {
  searchHistory: () => ipcRenderer.invoke("search-history"),
  addSearch: (word: string) => ipcRenderer.invoke("add-search", word),
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
  ankiCreateCard: (card: AnkiCard, deckName?: string) =>
    ipcRenderer.invoke("anki-create-card", card, deckName),
  ankiCreateCards: (cards: AnkiCard[], deckName?: string) =>
    ipcRenderer.invoke("anki-create-cards", cards, deckName),
} as ElectronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
