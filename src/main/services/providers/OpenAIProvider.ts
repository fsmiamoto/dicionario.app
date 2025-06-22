import OpenAI from "openai";
import type { ExamplePhrase } from "@shared/types";

export class OpenAIProvider {
  private client: OpenAI | null = null;
  private MODEL = "gpt-4.1-mini";

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

      const systemPrompt = `You are a language learning assistant. Generate 5 diverse example sentences for vocabulary learning.

Rules:
1. Create sentences that use the given word or expression naturally
2. Vary the context: descriptive, practical, emotional, questioning, educational
3. Make sentences appropriate for language learners, don't use rare words in the rest of the phrase.
4. Provide translations in English
5. Assign one category per sentence from: Descriptive/Aesthetic, Practical/Work, Question/Amazement, Memory/Emotion, Learning/Question
6. The sentence should be generated in ${targetLanguage}
common one.

Return ONLY valid JSON in this exact format:
{
  "phrases": [
    {
      "text": "Sentence",
      "translation": "Translation in English",
      "category": "One of the 5 categories"
    }
  ]
}`;

      const userPrompt = `Generate 5 example sentences for the word: "${word}"`;

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
    apiKey?: string,
  ): Promise<string> {
    try {
      console.log(
        "OpenAI generateExplanation called for word:",
        word,
        "in language:",
        targetLanguage,
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

      const systemPrompt = `You are a language learning assistant specializing in clear, educational explanations for ${targetLanguage} language learners.

Your task is to provide a comprehensive yet concise explanation of ${targetLanguage} words, phrases, or expressions that helps language learners understand:
1. The primary and other meanings within ${targetLanguage}
2. How and when it's commonly used in ${targetLanguage}-speaking contexts
3. Register level (formal, informal, slang, colloquial) within ${targetLanguage} culture
4. Common collocations or phrases it appears in

Keep explanations:
- Clear and accessible for intermediate ${targetLanguage} language learners
- Try to keep it up to a short paragraph (3-4 lines)
- Educational but not overly academic
- Use bullet points to make it easier to read
- Focused on practical understanding within ${targetLanguage} context
- Include cultural context specific to ${targetLanguage}-speaking countries when relevant

IMPORTANT: Focus specifically on the ${targetLanguage} meaning and usage. If this word exists in multiple languages, explain it within the ${targetLanguage} context only.

**FORMAT REQUIREMENTS:**
- Use proper Markdown formatting
- Use **bold** for emphasis on important terms
- Use bullet points with - for lists
- Use *italics* for register levels (formal, informal, etc.)
- Don't include any headers
- Keep the overall structure concise and scannable`;

      const userPrompt = `Explain in English the word or expression: "${word}"`;

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
