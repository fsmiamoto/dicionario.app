import React, { useState, useEffect } from "react";
import type { SearchHistory } from "@shared/types";

interface SearchHistoryPageProps {
  onSearch: (word: string) => void;
}

const SearchHistoryPage: React.FC<SearchHistoryPageProps> = ({ onSearch }) => {
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async (favoritesOnly?: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await window.electronAPI.searchHistory(favoritesOnly);
      setHistory(data);
    } catch (error) {
      console.error("Failed to load search history:", error);
      setError("Failed to load search history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(filter === "favorites");
  }, [filter]);

  const handleWordClick = (word: string) => {
    onSearch(word);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => loadHistory(filter === "favorites")}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Toggle */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === "all"
              ? "bg-primary-500 text-white"
              : "bg-surface-300 hover:bg-surface-400 text-white"
          }`}
        >
          All History
        </button>
        <button
          onClick={() => setFilter("favorites")}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            filter === "favorites"
              ? "bg-primary-500 text-white"
              : "bg-surface-300 hover:bg-surface-400 text-white"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>Favorites</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && history.length === 0 && (
        <div className="text-center py-8">
          <svg
            className="w-16 h-16 text-dark-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-dark-400 text-lg mb-2">
            {filter === "favorites"
              ? "No favorite words yet"
              : "No search history yet"}
          </p>
          <p className="text-dark-500 text-sm">
            {filter === "favorites"
              ? "Start searching and favorite words to see them here"
              : "Start searching to see your history here"}
          </p>
        </div>
      )}

      {/* History List */}
      {!isLoading && history.length > 0 && (
        <div className="space-y-2">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => handleWordClick(item.word)}
              className="w-full p-4 bg-surface-200 hover:bg-surface-300 rounded-lg transition-colors text-left border border-surface-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {item.isFavorite && (
                    <svg
                      className="w-4 h-4 text-red-500 flex-shrink-0"
                      fill="currentColor"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  )}
                  <div>
                    <h3 className="text-white font-medium text-lg">
                      {item.word}
                    </h3>
                    <p className="text-dark-400 text-sm">
                      Searched {item.searchCount} time
                      {item.searchCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-dark-400 text-sm">
                    {formatDate(item.lastSearched)}
                  </p>
                  <p className="text-dark-500 text-xs">
                    {formatTime(item.lastSearched)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchHistoryPage;
