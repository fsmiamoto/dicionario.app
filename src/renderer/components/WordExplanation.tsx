import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface WordExplanationProps {
  word: string;
  explanation: string | null;
  isLoading: boolean;
}

const WordExplanation: React.FC<WordExplanationProps> = ({
  word,
  explanation,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyExplanation = async () => {
    if (!explanation) return;

    try {
      await navigator.clipboard.writeText(explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy explanation:", error);
    }
  };

  return (
    <div className="mb-6">
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <svg
              className="w-6 h-6 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>"{word}" - Explanation</span>
          </h2>

          {explanation && (
            <button
              onClick={handleCopyExplanation}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Copy explanation"
            >
              {copied ? (
                <svg
                  className="w-5 h-5 text-green-400"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-4/6"></div>
            </div>
          ) : explanation ? (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Customize markdown components to match dark theme
                  h1: ({ children }) => (
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-3 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 mt-3 first:mt-0">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-900 dark:text-white mb-3 last:mb-0">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-gray-900 dark:text-white mb-3 last:mb-0 pl-4">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-gray-900 dark:text-white mb-3 last:mb-0 pl-4">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-900 dark:text-white mb-1 last:mb-0">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-primary-600 dark:text-primary-400">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-600 dark:text-gray-300">
                      {children}
                    </em>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-200 dark:bg-slate-700 text-primary-600 dark:text-primary-400 px-1 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  ),
                }}
              >
                {explanation}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-gray-600 dark:text-gray-400 italic text-sm">
              No explanation available for this word.
            </div>
          )}
        </div>

        {explanation && !isLoading && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                AI-generated explanation for language learning purposes
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordExplanation;
