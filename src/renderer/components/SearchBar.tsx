import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { SearchHistory } from "@shared/types";

interface SearchBarProps {
  onSearch: (word: string) => void;
  isLoading: boolean;
}

export interface SearchBarRef {
  focus: () => void;
  setQuery: (query: string) => void;
  getQuery: () => string;
}

const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(
  ({ onSearch, isLoading }, ref) => {
    const [query, setQuery] = useState("");
    const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<SearchHistory[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showRecentSearches, setShowRecentSearches] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      loadSearchHistory();
    }, []);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
        if (!query.trim() && searchHistory.length > 0) {
          setShowRecentSearches(true);
        }
      },
      setQuery: (newQuery: string) => {
        setQuery(newQuery);
      },
      getQuery: () => query,
    }));

    useEffect(() => {
      if (query.trim()) {
        const filtered = searchHistory
          .filter((item) =>
            item.word.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 8);
        setFilteredHistory(filtered);
        setShowDropdown(filtered.length > 0);
        setShowRecentSearches(false);
      } else {
        setShowDropdown(false);
        if (showRecentSearches) {
          const recent = searchHistory.slice(0, 5);
          setFilteredHistory(recent);
          setShowDropdown(recent.length > 0);
        }
      }
      setSelectedIndex(-1);
    }, [query, searchHistory, showRecentSearches]);

    const loadSearchHistory = async () => {
      try {
        const history = await window.electronAPI.searchHistory();
        setSearchHistory(history);
      } catch (error) {
        console.error("Failed to load search history:", error);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
        setShowDropdown(false);
        loadSearchHistory(); // Refresh history after search
      }
    };

    const handleSelectFromHistory = (word: string) => {
      setQuery(word);
      setShowDropdown(false);
      setShowRecentSearches(false);
      onSearch(word);
      loadSearchHistory();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showDropdown) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredHistory.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredHistory.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSelectFromHistory(filteredHistory[selectedIndex].word);
          } else if (query.trim()) {
            handleSubmit(e);
          }
          break;
        case "Escape":
          setShowDropdown(false);
          setShowRecentSearches(false);
          setSelectedIndex(-1);
          break;
      }
    };

    const handleBlur = (e: React.FocusEvent) => {
      // Delay hiding dropdown to allow clicking on items
      setTimeout(() => {
        if (!dropdownRef.current?.contains(document.activeElement)) {
          setShowDropdown(false);
          setShowRecentSearches(false);
        }
      }, 150);
    };

    const handleFocus = () => {
      if (!query.trim() && searchHistory.length > 0) {
        setShowRecentSearches(true);
      } else if (query && filteredHistory.length > 0) {
        setShowDropdown(true);
      }
    };

    return (
      <div className="relative">
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onFocus={handleFocus}
              placeholder="Enter a word to learn..."
              className="input-field pl-12 pr-12 w-full text-lg"
              disabled={isLoading}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setShowDropdown(false);
                  setShowRecentSearches(false);
                  inputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg
                  className="h-5 w-5"
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
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Searching...</span>
              </div>
            ) : (
              "Search"
            )}
          </button>
        </form>

        {showDropdown && filteredHistory.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            {showRecentSearches && !query.trim() && (
              <div className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm font-medium border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900">
                Recent Searches
              </div>
            )}
            {filteredHistory.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleSelectFromHistory(item.word)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                  index === selectedIndex ? "bg-gray-100 dark:bg-slate-700" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.word}
                  </span>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
                    <span>{item.searchCount} times</span>
                    <span>•</span>
                    <span>
                      {new Date(item.lastSearched).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
