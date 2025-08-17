import type {
  ExamplePhrase,
  ImageResult,
  AnkiFieldMapping,
  AnkiModelInfo,
  DicionarioDataType,
} from "@shared/types";

export interface AnkiCard {
  word: string;
  explanation: string;
  phrase: ExamplePhrase;
  image?: ImageResult;
  audioUrl?: string;
}

export interface AnkiConnectRequest {
  action: string;
  version: number;
  params?: Record<string, any>;
}

export interface AnkiConnectResponse {
  result: any;
  error: string | null;
}

export class AnkiService {
  private readonly ANKI_CONNECT_URL = "http://127.0.0.1:8765";
  private readonly API_VERSION = 6;

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendRequest({
        action: "version",
        version: this.API_VERSION,
      });
      return response.error === null && response.result >= this.API_VERSION;
    } catch (error) {
      console.error("AnkiConnect connection test failed:", error);
      return false;
    }
  }

  async getDeckNames(): Promise<string[]> {
    try {
      const response = await this.sendRequest({
        action: "deckNames",
        version: this.API_VERSION,
      });
      return response.error === null ? response.result : [];
    } catch (error) {
      console.error("Failed to get deck names:", error);
      return [];
    }
  }

  async createDeck(deckName: string): Promise<boolean> {
    try {
      const response = await this.sendRequest({
        action: "createDeck",
        version: this.API_VERSION,
        params: {
          deck: deckName,
        },
      });
      return response.error === null;
    } catch (error) {
      console.error("Failed to create deck:", error);
      return false;
    }
  }

  async addCard(
    card: AnkiCard,
    deckName: string = "Dicionario::Vocabulary",
    modelName: string = "Basic",
    fieldMappings?: AnkiFieldMapping[],
  ): Promise<boolean> {
    try {
      // Ensure the deck exists
      const deckNames = await this.getDeckNames();
      if (!deckNames.includes(deckName)) {
        const created = await this.createDeck(deckName);
        if (!created) {
          throw new Error(`Failed to create deck: ${deckName}`);
        }
      }

      const fields = fieldMappings
        ? this.formatCardWithMappings(card, fieldMappings)
        : this.formatCard(card);

      const response = await this.sendRequest({
        action: "addNote",
        version: this.API_VERSION,
        params: {
          note: {
            deckName,
            modelName,
            fields,
            tags: ["dicionario", "vocabulary", card.word.toLowerCase()],
          },
        },
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // If audio is provided, add it to the card
      if (card.audioUrl && response.result) {
        await this.addAudioToCard(response.result, card.audioUrl, card.word);
      }

      return true;
    } catch (error) {
      console.error("Failed to add card to Anki:", error);
      return false;
    }
  }

  async addCards(
    cards: AnkiCard[],
    deckName: string = "Dicionario::Vocabulary",
    modelName: string = "Basic",
    fieldMappings?: AnkiFieldMapping[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const card of cards) {
      const result = await this.addCard(
        card,
        deckName,
        modelName,
        fieldMappings,
      );
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  private formatCard(card: AnkiCard): Record<string, string> {
    const imageHtml = card.image
      ? `<img src="${card.image.thumbnail}" alt="${card.word}" style="max-width: 300px; height: auto; border-radius: 8px; margin-bottom: 16px;">`
      : "";

    const audioHtml = card.audioUrl
      ? `<audio controls style="width: 100%; margin-top: 16px;"><source src="${card.audioUrl}" type="audio/mpeg">Your browser does not support the audio element.</audio>`
      : "";

    const front = `
      <div style="text-align: center; font-family: system-ui, -apple-system, sans-serif;">
        ${imageHtml}
        <h2 style="color: #2563eb; margin: 16px 0; font-size: 2rem; font-weight: bold;">${card.word}</h2>
      </div>
    `;

    const back = `
      <div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6;">
        ${imageHtml}
        <h2 style="color: #2563eb; margin: 16px 0 24px 0; font-size: 2rem; font-weight: bold;">${card.word}</h2>
        
        ${
          card.explanation
            ? `<div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 4px;">
                 <h3 style="margin: 0 0 8px 0; color: #1e40af;">Explanation</h3>
                 <p style="margin: 0; color: #374151;">${card.explanation}</p>
               </div>`
            : ""
        }
        
        <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #0369a1;">Example Phrase</h3>
          <p style="margin: 0 0 8px 0; font-weight: 500; color: #1e293b;">${card.phrase.text}</p>
          <p style="margin: 0; font-style: italic; color: #64748b;">${card.phrase.translation}</p>
          <span style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; margin-top: 8px;">${card.phrase.category}</span>
        </div>
        
        ${audioHtml}
      </div>
    `;

    return { Front: front, Back: back };
  }

  private formatCardWithMappings(
    card: AnkiCard,
    fieldMappings: AnkiFieldMapping[],
  ): Record<string, string> {
    const fields: Record<string, string> = {};

    for (const mapping of fieldMappings) {
      const content = this.getDicionarioFieldContent(
        card,
        mapping.dicionarioField,
      );
      if (content !== null) {
        const formattedContent = mapping.includeHtml
          ? this.formatWithHtml(content, mapping.dicionarioField)
          : content;

        if (fields[mapping.ankiField]) {
          fields[mapping.ankiField] += ` | ${formattedContent}`;
        } else {
          fields[mapping.ankiField] = formattedContent;
        }
      }
    }

    return fields;
  }

  private getDicionarioFieldContent(
    card: AnkiCard,
    fieldType: DicionarioDataType,
  ): string | null {
    switch (fieldType) {
      case "word":
        return card.word;
      case "explanation":
        return card.explanation || null;
      case "phrase_text":
        return card.phrase.text;
      case "phrase_translation":
        return card.phrase.translation;
      case "phrase_category":
        return card.phrase.category;
      case "image":
        return card.image ? card.image.thumbnail : null;
      case "audio":
        return card.audioUrl || null;
      default:
        return null;
    }
  }

  private formatWithHtml(
    content: string,
    fieldType: DicionarioDataType,
  ): string {
    switch (fieldType) {
      case "word":
        return `<h2 style="color: #2563eb; margin: 16px 0; font-size: 2rem; font-weight: bold;">${content}</h2>`;
      case "explanation":
        return `<div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 8px 0; color: #1e40af;">Explanation</h3>
                  <p style="margin: 0; color: #374151;">${content}</p>
                </div>`;
      case "phrase_text":
        return `<p style="margin: 0 0 8px 0; font-weight: 500; color: #1e293b;">${content}</p>`;
      case "phrase_translation":
        return `<p style="margin: 0; font-style: italic; color: #64748b;">${content}</p>`;
      case "phrase_category":
        return `<span style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; margin-top: 8px;">${content}</span>`;
      case "image":
        return `<img src="${content}" alt="Word illustration" style="max-width: 300px; height: auto; border-radius: 8px; margin-bottom: 16px;">`;
      case "audio":
        return `<audio controls style="width: 100%; margin-top: 16px;"><source src="${content}" type="audio/mpeg">Your browser does not support the audio element.</audio>`;
      default:
        return content;
    }
  }

  private async addAudioToCard(
    noteId: number,
    audioUrl: string,
    filename: string,
  ): Promise<void> {
    try {
      await this.sendRequest({
        action: "storeMediaFile",
        version: this.API_VERSION,
        params: {
          filename: `${filename}_audio.mp3`,
          data: audioUrl.replace(/^data:audio\/[^;]+;base64,/, ""), // Remove data URL prefix if present
        },
      });
    } catch (error) {
      console.error("Failed to add audio to card:", error);
    }
  }

  private async sendRequest(
    request: AnkiConnectRequest,
  ): Promise<AnkiConnectResponse> {
    const response = await fetch(this.ANKI_CONNECT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as AnkiConnectResponse;
  }

  async getModelNames(): Promise<string[]> {
    try {
      const response = await this.sendRequest({
        action: "modelNames",
        version: this.API_VERSION,
      });
      return response.error === null ? response.result : [];
    } catch (error) {
      console.error("Failed to get model names:", error);
      return [];
    }
  }

  async getModelFieldNames(modelName: string): Promise<string[]> {
    try {
      const response = await this.sendRequest({
        action: "modelFieldNames",
        version: this.API_VERSION,
        params: {
          modelName,
        },
      });
      return response.error === null ? response.result : [];
    } catch (error) {
      console.error("Failed to get model field names:", error);
      return [];
    }
  }

  async getModelsWithFields(): Promise<AnkiModelInfo[]> {
    try {
      const modelNames = await this.getModelNames();
      const modelsWithFields: AnkiModelInfo[] = [];

      for (const modelName of modelNames) {
        const fields = await this.getModelFieldNames(modelName);
        modelsWithFields.push({ name: modelName, fields });
      }

      return modelsWithFields;
    } catch (error) {
      console.error("Failed to get models with fields:", error);
      return [];
    }
  }
}
