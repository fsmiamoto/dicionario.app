import React, { useState, useEffect } from "react";
import type { AppSettings } from "@shared/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    preferredLanguage: "en",
    imageSearchProvider: "auto",
    voiceSettings: {
      provider: "web",
      language: "en-US",
    },
    anki: {
      enabled: false,
      deckName: "Dicionario::Vocabulary",
      cardTemplate: "basic",
      includeAudio: true,
      includeImages: true,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [ankiConnected, setAnkiConnected] = useState<boolean>(false);
  const [testingAnkiConnection, setTestingAnkiConnection] =
    useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      testAnkiConnection();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const currentSettings = await window.electronAPI.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.electronAPI.saveSettings(settings);
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVoiceSettingChange = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      voiceSettings: {
        ...prev.voiceSettings,
        [field]: value,
      },
    }));
  };

  const handleAnkiSettingChange = (field: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      anki: {
        ...prev.anki,
        [field]: value,
      },
    }));
  };

  const testAnkiConnection = async () => {
    setTestingAnkiConnection(true);
    try {
      const connected = await window.electronAPI.ankiTestConnection();
      setAnkiConnected(connected);
    } catch (error) {
      console.error("Failed to test Anki connection:", error);
      setAnkiConnected(false);
    } finally {
      setTestingAnkiConnection(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-200 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-surface-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
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

        <div className="space-y-6">
          {/* API Keys Section */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">API Keys</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Google API Key (for image search & TTS)
                </label>
                <input
                  type="password"
                  value={settings.googleApiKey || ""}
                  onChange={(e) =>
                    handleInputChange("googleApiKey", e.target.value)
                  }
                  placeholder="Enter Google API key..."
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  OpenAI API Key (for phrase generation & TTS)
                </label>
                <input
                  type="password"
                  value={settings.openaiApiKey || ""}
                  onChange={(e) =>
                    handleInputChange("openaiApiKey", e.target.value)
                  }
                  placeholder="Enter OpenAI API key..."
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Google Search Engine ID (for image search)
                </label>
                <input
                  type="text"
                  value={settings.googleSearchEngineId || ""}
                  onChange={(e) =>
                    handleInputChange("googleSearchEngineId", e.target.value)
                  }
                  placeholder="Enter Google Custom Search Engine ID..."
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Language</h3>
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Preferred Language
              </label>
              <select
                value={settings.preferredLanguage}
                onChange={(e) =>
                  handleInputChange("preferredLanguage", e.target.value)
                }
                className="input-field w-full"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
          </div>

          {/* Image Search Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Image Search
            </h3>
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Image Search Provider
              </label>
              <select
                value={settings.imageSearchProvider}
                onChange={(e) =>
                  handleInputChange("imageSearchProvider", e.target.value)
                }
                className="input-field w-full"
              >
                <option value="auto">Auto (Google with mock fallback)</option>
                <option value="google">
                  Google Custom Search (Requires API key)
                </option>
              </select>
            </div>
          </div>

          {/* Voice Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Voice Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  TTS Provider
                </label>
                <select
                  value={settings.voiceSettings.provider}
                  onChange={(e) =>
                    handleVoiceSettingChange("provider", e.target.value)
                  }
                  className="input-field w-full"
                >
                  <option value="web">Web Speech API (Free)</option>
                  <option value="openai">OpenAI TTS (Requires API key)</option>
                  <option value="google">Google TTS (Requires API key)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Voice Language
                </label>
                <select
                  value={settings.voiceSettings.language}
                  onChange={(e) =>
                    handleVoiceSettingChange("language", e.target.value)
                  }
                  className="input-field w-full"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="es-MX">Spanish (Mexico)</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="pt-BR">Portuguese (Brazil)</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="ko-KR">Korean</option>
                  <option value="zh-CN">Chinese (Simplified)</option>
                </select>
              </div>

              {/* OpenAI Voice Selection */}
              {settings.voiceSettings.provider === "openai" && (
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-2">
                    OpenAI Voice
                  </label>
                  <select
                    value={settings.voiceSettings.voice || "alloy"}
                    onChange={(e) =>
                      handleVoiceSettingChange("voice", e.target.value)
                    }
                    className="input-field w-full"
                  >
                    <option value="alloy">Alloy</option>
                    <option value="echo">Echo</option>
                    <option value="fable">Fable</option>
                    <option value="onyx">Onyx</option>
                    <option value="nova">Nova</option>
                    <option value="shimmer">Shimmer</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Anki Integration Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span>Anki Integration</span>
            </h3>

            {/* Connection Status */}
            <div
              className={`p-3 rounded-lg mb-4 ${ankiConnected ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
            >
              <div className="flex items-center justify-between">
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
                  <span className="text-sm">
                    {ankiConnected
                      ? "Anki is connected and ready"
                      : "Anki not connected. Please ensure Anki is running with AnkiConnect add-on."}
                  </span>
                </div>
                <button
                  onClick={testAnkiConnection}
                  disabled={testingAnkiConnection}
                  className="text-xs bg-surface-300 hover:bg-surface-400 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
                >
                  {testingAnkiConnection ? "Testing..." : "Test"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Enable Anki Integration */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="anki-enabled"
                  checked={settings.anki.enabled}
                  onChange={(e) =>
                    handleAnkiSettingChange("enabled", e.target.checked)
                  }
                  className="w-4 h-4 text-primary-500 bg-surface-300 border-surface-400 rounded focus:ring-primary-500"
                />
                <label
                  htmlFor="anki-enabled"
                  className="text-sm font-medium text-white"
                >
                  Enable Anki Integration
                </label>
              </div>

              {settings.anki.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Deck Name
                    </label>
                    <input
                      type="text"
                      value={settings.anki.deckName}
                      onChange={(e) =>
                        handleAnkiSettingChange("deckName", e.target.value)
                      }
                      placeholder="Dicionario::Vocabulary"
                      className="input-field w-full"
                    />
                    <p className="text-xs text-dark-400 mt-1">
                      Use :: to create nested decks (e.g.,
                      "Language::Japanese::Vocabulary")
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Card Template
                    </label>
                    <select
                      value={settings.anki.cardTemplate}
                      onChange={(e) =>
                        handleAnkiSettingChange("cardTemplate", e.target.value)
                      }
                      className="input-field w-full"
                    >
                      <option value="basic">Basic (Front/Back)</option>
                      <option value="cloze">Cloze Deletion</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="anki-include-audio"
                        checked={settings.anki.includeAudio}
                        onChange={(e) =>
                          handleAnkiSettingChange(
                            "includeAudio",
                            e.target.checked,
                          )
                        }
                        className="w-4 h-4 text-primary-500 bg-surface-300 border-surface-400 rounded focus:ring-primary-500"
                      />
                      <label
                        htmlFor="anki-include-audio"
                        className="text-sm font-medium text-white"
                      >
                        Include Audio in Cards
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="anki-include-images"
                        checked={settings.anki.includeImages}
                        onChange={(e) =>
                          handleAnkiSettingChange(
                            "includeImages",
                            e.target.checked,
                          )
                        }
                        className="w-4 h-4 text-primary-500 bg-surface-300 border-surface-400 rounded focus:ring-primary-500"
                      />
                      <label
                        htmlFor="anki-include-images"
                        className="text-sm font-medium text-white"
                      >
                        Include Images in Cards
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!ankiConnected && (
              <div className="mt-4 p-3 bg-surface-300 rounded-lg">
                <p className="text-sm text-dark-400">
                  <strong className="text-white">Setup Instructions:</strong>
                  <br />
                  1. Install Anki from{" "}
                  <span className="text-primary-400">
                    https://apps.ankiweb.net
                  </span>
                  <br />
                  2. Install AnkiConnect add-on (code: 2055492159)
                  <br />
                  3. Restart Anki and keep it running
                  <br />
                  4. Click "Test" to verify the connection
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 mt-8">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-surface-300 rounded-lg">
          <p className="text-sm text-dark-400">
            <strong className="text-white">Note:</strong> API keys are stored
            locally and are only used to enhance functionality. The app works
            with mock data when no keys are provided.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
