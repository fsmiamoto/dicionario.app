import React from "react";
import type { ImageResult } from "@shared/types";

interface VisualContextProps {
  images: ImageResult[];
  word: string;
  isLoading: boolean;
}

const VisualContext: React.FC<VisualContextProps> = ({
  images,
  word,
  isLoading,
}) => {
  const handleImageClick = (image: ImageResult) => {
    // Copy image URL to clipboard
    navigator.clipboard.writeText(image.url).then(() => {
      // Show toast notification (you can implement this later)
      console.log("Image URL copied to clipboard");
    });
  };

  const handleSearchGoogleImages = () => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(word)}&tbm=isch`;
    window.open(searchUrl, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Visual Context</span>
        </h3>

        <button
          onClick={handleSearchGoogleImages}
          className="text-primary-500 hover:text-primary-400 text-sm font-medium flex items-center space-x-1 transition-colors"
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
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          <span>Search Google Images</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 grid-rows-2 gap-3 aspect-[3/2]">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-surface-300 rounded-lg animate-pulse aspect-square"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 grid-rows-2 gap-3 aspect-[3/2]">
          {images.slice(0, 6).map((image, index) => (
            <div
              key={index}
              className="relative bg-surface-300 rounded-lg overflow-hidden cursor-pointer group hover:ring-2 hover:ring-primary-500 transition-all"
              onClick={() => handleImageClick(image)}
            >
              <img
                src={image.thumbnail}
                alt={image.title || `${word} ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisualContext;
