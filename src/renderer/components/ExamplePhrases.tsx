import React, { useState, useEffect } from "react";
import type { ExamplePhrase, AppSettings } from "@shared/types";

interface ExamplePhrasesProps {
  phrases: ExamplePhrase[];
  isLoading: boolean;
}

const ExamplePhrases: React.FC<ExamplePhrasesProps> = ({
  phrases,
  isLoading,
}) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState<string>("en-US");

  // Load voice settings on component mount
  useEffect(() => {
    const loadVoiceSettings = async () => {
      try {
        const settings: AppSettings = await window.electronAPI.getSettings();
        setVoiceLanguage(settings.voiceSettings.language);
      } catch (error) {
        console.error("Failed to load voice settings:", error);
      }
    };

    loadVoiceSettings();
  }, []);

  const handleCopyPhrase = async (phrase: ExamplePhrase) => {
    try {
      await navigator.clipboard.writeText(phrase.text);
      setCopiedPhrase(phrase.text);
      setTimeout(() => setCopiedPhrase(null), 2000);
    } catch (error) {
      console.error("Failed to copy phrase:", error);
    }
  };

  const handlePlayAudio = async (text: string) => {
    if (playingAudio === text) {
      // Stop current audio
      setPlayingAudio(null);
      window.speechSynthesis?.cancel();
      return;
    }

    try {
      setPlayingAudio(text);

      // Get audio from backend service
      const audioResult = await window.electronAPI.generateAudio(
        text,
        voiceLanguage,
      );

      if (audioResult === "web-speech-api") {
        // Use Web Speech API
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel(); // Stop any existing speech

          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = voiceLanguage;
          utterance.rate = 0.8;

          utterance.onend = () => setPlayingAudio(null);
          utterance.onerror = () => setPlayingAudio(null);

          window.speechSynthesis.speak(utterance);
        } else {
          throw new Error("Web Speech API not available");
        }
      } else if (audioResult.startsWith("data:audio/")) {
        // Play generated audio data URL (from OpenAI TTS or other providers)
        const audio = new Audio(audioResult);

        audio.onended = () => setPlayingAudio(null);
        audio.onerror = (error) => {
          console.error("Audio playback error:", error);
          setPlayingAudio(null);
        };

        await audio.play();
      } else if (audioResult.startsWith("file://")) {
        // Legacy file URL support (shouldn't be used anymore)
        console.warn("File URL format is deprecated, use data URL instead");
        const audio = new Audio(audioResult);

        audio.onended = () => setPlayingAudio(null);
        audio.onerror = () => setPlayingAudio(null);

        await audio.play();
      } else {
        throw new Error("Unexpected audio format");
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
      setPlayingAudio(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "Descriptive/Aesthetic": "bg-purple-500/20 text-purple-300",
      "Practical/Work": "bg-blue-500/20 text-blue-300",
      "Question/Amazement": "bg-green-500/20 text-green-300",
      "Memory/Emotion": "bg-orange-500/20 text-orange-300",
      "Learning/Question": "bg-pink-500/20 text-pink-300",
    };

    return (
      colors[category as keyof typeof colors] || "bg-gray-500/20 text-gray-300"
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span>Example Phrases</span>
      </h3>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="card animate-pulse">
                <div className="h-4 bg-surface-300 rounded mb-2"></div>
                <div className="h-3 bg-surface-300 rounded mb-3 w-3/4"></div>
                <div className="h-6 bg-surface-300 rounded w-24"></div>
              </div>
            ))
          : phrases.map((phrase, index) => (
              <div
                key={index}
                className="card group hover:bg-surface-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 space-y-2">
                    <p className="text-white font-medium leading-relaxed">
                      {phrase.text}
                    </p>
                    <p className="text-dark-400 italic text-sm">
                      {phrase.translation}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handlePlayAudio(phrase.text)}
                      className="p-2 text-dark-400 hover:text-white transition-colors"
                      title="Play audio"
                    >
                      {playingAudio === phrase.text ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 9v6h3l5-5v8l-5-5H6z"
                          />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => handleCopyPhrase(phrase)}
                      className="p-2 text-dark-400 hover:text-white transition-colors"
                      title="Copy phrase"
                    >
                      {copiedPhrase === phrase.text ? (
                        <svg
                          className="w-4 h-4 text-green-400"
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
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(phrase.category)}`}
                  >
                    {phrase.category}
                  </span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default ExamplePhrases;
