import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import CategoryFilter from '../components/CategoryFilter';
import PhotoGrid from '../components/PhotoGrid';
import DownloadLeadModal from '../components/DownloadLeadModal';
import Footer from '../components/Footer';
import { getEventBySlug, getEventPhotos, getPhotosByCategory } from '../services/api';
import { AlertCircle, RefreshCw, Heart, X, Lock, Download } from 'lucide-react';

const DEFAULT_SLUG = import.meta.env.VITE_DEFAULT_EVENT_SLUG || 'satyam-and-nagalaxmi-6k7z3t';

export default function EventGalleryPage({ slug }) {
  const activeSlug = slug || DEFAULT_SLUG;

  // Event & Categories State
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null); // null = All Moments, '__favorites__' = Favourites
  const [photos, setPhotos] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);

  // Loading & Error States
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Favorites state (persisted per event in localStorage)
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`wedding_favorites_${activeSlug}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal State for Name + Gmail Lead Capture
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPurpose, setModalPurpose] = useState('download'); // 'download' | 'favorite' | 'download_gallery' | 'download_favorites'
  const [selectedPhotoForAction, setSelectedPhotoForAction] = useState(null);

  // Check if visitor is already unlocked for this specific event
  const getRegisteredVisitor = () => {
    try {
      if (activeSlug) {
        const eventSaved = localStorage.getItem(`wedding_unlock_${activeSlug}`);
        if (eventSaved) {
          const parsed = JSON.parse(eventSaved);
          if (parsed.unlocked) return parsed;
        }
      }
      const saved = localStorage.getItem('wedding_visitor_lead');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.unlocked || parsed.email) return parsed;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Keyboard shortcut: Ctrl + Shift + A (or Cmd + Shift + A) opens Studio Admin
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (window.navigateTo) window.navigateTo('/admin');
        else window.location.href = '/admin';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync favorites to localStorage per event
  useEffect(() => {
    try {
      localStorage.setItem(`wedding_favorites_${activeSlug}`, JSON.stringify(favoriteIds));
    } catch (e) {
      console.warn('Could not save favorites to localStorage:', e);
    }
  }, [favoriteIds, activeSlug]);

  // Load Event and Categories on slug change
  useEffect(() => {
    loadEventData();
  }, [activeSlug]);

  const loadEventData = async (bypassCache = false) => {
    setIsLoadingEvent(true);
    setErrorMessage(null);
    try {
      const data = await getEventBySlug(activeSlug, bypassCache);
      setEvent(data.event);
      setCategories(data.categories || []);

      setSelectedCategoryId(null);
      loadPhotos(null, null, bypassCache, data.event?.drive_folder_id);
    } catch (err) {
      console.error('Failed to load event data:', err);
      setErrorMessage(err.message || `Wedding gallery "${activeSlug}" could not be loaded.`);
    } finally {
      setIsLoadingEvent(false);
    }
  };

  // Load Photos using Feature 3 endpoint (GET /api/events/:slug/photos) with pagination
  const loadPhotos = async (catId, token = null, bypassCache = false, parentId = null) => {
    if (catId === '__favorites__') return; // Handled client-side from cached photos

    const rootFolderId = parentId || event?.drive_folder_id;
    if (!rootFolderId && !catId) return;

    if (token) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingPhotos(true);
    }

    try {
      // Use Feature 3 API route
      let data;
      try {
        data = await getEventPhotos(activeSlug, {
          categoryId: catId,
          pageSize: 40,
          pageToken: token,
          bypassCache
        });
      } catch (eventErr) {
        // Fallback to general photos route
        data = await getPhotosByCategory(catId, {
          pageSize: 40,
          pageToken: token,
          bypassCache,
          all: catId === null,
          parentFolderId: rootFolderId
        });
      }

      if (token) {
        setPhotos((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPhotos = (data.photos || []).filter((p) => !existingIds.has(p.id));
          return [...prev, ...newPhotos];
        });
      } else {
        setPhotos(data.photos || []);
      }
      setNextPageToken(data.nextPageToken || null);
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setIsLoadingPhotos(false);
      setIsLoadingMore(false);
    }
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    if (categoryId !== '__favorites__') {
      loadPhotos(categoryId, null, false);
    }
  };

  const handleRefresh = () => {
    if (selectedCategoryId !== '__favorites__') {
      loadPhotos(selectedCategoryId, null, true);
    }
  };

  // ===========================================================================
  // Gatekeeper: Downloads & Favourites require One-Time Name & Gmail Unlock
  // ===========================================================================

  // 1. Download single photo
  const handleDownloadPhoto = (photo) => {
    const visitor = getRegisteredVisitor();
    if (!visitor) {
      setModalPurpose('download');
      setSelectedPhotoForAction(photo);
      setIsModalOpen(true);
      return;
    }

    if (photo.webContentLink) {
      window.open(photo.webContentLink, '_blank');
    }
  };

  // 2. Download entire gallery
  const handleNavbarDownload = () => {
    const visitor = getRegisteredVisitor();
    if (!visitor) {
      setModalPurpose('download_gallery');
      setSelectedPhotoForAction(null);
      setIsModalOpen(true);
    } else {
      if (event?.drive_folder_id) {
        window.open(`https://drive.google.com/drive/folders/${event.drive_folder_id}`, '_blank');
      } else if (photos[0]?.webContentLink) {
        window.open(photos[0].webContentLink, '_blank');
      }
    }
  };

  // 3. Download all favorited photos
  const handleDownloadFavorites = () => {
    const visitor = getRegisteredVisitor();
    if (!visitor) {
      setModalPurpose('download_favorites');
      setSelectedPhotoForAction(null);
      setIsModalOpen(true);
      return;
    }

    const favPhotos = photos.filter((p) => favoriteIds.includes(p.id));
    if (favPhotos.length === 0) {
      alert('You have no favorited photos to download yet.');
      return;
    }

    // Open download links for favorited photos
    favPhotos.forEach((photo, i) => {
      if (photo.webContentLink) {
        setTimeout(() => {
          window.open(photo.webContentLink, '_blank');
        }, i * 300);
      }
    });
  };

  // 4. Toggle Favorite on a photo
  const handleFavoritePhoto = (photo) => {
    setFavoriteIds((prev) => {
      if (prev.includes(photo.id)) {
        return prev.filter((id) => id !== photo.id);
      } else {
        return [...prev, photo.id];
      }
    });
  };

  // 5. Navbar Favorites Button Clicked
  const handleNavbarFavorites = () => {
    if (selectedCategoryId === '__favorites__') {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId('__favorites__');
    }
  };

  // Callback when visitor registers their Name & Gmail
  const handleLeadRegistered = (visitor) => {
    if (modalPurpose === 'download' && selectedPhotoForAction?.webContentLink) {
      window.open(selectedPhotoForAction.webContentLink, '_blank');
    } else if (modalPurpose === 'download_gallery' && event?.drive_folder_id) {
      window.open(`https://drive.google.com/drive/folders/${event.drive_folder_id}`, '_blank');
    } else if (modalPurpose === 'download_favorites') {
      const favPhotos = photos.filter((p) => favoriteIds.includes(p.id));
      favPhotos.forEach((photo, i) => {
        if (photo.webContentLink) {
          setTimeout(() => {
            window.open(photo.webContentLink, '_blank');
          }, i * 300);
        }
      });
    }
  };

  // Compute displayed photos based on category or favorites filter
  const isFavoritesActive = selectedCategoryId === '__favorites__';
  const displayedPhotos = isFavoritesActive
    ? photos.filter((p) => favoriteIds.includes(p.id))
    : photos;

  // Error State
  if (errorMessage && !isLoadingEvent) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
        <Navbar 
          onDownloadClick={handleNavbarDownload} 
          onFavoritesClick={handleNavbarFavorites}
          favoritesCount={favoriteIds.length}
          currentSlug={activeSlug} 
        />
        <main className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rosewood-100 text-rosewood-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Gallery Unavailable</h2>
            <p className="text-sm text-stone-600 mb-6">{errorMessage}</p>
            <div className="space-y-2">
              <button
                onClick={() => loadEventData(true)}
                className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Loading</span>
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans selection:bg-rosewood-100 selection:text-rosewood-800">
      {/* Top Navbar: Favorites & Download Gallery */}
      <Navbar 
        onDownloadClick={handleNavbarDownload} 
        onFavoritesClick={handleNavbarFavorites}
        favoritesCount={favoriteIds.length}
        isFavoritesActive={isFavoritesActive}
        currentSlug={activeSlug} 
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Dynamic Hero Banner */}
        <HeroBanner event={event} />

        {/* Categories & Favourites Sticky Navigation Bar */}
        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
          onRefresh={handleRefresh}
          isLoading={isLoadingPhotos}
          favoritesCount={favoriteIds.length}
        />

        {/* Favourites Active Sub-Header */}
        {isFavoritesActive && (
          <div className="bg-rose-50/70 border-b border-rose-200/70 py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-900 text-xs sm:text-sm font-medium">
                <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
                <span>
                  Viewing <strong>{displayedPhotos.length}</strong> Favourited Moment{displayedPhotos.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                {displayedPhotos.length > 0 && (
                  <button
                    onClick={handleDownloadFavorites}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download All Favourites</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className="inline-flex items-center space-x-1 text-xs text-rose-700 hover:text-rose-900 font-semibold"
                >
                  <span>Show All Moments</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Responsive Gallery Photos Grid (2 cols on mobile, 4-5 cols on desktop) */}
        <PhotoGrid
          photos={displayedPhotos}
          isLoading={isLoadingPhotos && photos.length === 0}
          nextPageToken={isFavoritesActive ? null : nextPageToken}
          onLoadMore={() => loadPhotos(selectedCategoryId, nextPageToken, false)}
          isLoadingMore={isLoadingMore}
          onDownloadPhoto={handleDownloadPhoto}
          onFavoritePhoto={handleFavoritePhoto}
          favoriteIds={favoriteIds}
        />
      </main>

      {/* Studio Footer */}
      <Footer />

      {/* One-Time Name & Gmail Download Gate Modal */}
      <DownloadLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventSlug={event?.slug || activeSlug}
        targetPhoto={selectedPhotoForAction}
        purpose={modalPurpose}
        onSuccess={handleLeadRegistered}
      />
    </div>
  );
}
