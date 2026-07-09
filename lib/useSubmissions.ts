'use client';

import { useEffect, useState } from 'react';
import type { Submission } from './data';
import { API_URL as BASE_API_URL } from './config';

const API_URL = `${BASE_API_URL}/api/submissions`;

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setSubmissions(data);
      })
      .catch((e) => {
        console.error('Failed to load submissions', e);
      })
      .finally(() => {
        setLoaded(true);
      });
  }, []);

  const add = async (s: Omit<Submission, 'id'>) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error('Failed to create submission');
      const data = await res.json();
      setSubmissions((prev) => [data, ...prev]);
      return data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const update = async (id: string, patch: Partial<Submission>) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Failed to update submission');
      const data = await res.json();
      setSubmissions((prev) => prev.map((s) => (s.id === id ? data : s)));
      return data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const get = (id: string) => submissions.find((s) => s.id === id);

  return { submissions, add, update, get, loaded };
}
