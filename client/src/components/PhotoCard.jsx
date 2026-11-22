import React, { useState } from 'react';
import { Download, Maximize2, Heart, FileImage } from 'lucide-react';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const API_BASE = rawBase.endsWith('/api') ? rawBase : (rawBase ? `${rawBase}/api` : '/api');

export default function PhotoCard({ 
  photo, 
  onDownloadClick, 
  onPreviewClick, 
  onFavoriteClick,
  isFavorited = false,
  layoutMode = 'masonry'
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const [isVertical, setIsVertical] = useState(false);

  // Initial image source
  const [imgSrc, setImgSrc] = useState(
    photo.thumbnailLink || photo.thumbnailSmall || `${API_BASE}/photos/thumbnail/${photo.id}?sz=s1200`
  );

  // Format bytes to MB
  const formattedSize = photo.size
    ? `${(photo.size / (1024 * 1024)).toFixed(1)} MB`
    : null;

  const handleImageError = () => {
    // If direct Google thumbnail fails, seamlessly switch to server-side proxy
    if (!triedFallback && photo.id) {
      setTriedFallback(true);
      setImgSrc(`${API_BASE}/photos/thumbnail/${photo.id}?sz=s1200`);
    } else {
      setHasError(true);
    }
  };

  const handleImageLoad = (e) => {
    setIsLoaded(true);
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalHeight && naturalWidth) {
      setIsVertical(naturalHeight > naturalWidth);
    }
  };

  return (
    <div
      onClick={() => onPreviewClick(photo)}
      className="group relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 cursor-pointer select-none"
    >
      {/* Dynamic Image Container: Shows full photo without cropping */}
      <div
        className={`relative w-full overflow-hidden bg-stone-100 ${
          layoutMode === 'grid'
            ? 'aspect-[3/2] sm:aspect-[4/3] flex items-center justify-center bg-stone-200/50'
            : ''
        }`}
      >
        {/* Skeleton shimmer before load */}
        {!isLoaded && !hasError && (
          <div
            className={`w-full bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 animate-pulse ${
              layoutMode === 'grid' ? 'h-full' : 'aspect-[3/4]'
            }`}
          />
        )}

        {hasError ? (
          <div className="w-full aspect-[3/2] flex flex-col items-center justify-center p-6 text-stone-400 bg-stone-100">
            <FileImage className="w-8 h-8 mb-2" />
            <span className="text-xs text-center">Preview unavailable</span>
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={photo.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`transition-transform duration-700 ease-out group-hover:scale-104 ${
              layoutMode === 'grid'
                ? 'w-full h-full object-contain'
                : 'w-full h-auto block'
            } ${isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
          />
        )}

        {/* Category Pill Tag if available */}
        {photo.categoryName && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-md text-white shadow-sm">
              {photo.categoryName}
            </span>
          </div>
        )}

        {/* Favorite Icon (visible when favorited even when not hovering) */}
        {isFavorited && (
          <div className="absolute top-3 right-3 z-10">
            <div className="p-1.5 rounded-full bg-white/95 shadow-md">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            </div>
          </div>
        )}

        {/* Hover / Touch Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 sm:p-4 text-white">
          <div className="flex justify-end space-x-2">
            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteClick(photo);
              }}
              className={`p-2 rounded-full backdrop-blur-md transition ${
                isFavorited
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-white/20 hover:bg-white/40 text-white'
              }`}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
            </button>

            {/* Quick Large Preview */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreviewClick(photo);
              }}
              className="p-2 rounded-full bg-white/20 hover:bg-white/40 transition text-white backdrop-blur-md"
              title="Open large preview"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadClick(photo);
              }}
              className="p-2 rounded-full bg-white/20 hover:bg-white/40 transition text-white backdrop-blur-md"
              title="Download photo"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div>
            <p className="text-xs font-medium truncate drop-shadow-md text-white">{photo.name}</p>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[10px] text-stone-300">Click to expand</span>
              {formattedSize && (
                <>
                  <span className="text-stone-400 text-[10px]">•</span>
                  <span className="text-[10px] text-stone-300">{formattedSize}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
