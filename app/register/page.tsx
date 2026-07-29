'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    affiliation: '',
    country: '',
    orcid: '',
    field_of_research: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/author-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');

      sessionStorage.setItem('author_token', data.access_token);
      
      const params = new URLSearchParams(window.location.search);
      const callback = params.get('callbackUrl') || '/dashboard';
      router.push(callback);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem 1rem' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        <h1 className="section-title">Author Registration</h1>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>Create an account to submit manuscripts to JVITE.</p>

        {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Dr. John Doe"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="john.doe@university.edu"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <select 
                required 
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--bg-card)', color: 'var(--text)' }}
              >
                <option value="">Select Country</option>
                <option value="Nigeria">Nigeria</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Canada">Canada</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Affiliation / University</label>
              <input
                type="text"
                required
                value={form.affiliation}
                onChange={e => setForm({ ...form, affiliation: e.target.value })}
                placeholder="University of Examples"
              />
            </div>
            <div className="form-group">
              <label>Field of Research</label>
              <input
                type="text"
                required
                value={form.field_of_research}
                onChange={e => setForm({ ...form, field_of_research: e.target.value })}
                placeholder="Vocational Education"
              />
            </div>
            <div className="form-group">
              <label>ORCID (Optional)</label>
              <input
                type="text"
                value={form.orcid}
                onChange={e => setForm({ ...form, orcid: e.target.value })}
                placeholder="0000-0000-0000-0000"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Registering...' : 'Register as Author'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          Already registered? <Link href={`/login${typeof window !== 'undefined' ? window.location.search : ''}`} style={{ color: 'var(--primary)' }}>Log in here</Link>
        </p>
      </div>
    </div>
  );
}
