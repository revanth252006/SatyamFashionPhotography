import React, { useState, useEffect, useCallback } from 'react';
import PhotoCard from './PhotoCard';
import { 
  Image as ImageIcon, 
  Loader2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Heart,
  Columns,
  LayoutGrid
} from 'lucide-react';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const API_BASE = rawBase.endsWith('/api') ? rawBase : (rawBase ? `${rawBase}/api` : '/api');

export default function PhotoGrid({
  photos = [],
  isLoading,
  nextPageToken,
  onLoadMore,
  isLoadingMore,
  onDownloadPhoto,
  onFavoritePhoto,
  favoriteIds = []
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  // Default to 'masonry' so images are never cropped and show full vertical/horizontal aspect!
  const [layoutMode, setLayoutMode] = useState('masonry');

  const activePhoto = selectedIndex !== null ? photos[selectedIndex] : null;
  const isCurrentFavorited = activePhoto ? favoriteIds.includes(activePhoto.id) : false;

  // Navigate to previous photo
  const handlePrev = useCallback(() => {
    if (photos.length === 0) return;
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  // Navigate to next photo
  const handleNext = useCallback(() => {
    if (photos.length === 0) return;
    setSelectedIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // Keyboard navigation when lightbox is active
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        setSelectedIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handlePrev, handleNext]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 sm:gap-4 lg:gap-5 space-y-3 sm:space-y-4 lg:space-y-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div
              key={i}
              className={`w-full rounded-2xl bg-stone-200 animate-pulse break-inside-avoid ${
                i % 3 === 0 ? 'aspect-[2/3]' : i % 2 === 0 ? 'aspect-[3/4]' : 'aspect-[3/2]'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h3 className="font-serif text-xl font-medium text-stone-800 mb-1">No photos in this view</h3>
        <p className="text-sm text-stone-500 max-w-sm mx-auto">
          Please select another category or check back soon as photos are synchronized from Google Drive.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Gallery Header Bar: Photo Count and Layout View Switcher */}
      <div className="flex items-center justify-between mb-5 px-1">
        <span className="text-xs sm:text-sm font-medium text-stone-600">
          Showing <strong>{photos.length}</strong> photo{photos.length === 1 ? '' : 's'}
        </span>

        {/* View Switcher: Full View (Masonry) vs Equal Grid */}
        <div className="flex items-center space-x-1 bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs shadow-2xs">
          <button
            onClick={() => setLayoutMode('masonry')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              layoutMode === 'masonry'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
            title="Full Natural View: Vertical and horizontal photos are shown completely without cutting"
          >
            <Columns className="w-3.5 h-3.5 text-rosewood-600" />
            <span>Full View</span>
          </button>

          <button
            onClick={() => setLayoutMode('grid')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              layoutMode === 'grid'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
            title="Grid View: Equal cards with contain fit"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-stone-600" />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* Responsive Gallery Photos: Masonry by default preserves 100% full vertical and horizontal images */}
      {layoutMode === 'masonry' ? (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 sm:gap-4 lg:gap-5 space-y-3 sm:space-y-4 lg:space-y-5">
          {photos.map((photo, idx) => (
            <div key={photo.id || idx} className="break-inside-avoid">
              <PhotoCard
                photo={photo}
                isFavorited={favoriteIds.includes(photo.id)}
                onDownloadClick={onDownloadPhoto}
                onFavoriteClick={onFavoritePhoto}
                onPreviewClick={() => setSelectedIndex(idx)}
                layoutMode="masonry"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {photos.map((photo, idx) => (
            <PhotoCard
              key={photo.id || idx}
              photo={photo}
              isFavorited={favoriteIds.includes(photo.id)}
              onDownloadClick={onDownloadPhoto}
              onFavoriteClick={onFavoritePhoto}
              onPreviewClick={() => setSelectedIndex(idx)}
              layoutMode="grid"
            />
          ))}
        </div>
      )}

      {/* Pagination / Load More button */}
      {nextPageToken && (
        <div className="mt-12 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 shadow-sm transition disabled:opacity-50"
          >
            {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin text-rosewood-300" />}
            <span>{isLoadingMore ? 'Loading More Photos...' : 'Load More Moments'}</span>
          </button>
        </div>
      )}

      {/* =======================================================================
          Interactive Fullscreen Lightbox with Arrow Marks (< and >)
      ======================================================================= */}
      {activePhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Top Bar with counter, favorite & download controls */}
          <div 
            className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs sm:text-sm text-stone-300 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                {selectedIndex + 1} / {photos.length}
              </span>
              {activePhoto.categoryName && (
                <span className="hidden sm:inline text-xs text-rosewood-300 bg-rosewood-950/60 border border-rosewood-800/60 px-3 py-1 rounded-full">
                  📁 {activePhoto.categoryName}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Lightbox Favorite Button */}
              <button
                onClick={() => onFavoritePhoto(activePhoto)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition flex items-center space-x-1.5 ${
                  isCurrentFavorited
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isCurrentFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${isCurrentFavorited ? 'fill-white' : ''}`} />
                <span>{isCurrentFavorited ? 'Favorited' : 'Favorite'}</span>
              </button>

              {/* Lightbox Download Button */}
              <button
                onClick={() => onDownloadPhoto(activePhoto)}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-md transition flex items-center space-x-1.5"
                title="Download photo"
              >
                <Download className="w-4 h-4 text-rosewood-300" />
                <span>Download</span>
              </button>

              <button
                onClick={() => setSelectedIndex(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
                title="Close lightbox (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Left Arrow Mark (Previous Photo) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-black/50 hover:bg-white/20 text-white transition backdrop-blur-md shadow-2xl active:scale-95"
            title="Previous photo (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Right Arrow Mark (Next Photo) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-black/50 hover:bg-white/20 text-white transition backdrop-blur-md shadow-2xl active:scale-95"
            title="Next photo (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Center Image Container */}
          <div 
            className="relative max-w-6xl max-h-[85vh] flex flex-col items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePhoto.thumbnailLink || activePhoto.thumbnailSmall || `${API_BASE}/photos/thumbnail/${activePhoto.id}?sz=s1600`}
              alt={activePhoto.name}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={(e) => {
                const fallback = `${API_BASE}/photos/thumbnail/${activePhoto.id}?sz=s1600`;
                if (e.target.src !== fallback) {
                  e.target.src = fallback;
                }
              }}
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
            />
            
            <div className="mt-3 text-center text-xs text-stone-300 truncate max-w-lg drop-shadow-md">
              {activePhoto.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
