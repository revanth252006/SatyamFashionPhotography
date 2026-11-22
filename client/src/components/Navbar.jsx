import React from 'react';
import { Camera, Download, Heart, ArrowLeft } from 'lucide-react';

export default function Navbar({ 
  onDownloadClick, 
  onFavoritesClick, 
  favoritesCount = 0,
  isFavoritesActive = false,
  isAdmin = false, 
  currentSlug = null 
}) {
  const handleNav = (path) => {
    if (window.navigateTo) {
      window.navigateTo(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 transition">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Photographer / Studio Brand with custom logo */}
          <div 
            onClick={() => handleNav('/')}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group min-w-0"
          >
            {/* Logo image with fallback to camera */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 border border-stone-200 bg-white shadow-2xs group-hover:scale-105 transition flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Satyam Fashion Photography Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none' }} className="w-full h-full bg-stone-900 text-stone-100 items-center justify-center">
                <Camera className="w-5 h-5 text-rosewood-300" />
              </div>
            </div>

            {/* Studio Name & Subtitle - Cleanly fitted on mobile */}
            <div className="min-w-0 flex-1">
              <span className="font-serif text-sm sm:text-base lg:text-xl font-bold tracking-tight text-stone-900 block leading-tight truncate">
                Satyam Fashion Photography
              </span>
              <span className="hidden sm:block text-[10px] sm:text-xs tracking-widest uppercase text-stone-500 font-medium truncate mt-0.5">
                Luxury Wedding & Fashion Photography
              </span>
            </div>
          </div>

          {/* Action buttons: Favorites and Download Gallery */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {isAdmin ? (
              <button
                onClick={() => handleNav(currentSlug ? `/e/${currentSlug}` : '/')}
                className="inline-flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-stone-200 hover:bg-stone-300 text-stone-800 transition active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Exit Admin</span>
              </button>
            ) : (
              <>
                {/* Favorites Button */}
                <button
                  onClick={onFavoritesClick}
                  className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition active:scale-95 border ${
                    isFavoritesActive
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                      : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700 shadow-2xs'
                  }`}
                  title="View your favorite photos"
                >
                  <Heart
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-stone-500'
                    }`}
                  />
                  <span className="hidden sm:inline">Favorites</span>
                  {favoritesCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {favoritesCount}
                    </span>
                  )}
                </button>

                {/* Download Gallery Button */}
                <button
                  onClick={onDownloadClick}
                  className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 min-[400px]:px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 shadow-sm transition active:scale-95"
                  title="Download all gallery photos"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosewood-300" />
                  <span className="hidden sm:inline">Download Gallery</span>
                  <span className="hidden min-[400px]:inline sm:hidden">Download</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
