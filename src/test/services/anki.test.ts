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
    it("should format word with HTML styling", async () => {
      const formatWithHtml = (ankiService as any).formatWithHtml.bind(
        ankiService,
      );

      const result = await formatWithHtml("hello", "word", mockCard);
      expect(result).toContain('<h2 style="color: #2563eb');
      expect(result).toContain("hello");
    });

    it("should format explanation with HTML styling", async () => {
      const formatWithHtml = (ankiService as any).formatWithHtml.bind(
        ankiService,
      );

      const result = await formatWithHtml(
        "A greeting",
        "explanation",
        mockCard,
      );
      expect(result).toContain('<div style="background: #f8fafc');
      expect(result).toContain("Explanation");
      expect(result).toContain("A greeting");
    });

    it("should format image with HTML img tag", async () => {
      const formatWithHtml = (ankiService as any).formatWithHtml.bind(
        ankiService,
      );

      const result = await formatWithHtml(
        "https://example.com/image.jpg",
        "image",
        mockCard,
      );
      expect(result).toContain('<img src="https://example.com/image.jpg"');
    });
  });

  describe("formatCardWithMappings", () => {
    it("should create fields based on mappings", async () => {
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

      const result = await formatCardWithMappings(mockCard, mappings);

      expect(result).toEqual({
        Front: "hello",
        Back: "A greeting used to acknowledge someone",
        Example: "Hello, how are you?",
      });
    });

    it("should apply HTML formatting when enabled", async () => {
      const formatCardWithMappings = (
        ankiService as any
      ).formatCardWithMappings.bind(ankiService);

      const mappings: AnkiFieldMapping[] = [
        { dicionarioField: "word", ankiField: "Front", includeHtml: true },
      ];

      const result = await formatCardWithMappings(mockCard, mappings);

      expect(result.Front).toContain('<h2 style="color: #2563eb');
      expect(result.Front).toContain("hello");
    });

    it("should skip null content", async () => {
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

      const result = await formatCardWithMappings(
        cardWithoutExplanation,
        mappings,
      );

      expect(result).toEqual({
        Front: "hello",
        // Back should not be present since explanation is null
      });
    });

    it("should merge multiple fields mapping to the same Anki field", async () => {
      const formatCardWithMappings = (
        ankiService as any
      ).formatCardWithMappings.bind(ankiService);

      const mappings: AnkiFieldMapping[] = [
        {
          dicionarioField: "phrase_text",
          ankiField: "Front",
          includeHtml: false,
        },
        {
          dicionarioField: "phrase_translation",
          ankiField: "Front",
          includeHtml: false,
        },
        {
          dicionarioField: "phrase_category",
          ankiField: "Front",
          includeHtml: false,
        },
      ];

      const result = await formatCardWithMappings(mockCard, mappings);

      expect(result).toEqual({
        Front: "Hello, how are you? | Olá, como você está? | Greeting/Social",
      });
    });

    it("should merge HTML and plain text content when mapping to same field", async () => {
      const formatCardWithMappings = (
        ankiService as any
      ).formatCardWithMappings.bind(ankiService);

      const mappings: AnkiFieldMapping[] = [
        { dicionarioField: "word", ankiField: "Combined", includeHtml: true },
        {
          dicionarioField: "phrase_text",
          ankiField: "Combined",
          includeHtml: false,
        },
        {
          dicionarioField: "explanation",
          ankiField: "Combined",
          includeHtml: true,
        },
      ];

      const result = await formatCardWithMappings(mockCard, mappings);

      expect(result.Combined).toContain('<h2 style="color: #2563eb');
      expect(result.Combined).toContain("hello");
      expect(result.Combined).toContain(" | Hello, how are you? | ");
      expect(result.Combined).toContain('<div style="background: #f8fafc');
      expect(result.Combined).toContain(
        "A greeting used to acknowledge someone",
      );
    });

    it("should merge fields correctly when some values are null", async () => {
      const formatCardWithMappings = (
        ankiService as any
      ).formatCardWithMappings.bind(ankiService);
      const cardWithNullValues = {
        ...mockCard,
        explanation: null,
        audioUrl: null,
      };

      const mappings: AnkiFieldMapping[] = [
        { dicionarioField: "word", ankiField: "MainField", includeHtml: false },
        {
          dicionarioField: "explanation",
          ankiField: "MainField",
          includeHtml: false,
        },
        {
          dicionarioField: "phrase_text",
          ankiField: "MainField",
          includeHtml: false,
        },
        {
          dicionarioField: "audio",
          ankiField: "MainField",
          includeHtml: false,
        },
      ];

      const result = await formatCardWithMappings(cardWithNullValues, mappings);

      expect(result).toEqual({
        MainField: "hello | Hello, how are you?",
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
