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
    <header className="sticky top-0 z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200/70 transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Photographer / Studio Brand */}
          <div 
            onClick={() => handleNav('/')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone-900 text-stone-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
              <Camera className="w-5 h-5 text-rosewood-300" />
            </div>
            <div>
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-stone-900 block leading-tight">
                SATYAM FASHION PHOTOGRAPHY
              </span>
              <span className="text-[10px] sm:text-xs tracking-widest uppercase text-stone-500 font-medium">
                Luxury Wedding & Fashion Photography
              </span>
            </div>
          </div>

          {/* Action buttons: Only Favorites and Download Gallery */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAdmin ? (
              <button
                onClick={() => handleNav(currentSlug ? `/e/${currentSlug}` : '/')}
                className="inline-flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-stone-200 hover:bg-stone-300 text-stone-800 transition active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Exit Admin</span>
              </button>
            ) : (
              <>
                {/* Favorites Button */}
                <button
                  onClick={onFavoritesClick}
                  className={`inline-flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition active:scale-95 border ${
                    isFavoritesActive
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                      : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700 shadow-2xs'
                  }`}
                  title="View your favorite photos (requires name & email)"
                >
                  <Heart
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-stone-500'
                    }`}
                  />
                  <span>Favorites</span>
                  {favoritesCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {favoritesCount}
                    </span>
                  )}
                </button>

                {/* Download Gallery Button */}
                <button
                  onClick={onDownloadClick}
                  className="inline-flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 shadow-sm transition active:scale-95"
                  title="Download all gallery photos (requires name & email)"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosewood-300" />
                  <span>Download Gallery</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
