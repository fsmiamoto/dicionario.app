import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Electron API
const mockElectronAPI = {
  searchHistory: vi.fn().mockResolvedValue([
    {
      id: 1,
      word: "test",
      searchCount: 3,
      lastSearched: "2024-01-01",
      createdAt: "2024-01-01",
    },
    {
      id: 2,
      word: "example",
      searchCount: 1,
      lastSearched: "2024-01-02",
      createdAt: "2024-01-02",
    },
  ]),
  addSearch: vi.fn().mockResolvedValue(undefined),
  searchImages: vi.fn().mockResolvedValue([
    {
      url: "https://example.com/image1.jpg",
      thumbnail: "https://example.com/thumb1.jpg",
      title: "Test Image 1",
    },
    {
      url: "https://example.com/image2.jpg",
      thumbnail: "https://example.com/thumb2.jpg",
      title: "Test Image 2",
    },
  ]),
  generatePhrases: vi.fn().mockResolvedValue([
    {
      text: "This is a test phrase.",
      translation: "Esta es una frase de prueba.",
      category: "Descriptive/Aesthetic",
    },
    {
      text: "I need to test this.",
      translation: "Necesito probar esto.",
      category: "Practical/Work",
    },
  ]),
  generateAudio: vi.fn().mockResolvedValue("web-speech-api"),
  getSettings: vi.fn().mockResolvedValue({
    preferredLanguage: "en",
    voiceSettings: { provider: "web", language: "en-US" },
  }),
  saveSettings: vi.fn().mockResolvedValue(undefined),
};

// Mock window.electronAPI
Object.defineProperty(window, "electronAPI", {
  value: mockElectronAPI,
  writable: true,
});

// Mock Web Speech API
const mockSpeechSynthesis = {
  cancel: vi.fn(),
  speak: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
};

Object.defineProperty(window, "speechSynthesis", {
  value: mockSpeechSynthesis,
  writable: true,
});

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text: string;
  lang: string;
  rate: number;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
    this.lang = "en-US";
    this.rate = 1;
  }
}

Object.defineProperty(window, "SpeechSynthesisUtterance", {
  value: MockSpeechSynthesisUtterance,
  writable: true,
});

// Note: Clipboard API is mocked per-test to avoid conflicts
