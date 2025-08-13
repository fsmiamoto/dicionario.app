import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnkiService } from "../../main/services/anki";
import type { AnkiFieldMapping, DicionarioDataType } from "@shared/types";

// Mock fetch globally
global.fetch = vi.fn();

describe("AnkiService Field Mapping", () => {
  let ankiService: AnkiService;
  const mockCard = {
    word: "hello",
    explanation: "A greeting used to acknowledge someone",
    phrase: {
      text: "Hello, how are you?",
      translation: "Olá, como você está?",
      category: "Greeting/Social",
    },
    image: {
      url: "https://example.com/image.jpg",
      thumbnail: "https://example.com/thumb.jpg",
    },
    audioUrl: "https://example.com/audio.mp3",
  };

  beforeEach(() => {
    ankiService = new AnkiService();
    vi.resetAllMocks();
  });

  describe("getDicionarioFieldContent", () => {
    it("should extract word field correctly", () => {
      // Access private method for testing
      const getDicionarioFieldContent = (
        ankiService as any
      ).getDicionarioFieldContent.bind(ankiService);

      expect(getDicionarioFieldContent(mockCard, "word")).toBe("hello");
    });

    it("should extract explanation field correctly", () => {
      const getDicionarioFieldContent = (
        ankiService as any
      ).getDicionarioFieldContent.bind(ankiService);

      expect(getDicionarioFieldContent(mockCard, "explanation")).toBe(
        "A greeting used to acknowledge someone",
      );
    });

    it("should extract phrase fields correctly", () => {
      const getDicionarioFieldContent = (
        ankiService as any
      ).getDicionarioFieldContent.bind(ankiService);

      expect(getDicionarioFieldContent(mockCard, "phrase_text")).toBe(
        "Hello, how are you?",
      );
      expect(getDicionarioFieldContent(mockCard, "phrase_translation")).toBe(
        "Olá, como você está?",
      );
      expect(getDicionarioFieldContent(mockCard, "phrase_category")).toBe(
        "Greeting/Social",
      );
    });

    it("should handle missing explanation", () => {
      const getDicionarioFieldContent = (
        ankiService as any
      ).getDicionarioFieldContent.bind(ankiService);
      const cardWithoutExplanation = { ...mockCard, explanation: null };

      expect(
        getDicionarioFieldContent(cardWithoutExplanation, "explanation"),
      ).toBe(null);
    });

    it("should handle image and audio fields", () => {
      const getDicionarioFieldContent = (
        ankiService as any
      ).getDicionarioFieldContent.bind(ankiService);

      expect(getDicionarioFieldContent(mockCard, "image")).toBe(
        "https://example.com/thumb.jpg",
      );
      expect(getDicionarioFieldContent(mockCard, "audio")).toBe(
        "https://example.com/audio.mp3",
      );
    });
  });

  describe("formatWithHtml", () => {
    it("should format word with HTML styling", () => {
      const formatWithHtml = (ankiService as any).formatWithHtml.bind(
        ankiService,
      );

      const result = formatWithHtml("hello", "word");
      expect(result).toContain('<h2 style="color: #2563eb');
      expect(result).toContain("hello");
    });

    it("should format explanation with HTML styling", () => {
      const formatWithHtml = (ankiService as any).formatWithHtml.bind(
        ankiService,
      );

      const result = formatWithHtml("A greeting", "explanation");
      expect(result).toContain('<div style="background: #f8fafc');
      expect(result).toContain("Explanation");
      expect(result).toContain("A greeting");
    });

    it("should format image with HTML img tag", () => {
      const formatWithHtml = (ankiService as any).formatWithHtml.bind(
        ankiService,
      );

      const result = formatWithHtml("https://example.com/image.jpg", "image");
      expect(result).toContain('<img src="https://example.com/image.jpg"');
    });
  });

  describe("formatCardWithMappings", () => {
    it("should create fields based on mappings", () => {
      const formatCardWithMappings = (
        ankiService as any
      ).formatCardWithMappings.bind(ankiService);

      const mappings: AnkiFieldMapping[] = [
        { dicionarioField: "word", ankiField: "Front", includeHtml: false },
        {
          dicionarioField: "explanation",
          ankiField: "Back",
          includeHtml: false,
        },
        {
          dicionarioField: "phrase_text",
          ankiField: "Example",
          includeHtml: false,
        },
      ];

      const result = formatCardWithMappings(mockCard, mappings);

      expect(result).toEqual({
        Front: "hello",
        Back: "A greeting used to acknowledge someone",
        Example: "Hello, how are you?",
      });
    });

    it("should apply HTML formatting when enabled", () => {
      const formatCardWithMappings = (
        ankiService as any
      ).formatCardWithMappings.bind(ankiService);

      const mappings: AnkiFieldMapping[] = [
        { dicionarioField: "word", ankiField: "Front", includeHtml: true },
      ];

      const result = formatCardWithMappings(mockCard, mappings);

      expect(result.Front).toContain('<h2 style="color: #2563eb');
      expect(result.Front).toContain("hello");
    });

    it("should skip null content", () => {
      const formatCardWithMappings = (
        ankiService as any
      ).formatCardWithMappings.bind(ankiService);
      const cardWithoutExplanation = { ...mockCard, explanation: null };

      const mappings: AnkiFieldMapping[] = [
        { dicionarioField: "word", ankiField: "Front", includeHtml: false },
        {
          dicionarioField: "explanation",
          ankiField: "Back",
          includeHtml: false,
        },
      ];

      const result = formatCardWithMappings(cardWithoutExplanation, mappings);

      expect(result).toEqual({
        Front: "hello",
        // Back should not be present since explanation is null
      });
    });
  });

  describe("getModelsWithFields", () => {
    it("should fetch models and their fields", async () => {
      // Mock successful responses
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ result: ["Basic", "Cloze"], error: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ result: ["Front", "Back"], error: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ result: ["Text", "Extra"], error: null }),
        });

      const result = await ankiService.getModelsWithFields();

      expect(result).toEqual([
        { name: "Basic", fields: ["Front", "Back"] },
        { name: "Cloze", fields: ["Text", "Extra"] },
      ]);
    });

    it("should handle errors gracefully", async () => {
      (fetch as any).mockRejectedValue(new Error("Connection failed"));

      const result = await ankiService.getModelsWithFields();

      expect(result).toEqual([]);
    });
  });
});
