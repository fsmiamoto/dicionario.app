import React, { useState, useEffect } from 'react';
import type { AppSettings } from '@shared/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    preferredLanguage: 'en',
    imageSearchProvider: 'auto',
    voiceSettings: {
      provider: 'web',
      language: 'en-US',
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const currentSettings = await window.electronAPI.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.electronAPI.saveSettings(settings);
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVoiceSettingChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      voiceSettings: {
        ...prev.voiceSettings,
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface-200 rounded-lg p-6 w-full max-w-md border border-surface-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  value={settings.googleApiKey || ''}
                  onChange={(e) => handleInputChange('googleApiKey', e.target.value)}
                  placeholder="Enter Google API key..."
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  OpenAI API Key (for phrase generation)
                </label>
                <input
                  type="password"
                  value={settings.openaiApiKey || ''}
                  onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
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
                  value={settings.googleSearchEngineId || ''}
                  onChange={(e) => handleInputChange('googleSearchEngineId', e.target.value)}
                  placeholder="Enter Google Custom Search Engine ID..."
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Pixabay API Key (alternative image search)
                </label>
                <input
                  type="password"
                  value={settings.pixabayApiKey || ''}
                  onChange={(e) => handleInputChange('pixabayApiKey', e.target.value)}
                  placeholder="Enter Pixabay API key..."
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
                onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
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
            <h3 className="text-lg font-medium text-white mb-4">Image Search</h3>
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Image Search Provider
              </label>
              <select
                value={settings.imageSearchProvider}
                onChange={(e) => handleInputChange('imageSearchProvider', e.target.value)}
                className="input-field w-full"
              >
                <option value="auto">Auto (DuckDuckGo with fallbacks)</option>
                <option value="duckduckgo">DuckDuckGo (Free, no API key)</option>
                <option value="google">Google Custom Search (Requires API key)</option>
                <option value="pixabay">Pixabay (Free API with key)</option>
              </select>
            </div>
          </div>

          {/* Voice Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Voice Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  TTS Provider
                </label>
                <select
                  value={settings.voiceSettings.provider}
                  onChange={(e) => handleVoiceSettingChange('provider', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="web">Web Speech API (Free)</option>
                  <option value="google">Google TTS (Requires API key)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Voice Language
                </label>
                <select
                  value={settings.voiceSettings.language}
                  onChange={(e) => handleVoiceSettingChange('language', e.target.value)}
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
            </div>
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
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-surface-300 rounded-lg">
          <p className="text-sm text-dark-400">
            <strong className="text-white">Note:</strong> API keys are stored locally and are only used to enhance functionality. 
            The app works with mock data when no keys are provided.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;