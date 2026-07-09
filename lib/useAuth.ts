'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('editor_token');
    if (stored) setToken(stored);
    setLoading(false);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('editor_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('editor_token');
    setToken(null);
    router.push('/editor/login');
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  };

  return { token, loading, login, logout, fetchWithAuth };
}
