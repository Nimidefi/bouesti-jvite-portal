'use client';

import { useEffect } from 'react';

export default function SessionProtector() {
  useEffect(() => {
    // This event fires when the user unloads the document 
    // (e.g. closing the tab, or doing a hard refresh/reload)
    const handleUnload = () => {
      // Removing from sessionStorage strictly forces re-authentication on refresh or reload
      sessionStorage.removeItem('author_token');
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return null;
}
