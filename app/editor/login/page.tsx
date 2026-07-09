'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { journalInfo } from '@/lib/data';
import { API_URL } from '@/lib/config';

export default function EditorLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });

        if (!res.ok) {
          throw new Error('Invalid email or password');
        }

        const data = await res.json();
        login(data.access_token);
        router.push('/editor');
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const res = await fetch(`${API_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, confirm_password: confirmPassword }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.detail || 'Failed to sign up');
        }

        // On successful signup, redirect to login tab instead of going straight to dashboard
        setIsLogin(true);
        setSuccessMsg('Registration successful! Please sign in with your new credentials.');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'radial-gradient(circle at 50% 20%, rgba(30, 58, 95, 0.08) 0%, rgba(247, 246, 242, 1) 70%)'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem 2rem',
          boxShadow: '0 15px 35px rgba(30, 58, 95, 0.1), 0 5px 15px rgba(0,0,0,0.05)',
          borderRadius: '12px',
          borderTop: '5px solid var(--color-accent)',
          background: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative background accent */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, transparent, rgba(201, 164, 73, 0.1))',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '76px',
            height: '76px',
            margin: '0 auto 1rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src="/logo.png" alt="BOUESTI Crest Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 className="section-title" style={{ fontSize: '1.75rem', marginBottom: '0.35rem', color: 'var(--color-primary-dark)' }}>
            Editorial Portal
          </h1>
          <p className="muted" style={{ fontSize: '0.9rem', margin: 0 }}>
            Academic Review &amp; Publishing
          </p>
        </div>

        {/* Segmented Control / Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--color-surface-alt)',
            padding: '4px',
            borderRadius: '8px',
            marginBottom: '1.75rem',
            border: '1px solid var(--color-border)'
          }}
        >
          <button
            type="button"
            style={{
              padding: '0.65rem 1rem',
              background: isLogin ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              fontWeight: isLogin ? '600' : '500',
              cursor: 'pointer',
              color: isLogin ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
              boxShadow: isLogin ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
              fontSize: '0.95rem'
            }}
            onClick={() => { setIsLogin(true); setError(null); setSuccessMsg(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              padding: '0.65rem 1rem',
              background: !isLogin ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              fontWeight: !isLogin ? '600' : '500',
              cursor: 'pointer',
              color: !isLogin ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
              boxShadow: !isLogin ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
              fontSize: '0.95rem'
            }}
            onClick={() => { setIsLogin(false); setError(null); setSuccessMsg(null); }}
          >
            Board Registration
          </button>
        </div>

        {successMsg && (
          <div className="alert alert-success" style={{
            marginBottom: '1.5rem',
            padding: '0.85rem 1rem',
            borderRadius: '6px',
            background: 'rgba(46, 125, 79, 0.1)',
            borderLeft: '4px solid var(--color-success)',
            color: 'var(--color-success)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{
            marginBottom: '1.5rem',
            padding: '0.85rem 1rem',
            borderRadius: '6px',
            background: 'rgba(179, 38, 30, 0.08)',
            borderLeft: '4px solid var(--color-danger)',
            color: 'var(--color-danger)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.4rem', display: 'block' }}>
              Editorial Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editor@journal.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                background: 'var(--color-surface)'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 95, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.4rem', display: 'block' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={isLogin ? undefined : 8}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                background: 'var(--color-surface)'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 95, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {!isLogin && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.4rem', display: 'block' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  background: 'var(--color-surface)'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 95, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
              />
              <p className="muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem', marginBottom: 0 }}>
                Must be at least 8 characters long.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.85rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ffffff',
              marginTop: '0.5rem',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              border: 'none',
              boxShadow: '0 4px 12px rgba(156, 177, 211, 0.2)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.1s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => { if (!loading) { e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 58, 95, 0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseOut={(e) => { if (!loading) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 58, 95, 0.2)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
          >
            {loading ? (isLogin ? 'Authenticating...' : 'Registering...') : (isLogin ? 'Sign In to Portal →' : 'Complete Board Registration →')}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
          <p className="muted" style={{ fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <span></span>
            <span>Restricted to authorized Editorial Board members.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
