import { readFileSync } from "fs";
import { join } from "path";
import type { PromptTemplate, RenderedPrompt } from "@shared/types";

export class PromptsManager {
  private static instance: PromptsManager;
  private promptsCache: Map<string, PromptTemplate>;
  private readonly promptsDir: string;

  private constructor() {
    this.promptsDir = join(__dirname, "../prompts");
    this.promptsCache = new Map<string, PromptTemplate>();
  }

  public static getInstance(): PromptsManager {
    if (!PromptsManager.instance) {
      PromptsManager.instance = new PromptsManager();
    }
    return PromptsManager.instance;
  }

  public getPromptTemplate(promptName: string): PromptTemplate {
    if (this.promptsCache.has(promptName)) {
      return this.promptsCache.get(promptName)!;
    }

    const prompt = this.loadPrompt(promptName);
    this.promptsCache.set(promptName, prompt);
    return prompt;
  }

  public getRenderedPrompt(
    promptName: string,
    variables: Record<string, string>,
  ): RenderedPrompt {
    const template = this.getPromptTemplate(promptName);

    const systemPrompt = this.renderPrompt(template.system, variables);
    const userPrompt = this.renderPrompt(template.user, variables);

    return { systemPrompt, userPrompt };
  }

  private loadPrompt(promptName: string): PromptTemplate {
    try {
      const filePath = join(this.promptsDir, `${promptName}.md`);
      const content = readFileSync(filePath, "utf-8");

      const systemPromptMatch = content.match(
        /## System Prompt\n([\s\S]*?)(?=\n## |$)/,
      );
      const userPromptMatch = content.match(
        /## User Prompt Template\n([\s\S]*?)(?=\n## |$)/,
      );

      if (!systemPromptMatch || !userPromptMatch) {
        throw new Error(`Invalid prompt format in ${promptName}.md`);
      }

      return {
        system: systemPromptMatch[1].trim(),
        user: userPromptMatch[1].trim(),
      };
    } catch (error) {
      console.error(`Failed to load prompt ${promptName}:`, error);
      throw error;
    }
  }

  private renderPrompt(
    template: string,
    variables: Record<string, string>,
  ): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, "g");
      rendered = rendered.replace(placeholder, value);
    }
    return rendered;
  }
}
