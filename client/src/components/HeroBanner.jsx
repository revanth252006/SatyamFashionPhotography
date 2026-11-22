import React from 'react';
import { Calendar, MapPin, Sparkles } from 'lucide-react';

export default function HeroBanner({ event }) {
  // Use custom event_date and location if configured, otherwise clean fallbacks
  const displayDate = event?.event_date || (event?.created_at ? new Date(event.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null);
  const displayLocation = event?.location || null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-100 to-stone-50 border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
        {/* Subtle decorative ornament */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rosewood-100/70 text-rosewood-700 text-xs font-medium tracking-wide uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Private Client Gallery</span>
        </div>

        {/* Wedding Title */}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-stone-900 leading-tight mb-4 capitalize">
          {event?.title || 'Wedding Gallery'}
        </h1>

        {/* Client / Couple Names */}
        <p className="font-serif italic text-lg sm:text-2xl text-stone-600 mb-6 font-light capitalize">
          {event?.client_name || ''}
        </p>

        {/* Dynamic Metadata: Event Captured Date & Location */}
        {(displayDate || displayLocation) && (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-stone-500 font-medium">
            {displayDate && (
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-rosewood-500" />
                <span>Captured {displayDate}</span>
              </div>
            )}
            {displayDate && displayLocation && (
              <span className="hidden sm:inline text-stone-300">•</span>
            )}
            {displayLocation && (
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-rosewood-500" />
                <span>{displayLocation}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
