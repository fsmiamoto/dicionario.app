import OpenAI from "openai";
import type { ExamplePhrase } from "@shared/types";
import { PromptsManager } from "../PromptsManager";

export class OpenAIProvider {
  private client: OpenAI | null = null;
  private MODEL = "gpt-4.1-mini";
  private promptsManager: PromptsManager;

  constructor(promptsManager?: PromptsManager) {
    this.promptsManager = promptsManager || PromptsManager.getInstance();
  }

  private initializeClient(apiKey: string): void {
    if (!this.client || this.client.apiKey !== apiKey) {
      this.client = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  async generatePhrases(
    word: string,
    targetLanguage: string = "Spanish",
    apiKey?: string,
  ): Promise<ExamplePhrase[]> {
    try {
      if (!apiKey) {
        throw new Error("OpenAI API key required");
      }

      this.initializeClient(apiKey);

      if (!this.client) {
        throw new Error("Failed to initialize OpenAI client");
      }

      const { systemPrompt, userPrompt } =
        this.promptsManager.getRenderedPrompt("phrase-generation", {
          word,
          targetLanguage,
        });

      const completion = await this.client.chat.completions.create({
        model: this.MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error("No response from OpenAI");
      }

      const parsedResponse = JSON.parse(responseContent);

      if (!parsedResponse.phrases || !Array.isArray(parsedResponse.phrases)) {
        throw new Error("Invalid response format from OpenAI");
      }

      // Validate and clean the response
      const phrases: ExamplePhrase[] = parsedResponse.phrases
        .filter(
          (phrase: any) =>
            phrase.text &&
            phrase.translation &&
            phrase.category &&
            typeof phrase.text === "string" &&
            typeof phrase.translation === "string" &&
            typeof phrase.category === "string",
        )
        .slice(0, 5) // Ensure max 5 phrases
        .map((phrase: any) => ({
          text: phrase.text.trim(),
          translation: phrase.translation.trim(),
          category: phrase.category.trim(),
        }));

      if (phrases.length === 0) {
        throw new Error("No valid phrases received from OpenAI");
      }

      return phrases;
    } catch (error) {
      console.error("OpenAI phrase generation error:", error);
      throw error;
    }
  }

  async generateExplanation(
    word: string,
    targetLanguage: string = "English",
    outputLanguage: string = "English",
    isMonolingual: boolean = false,
    apiKey?: string,
  ): Promise<string> {
    try {
      console.log(
        "OpenAI generateExplanation called for word:",
        word,
        "target:",
        targetLanguage,
        "output:",
        outputLanguage,
        "monolingual:",
        isMonolingual,
      );

      if (!apiKey) {
        console.error("OpenAI API key not provided");
        throw new Error("OpenAI API key required");
      }

      this.initializeClient(apiKey);

      if (!this.client) {
        console.error("Failed to initialize OpenAI client");
        throw new Error("Failed to initialize OpenAI client");
      }

      console.log("OpenAI client initialized successfully");

      const { systemPrompt, userPrompt } =
        this.promptsManager.getRenderedPrompt("explanation-generation", {
          word,
          targetLanguage,
          outputLanguage,
          isMonolingual: isMonolingual ? "true" : "false",
        });

      const completion = await this.client.chat.completions.create({
        model: this.MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent, factual explanations
        max_tokens: 400,
      });

      const explanation = completion.choices[0]?.message?.content;
      console.log("OpenAI response received:", !!explanation);

      if (!explanation) {
        console.error("No explanation content in OpenAI response");
        throw new Error("No explanation received from OpenAI");
      }

      console.log(
        "Explanation generated successfully, length:",
        explanation.length,
      );
      return explanation.trim();
    } catch (error) {
      console.error("OpenAI explanation generation error:", error);
      throw error;
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      this.initializeClient(apiKey);

      if (!this.client) {
        return false;
      }

      // Test with a minimal request
      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5,
      });

      return !!completion.choices[0]?.message?.content;
    } catch (error) {
      console.error("OpenAI API key validation failed:", error);
      return false;
    }
  }
}
