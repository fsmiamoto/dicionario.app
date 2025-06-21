import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import SearchBar, { type SearchBarRef } from './components/SearchBar';
import WordExplanation from './components/WordExplanation';
import VisualContext from './components/VisualContext';
import ExamplePhrases from './components/ExamplePhrases';
import SettingsModal from './components/SettingsModal';
import { handleKeyboardShortcut, getModifierKey } from './utils/keyboard';
import type { SearchResult } from '@shared/types';

function App() {
  const [currentWord, setCurrentWord] = useState<string>('');
  const [searchResult, setSearchResult] = useState<SearchResult | undefined>();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const searchBarRef = useRef<SearchBarRef>(null);

  const handleSearch = async (word: string) => {
    if (!word.trim()) return;

    setIsLoading(true);
    setCurrentWord(word);
    setExplanation(null); // Reset explanation

    try {
      // Add to search history
      await window.electronAPI.addSearch(word);

      // Fetch images, phrases, and explanation in parallel with independent error handling
      const [images, phrases, wordExplanation] = await Promise.allSettled([
        window.electronAPI.searchImages(word),
        window.electronAPI.generatePhrases(word),
        window.electronAPI.generateExplanation(word)
      ]);

      // Handle images result
      const imageResults = images.status === 'fulfilled' ? images.value : [];
      
      // Handle phrases result
      const phraseResults = phrases.status === 'fulfilled' ? phrases.value : [];
      
      // Handle explanation result
      const explanationResult = wordExplanation.status === 'fulfilled' ? wordExplanation.value : null;

      // Log any failures for debugging
      if (images.status === 'rejected') {
        console.error('Images search failed:', images.reason);
      }
      if (phrases.status === 'rejected') {
        console.error('Phrases generation failed:', phrases.reason);
      }
      if (wordExplanation.status === 'rejected') {
        console.error('Explanation generation failed:', wordExplanation.reason);
      }

      setSearchResult({
        word,
        images: imageResults,
        phrases: phraseResults
      });
      setExplanation(explanationResult);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle focus search shortcut (Cmd/Ctrl + K)
  const handleFocusSearch = () => {
    searchBarRef.current?.focus();
  };

  // Handle paste and search shortcut (Cmd/Ctrl + P)
  const handlePasteAndSearch = async () => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        console.warn('Clipboard API not available');
        return;
      }

      const clipboardText = await navigator.clipboard.readText();
      const trimmedText = clipboardText.trim();

      if (trimmedText) {
        // Set the search query
        searchBarRef.current?.setQuery(trimmedText);
        searchBarRef.current?.focus();
        
        // Automatically trigger search if the text looks like a single word or short phrase
        if (trimmedText.length > 0 && trimmedText.length < 100 && !trimmedText.includes('\n')) {
          handleSearch(trimmedText);
        }
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field (except for our paste shortcut)
      const target = event.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
      
      if (isInInput && event.key.toLowerCase() !== 'p') {
        return;
      }

      const modifierKey = getModifierKey();
      
      handleKeyboardShortcut(event, [
        {
          key: 'k',
          modifierKey: modifierKey as 'metaKey' | 'ctrlKey',
          handler: handleFocusSearch,
        },
        {
          key: 'p',
          modifierKey: modifierKey as 'metaKey' | 'ctrlKey',
          handler: handlePasteAndSearch,
        },
      ]);
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface-100 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Header onSettingsClick={() => setShowSettings(true)} />

        <div className="mt-8">
          <SearchBar ref={searchBarRef} onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {currentWord && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              "{currentWord}"
            </h2>

            {/* Word Explanation Section */}
            <WordExplanation
              word={currentWord}
              explanation={explanation}
              isLoading={isLoading}
            />

            {/* Images and Phrases Grid */}
            {searchResult && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <VisualContext
                  images={searchResult.images}
                  word={currentWord}
                  isLoading={isLoading}
                />

                <ExamplePhrases
                  phrases={searchResult.phrases}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        )}

      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App;
