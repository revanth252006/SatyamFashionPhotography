import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import EventGalleryPage from './pages/EventGalleryPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Provide a global client navigation helper for seamless single-page transitions
    window.navigateTo = (path) => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    };

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      delete window.navigateTo;
    };
  }, []);

  // Route 1: Studio Admin Panel (/admin)
  if (currentPath === '/admin' || currentPath === '/admin/') {
    return <AdminPage />;
  }

  // Route 2: Specific Private Wedding Event Gallery (/e/:slug)
  if (currentPath.startsWith('/e/')) {
    const slug = currentPath.replace(/^\/e\//, '').split('/')[0].split('?')[0];
    return <EventGalleryPage slug={slug} />;
  }

  // Route 3: Public Studio Homepage (/) - About photographer & contact details (No client photos)
  return <HomePage />;
}
