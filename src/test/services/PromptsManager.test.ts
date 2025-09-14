import { describe, it, expect, beforeEach } from "vitest";
import { PromptsManager } from "../../main/services/PromptsManager";
import type { PromptTemplate, RenderedPrompt } from "@shared/types";

describe("PromptsManager", () => {
  let promptsManager: PromptsManager;

  beforeEach(() => {
    promptsManager = PromptsManager.getInstance();
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = PromptsManager.getInstance();
      const instance2 = PromptsManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("getPromptTemplate", () => {
    it("should load phrase-generation prompt", () => {
      const prompt = promptsManager.getPromptTemplate("phrase-generation");
      expect(prompt).toBeDefined();
      expect(prompt.system).toContain("language learning assistant");
      expect(prompt.user).toContain("Generate 5 example sentences");
    });

    it("should load explanation-generation prompt", () => {
      const prompt = promptsManager.getPromptTemplate("explanation-generation");
      expect(prompt).toBeDefined();
      expect(prompt.system).toContain("educational explanations");
      expect(prompt.user).toContain("Explain in {{outputLanguage}}");
    });

    it("should cache loaded prompts", () => {
      const prompt1 = promptsManager.getPromptTemplate("phrase-generation");
      const prompt2 = promptsManager.getPromptTemplate("phrase-generation");
      expect(prompt1).toBe(prompt2);
    });
  });

  describe("getRenderedPrompt", () => {
    it("should render phrase generation prompt with variables", () => {
      const result = promptsManager.getRenderedPrompt("phrase-generation", {
        word: "casa",
        targetLanguage: "Spanish",
      });

      expect(result.systemPrompt).toContain("Spanish");
      expect(result.userPrompt).toContain("casa");
      expect(result.systemPrompt).not.toContain("{{targetLanguage}}");
      expect(result.userPrompt).not.toContain("{{word}}");
    });

    it("should render explanation generation prompt with variables", () => {
      const result = promptsManager.getRenderedPrompt(
        "explanation-generation",
        {
          word: "hola",
          targetLanguage: "Spanish",
          outputLanguage: "English",
          isMonolingual: "false",
        },
      );

      expect(result.systemPrompt).toContain("Spanish");
      expect(result.userPrompt).toContain("hola");
      expect(result.systemPrompt).not.toContain("{{targetLanguage}}");
      expect(result.userPrompt).toContain("Explain in English");
      expect(result.userPrompt).not.toContain("{{word}}");
    });

    it("should handle multiple occurrences of same variable", () => {
      const result = promptsManager.getRenderedPrompt("phrase-generation", {
        word: "test",
        targetLanguage: "English",
      });

      expect(result.systemPrompt).toContain("English");
      expect(result.userPrompt).toContain("test");
    });
  });

  describe("private renderPrompt method", () => {
    it("should handle template variable replacement through getRenderedPrompt", () => {
      const result = promptsManager.getRenderedPrompt("phrase-generation", {
        word: "test",
        targetLanguage: "French",
      });

      expect(result).toBeDefined();
      expect(result.systemPrompt).toContain("French");
      expect(result.userPrompt).toContain("test");
    });
  });
});
