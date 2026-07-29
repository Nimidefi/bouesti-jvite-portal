'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to reset password');

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
        <h1 className="section-title">Success!</h1>
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>Your password has been successfully reset.</div>
        <p>Redirecting you to the login page...</p>
        <Link href="/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
      <h1 className="section-title">Reset Password</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>Enter the 6-digit code sent to your email and your new password.</p>

      {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={!!initialEmail}
          />
        </div>
        
        <div className="form-group">
          <label>6-Digit Reset Code</label>
          <input
            type="text"
            required
            value={otpCode}
            onChange={e => setOtpCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            style={{ letterSpacing: '0.2rem', textAlign: 'center', fontSize: '1.2rem' }}
          />
        </div>

        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
