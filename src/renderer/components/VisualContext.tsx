import React from "react";
import type { ImageResult } from "@shared/types";
import Pagination from "./Pagination";

interface VisualContextProps {
  images: ImageResult[];
  word: string;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedImages?: ImageResult[];
  onImageSelection?: (images: ImageResult[]) => void;
  showAnkiControls?: boolean;
}

const VisualContext: React.FC<VisualContextProps> = ({
  images,
  word,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  selectedImages = [],
  onImageSelection,
  showAnkiControls = false,
}) => {
  const handleImageClick = (image: ImageResult) => {
    if (showAnkiControls && onImageSelection) {
      // Toggle image selection for Anki
      handleImageToggle(image);
    } else {
      // Copy image URL to clipboard
      navigator.clipboard.writeText(image.url).then(() => {
        // Show toast notification (you can implement this later)
        console.log("Image URL copied to clipboard");
      });
    }
  };

  const handleImageToggle = (image: ImageResult) => {
    if (!onImageSelection) return;

    const isSelected = selectedImages.some((img) => img.url === image.url);
    if (isSelected) {
      onImageSelection(selectedImages.filter((img) => img.url !== image.url));
    } else {
      onImageSelection([...selectedImages, image]);
    }
  };

  const handleSelectAllImages = () => {
    if (!onImageSelection) return;
    onImageSelection(images);
  };

  const handleDeselectAllImages = () => {
    if (!onImageSelection) return;
    onImageSelection([]);
  };

  const isImageSelected = (image: ImageResult) => {
    return selectedImages.some((img) => img.url === image.url);
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
          {showAnkiControls && selectedImages.length > 0 && (
            <span className="text-sm text-primary-400">
              ({selectedImages.length} selected)
            </span>
          )}
        </h3>

        <div className="flex items-center space-x-4">
          {showAnkiControls && images.length > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <button
                onClick={handleSelectAllImages}
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Select All
              </button>
              <span className="text-dark-400">|</span>
              <button
                onClick={handleDeselectAllImages}
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Deselect All
              </button>
            </div>
          )}

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
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative bg-surface-300 rounded-lg overflow-hidden cursor-pointer group hover:ring-2 hover:ring-primary-500 transition-all ${
                showAnkiControls && isImageSelected(image)
                  ? "ring-2 ring-primary-500"
                  : ""
              }`}
              onClick={() => handleImageClick(image)}
            >
              {showAnkiControls && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={isImageSelected(image)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleImageToggle(image);
                    }}
                    className="w-4 h-4 text-primary-500 bg-white border-2 border-gray-300 rounded focus:ring-primary-500"
                  />
                </div>
              )}
              <img
                src={image.thumbnail}
                alt={image.title || `${word} ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                {showAnkiControls ? (
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
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
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        isLoading={isLoading}
      />
    </div>
  );
};

export default VisualContext;
