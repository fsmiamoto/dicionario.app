import { contextBridge, ipcRenderer } from 'electron';
import type { SearchHistory, ExamplePhrase, ImageResult, AppSettings, ElectronAPI } from '@shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  searchHistory: () => ipcRenderer.invoke('search-history'),
  addSearch: (word: string) => ipcRenderer.invoke('add-search', word),
  searchImages: (word: string) => ipcRenderer.invoke('search-images', word),
  generatePhrases: (word: string) => ipcRenderer.invoke('generate-phrases', word),
  generateExplanation: (word: string) => ipcRenderer.invoke('generate-explanation', word),
  generateAudio: (text: string, language: string) => ipcRenderer.invoke('generate-audio', text, language),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('save-settings', settings),
  validateApiKeys: () => ipcRenderer.invoke('validate-api-keys'),
} as ElectronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}