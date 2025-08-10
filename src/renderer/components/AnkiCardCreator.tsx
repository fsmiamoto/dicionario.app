import React, { useState, useEffect } from "react";
import type {
  AnkiCard,
  ExamplePhrase,
  ImageResult,
  AppSettings,
} from "@shared/types";

interface AnkiCardCreatorProps {
  word: string;
  explanation: string | null;
  selectedPhrases: ExamplePhrase[];
  selectedImages: ImageResult[];
  isOpen: boolean;
  onClose: () => void;
  onCreateCard: (cards: AnkiCard[]) => void;
}

const AnkiCardCreator: React.FC<AnkiCardCreatorProps> = ({
  word,
  explanation,
  selectedPhrases,
  selectedImages,
  isOpen,
  onClose,
  onCreateCard,
}) => {
  const [deckName, setDeckName] = useState<string>("Exemplar::Vocabulary");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [availableDecks, setAvailableDecks] = useState<string[]>([]);
  const [ankiConnected, setAnkiConnected] = useState<boolean>(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      testAnkiConnection();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const appSettings = await window.electronAPI.getSettings();
      setSettings(appSettings);
      setDeckName(appSettings.anki.deckName);
      setIncludeAudio(appSettings.anki.includeAudio);
      setIncludeImages(appSettings.anki.includeImages);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const testAnkiConnection = async () => {
    try {
      const connected = await window.electronAPI.ankiTestConnection();
      setAnkiConnected(connected);

      if (connected) {
        const decks = await window.electronAPI.ankiGetDecks();
        setAvailableDecks(decks);
      }
    } catch (error) {
      console.error("Failed to test Anki connection:", error);
      setAnkiConnected(false);
    }
  };

  const generateCardsPreview = (): AnkiCard[] => {
    const cards: AnkiCard[] = [];

    selectedPhrases.forEach((phrase) => {
      // For single image mode, use the first selected image for all cards
      // For multiple images, pair each phrase with an image cyclically
      const image =
        selectedImages.length > 0
          ? selectedImages[cards.length % selectedImages.length]
          : undefined;

      cards.push({
        word,
        explanation: explanation || `Study word: ${word}`,
        phrase,
        image: includeImages ? image : undefined,
        audioUrl: includeAudio ? undefined : undefined, // Audio will be generated during creation
      });
    });

    return cards;
  };

  const handleCreateCards = async () => {
    if (!ankiConnected) {
      alert(
        "Anki is not connected. Please make sure Anki is running with AnkiConnect add-on installed.",
      );
      return;
    }

    setIsCreating(true);

    try {
      const cards = generateCardsPreview();

      // Generate audio for each card if enabled
      if (includeAudio && settings) {
        for (const card of cards) {
          try {
            const audioUrl = await window.electronAPI.generateAudio(
              card.phrase.text,
              settings.voiceSettings.language,
            );
            card.audioUrl = audioUrl;
          } catch (error) {
            console.warn(
              `Failed to generate audio for phrase: ${card.phrase.text}`,
              error,
            );
          }
        }
      }

      // Create the cards
      const result = await window.electronAPI.ankiCreateCards(cards, deckName);

      if (result.success > 0) {
        alert(
          `Successfully created ${result.success} card(s)${result.failed > 0 ? ` (${result.failed} failed)` : ""}!`,
        );
        onCreateCard(cards);
        onClose();
      } else {
        alert(
          `Failed to create cards. Please check your Anki settings and try again.`,
        );
      }
    } catch (error) {
      console.error("Failed to create Anki cards:", error);
      alert(
        "Failed to create Anki cards. Please check your Anki connection and try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  const previewCards = generateCardsPreview();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span>Create Anki Cards</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Connection Status */}
          <div
            className={`p-3 rounded-lg mb-6 ${ankiConnected ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
          >
            <div className="flex items-center space-x-2">
              {ankiConnected ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span>
                {ankiConnected
                  ? "Connected to Anki"
                  : "Anki not connected. Please make sure Anki is running with AnkiConnect add-on."}
              </span>
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Deck Name
              </label>
              <select
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none border border-gray-200 dark:border-gray-600"
                disabled={!ankiConnected}
              >
                {availableDecks.map((deck) => (
                  <option key={deck} value={deck}>
                    {deck}
                  </option>
                ))}
                <option value={deckName}>{deckName}</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeAudio}
                  onChange={(e) => setIncludeAudio(e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <span className="text-gray-900 dark:text-white text-sm">Include Audio</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <span className="text-gray-900 dark:text-white text-sm">Include Images</span>
              </label>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none border border-gray-200 dark:border-gray-600"
              rows={3}
              placeholder="Add any additional notes or context..."
            />
          </div>

          {/* Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Preview ({previewCards.length} card
              {previewCards.length !== 1 ? "s" : ""})
            </h3>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {previewCards.map((card, index) => (
                <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Front */}
                    <div>
                      <h4 className="text-sm font-medium text-primary-400 mb-2">
                        Front
                      </h4>
                      <div className="text-center">
                        {includeImages && card.image && (
                          <img
                            src={card.image.thumbnail}
                            alt={card.word}
                            className="w-20 h-20 object-cover rounded mx-auto mb-2"
                          />
                        )}
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {card.word}
                        </div>
                      </div>
                    </div>

                    {/* Back */}
                    <div>
                      <h4 className="text-sm font-medium text-primary-400 mb-2">
                        Back
                      </h4>
                      <div className="text-sm text-gray-900 dark:text-white space-y-2">
                        {card.explanation && (
                          <div>
                            <strong>Explanation:</strong> {card.explanation}
                          </div>
                        )}
                        <div>
                          <strong>Example:</strong> {card.phrase.text}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 italic">
                          {card.phrase.translation}
                        </div>
                        <div className="inline-block bg-primary-500/20 text-primary-300 px-2 py-1 rounded text-xs">
                          {card.phrase.category}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCards}
              disabled={
                !ankiConnected || isCreating || selectedPhrases.length === 0
              }
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isCreating && (
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              <span>
                {isCreating
                  ? "Creating..."
                  : `Create ${previewCards.length} Card${previewCards.length !== 1 ? "s" : ""}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnkiCardCreator;
