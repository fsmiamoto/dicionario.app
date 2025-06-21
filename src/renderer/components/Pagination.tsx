import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}) => {
  const handlePrevious = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <button
        onClick={handlePrevious}
        disabled={currentPage <= 1 || isLoading}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-surface-400 rounded-lg hover:bg-surface-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>Previous</span>
      </button>

      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex space-x-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNumber = i + 1;
            const isCurrentPage = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                disabled={isLoading}
                className={`w-8 h-8 text-xs font-medium rounded-full transition-colors ${
                  isCurrentPage
                    ? "bg-primary-500 text-white"
                    : "bg-surface-400 text-gray-300 hover:bg-surface-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={currentPage >= totalPages || isLoading}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-surface-400 rounded-lg hover:bg-surface-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span>Next</span>
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
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;
