import React from 'react';
import { Layers, RefreshCw, Heart } from 'lucide-react';

export default function CategoryFilter({
  categories = [],
  selectedCategoryId,
  onSelectCategory,
  onRefresh,
  isLoading,
  favoritesCount = 0
}) {
  return (
    <div className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-16 sm:top-20 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Scrollable category pills including All Moments, Categories, and Favourites */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            {/* All Moments Tab */}
            <button
              onClick={() => onSelectCategory(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap flex items-center space-x-1.5 ${
                selectedCategoryId === null
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Moments</span>
            </button>

            {/* Child Drive Categories (e.g. Haldi, Wedding, Reception) */}
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}

            {/* Dedicated Favourites Tab */}
            <button
              onClick={() => onSelectCategory('__favorites__')}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap flex items-center space-x-1.5 ${
                selectedCategoryId === '__favorites__'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  selectedCategoryId === '__favorites__' ? 'fill-white' : 'fill-rose-500 text-rose-500'
                }`}
              />
              <span>Favourites</span>
              {favoritesCount > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                    selectedCategoryId === '__favorites__'
                      ? 'bg-white/25 text-white'
                      : 'bg-rose-200 text-rose-800'
                  }`}
                >
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick Cache Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh from Google Drive (bypass cache)"
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
