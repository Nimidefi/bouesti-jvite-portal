'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Submission } from '@/lib/data';
import { API_URL } from '@/lib/config';

export default function EditorDashboard() {
  const { token, loading, logout, fetchWithAuth } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !token) {
      router.push('/editor/login');
    }
  }, [loading, token, router]);

  useEffect(() => {
    if (token) {
      loadSubmissions();
    }
  }, [token]);

  const loadSubmissions = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSubmissions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this rejected submission? This action cannot be undone.')) return;
    setActionLoading(id);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/submissions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok || res.status === 204) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert('Failed to delete submission');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete submission');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !token) {
    return (
      <div className="page" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
          <p className="muted">Authenticating Editorial Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem', width: '100%' }}>
      {/* Editorial Navigation Banner */}
      <div className="editorial-banner">
        <div className="editorial-banner-links">
          <Link
            href="/dashboard"
            className="btn btn-primary"
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--color-primary-dark)',
              color: '#ffffff',
              borderRadius: '6px'
            }}
          >
            Back to Journal Dashboard
          </Link>
          <Link
            href="/"
            className="btn btn-ghost"
            style={{
              padding: '0.45rem 0.8rem',
              fontSize: '0.85rem',
              color: 'var(--color-text)',
              textDecoration: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: '6px'
            }}
          >
            Journal Home
          </Link>
          <Link
            href="/issues"
            className="btn btn-ghost"
            style={{
              padding: '0.45rem 0.8rem',
              fontSize: '0.85rem',
              color: 'var(--color-text)',
              textDecoration: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: '6px'
            }}
          >
            Browse Issues
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            Editorial Session Active
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2.5rem', width: '100%' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(30, 58, 95, 0.08)',
          padding: '0.4rem 1rem',
          borderRadius: '50px',
          color: 'var(--color-primary-dark)',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '0.75rem'
        }}>
          <img src="/logo.png" alt="BOUESTI Crest Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
          <span>Editorial Board Portal</span>
        </div>
        <h1 className="section-title" style={{ margin: '0 0 0.5rem 0', fontSize: '2.2rem', color: 'var(--color-primary-dark)' }}>
          Submission Management
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Review, publish, reject, or clean up academic journal manuscripts.
        </p>
      </div>

      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '2rem',
        boxShadow: '0 10px 30px rgba(30, 58, 95, 0.08)',
        borderRadius: '12px',
        borderTop: '4px solid var(--color-accent)',
        background: '#ffffff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--color-primary-dark)' }}>
            Manuscript Queue ({submissions.length})
          </h2>
          <button 
            onClick={loadSubmissions} 
            className="btn btn-ghost" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '6px' }}
          >
            ↻ Refresh List
          </button>
        </div>

        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p className="muted">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-surface-alt)', borderRadius: '8px' }}>
            <p className="muted" style={{ margin: 0 }}>No submissions found in the database.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', background: 'var(--color-surface-alt)' }}>
                  <th style={{ padding: '0.85rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '0.85rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Title</th>
                  <th style={{ padding: '0.85rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Author</th>
                  <th style={{ padding: '0.85rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.85rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <SubmissionRow 
                    key={sub.id} 
                    sub={sub} 
                    handleUpdateStatus={handleUpdateStatus} 
                    handleDeleteSubmission={handleDeleteSubmission}
                    actionLoading={actionLoading}
                    fetchWithAuth={fetchWithAuth} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '2.5rem', 
          paddingTop: '1.5rem', 
          borderTop: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              Logged in as Editorial Board Member
            </span>
            <Link
              href="/dashboard"
              className="btn btn-ghost"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--color-primary-dark)',
                border: '1px solid var(--color-primary-dark)',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              ← Return to Journal Dashboard
            </Link>
          </div>
          <button 
            onClick={logout} 
            className="btn" 
            style={{ 
              padding: '0.6rem 1.25rem', 
              color: '#b3261e', 
              background: 'rgba(179, 38, 30, 0.06)', 
              border: '1px solid rgba(179, 38, 30, 0.2)',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(179, 38, 30, 0.12)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(179, 38, 30, 0.06)'}
          >
            ← Log Out of Portal
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReviewAssignment {
  id: string;
  submission_id: string;
  reviewer_email: string;
  status: string;
  recommendation?: string;
  comments_for_editor?: string;
  comments_for_author?: string;
  assigned_at: string;
  completed_at?: string;
}

function SubmissionRow({ 
  sub, 
  handleUpdateStatus, 
  handleDeleteSubmission,
  actionLoading,
  fetchWithAuth
}: { 
  sub: Submission;
  handleUpdateStatus: (id: string, status: string) => void;
  handleDeleteSubmission: (id: string) => void;
  actionLoading: string | null;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState<ReviewAssignment[]>([]);
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (expanded) {
      loadReviews();
    }
  }, [expanded]);

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/reviews/submission/${sub.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.error('Failed loading reviews', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAssignReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerEmail.trim()) return;
    setAssigning(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/reviews/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: sub.id,
          reviewer_email: reviewerEmail.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.email_sent === false) {
          alert(`Reviewer successfully assigned (${data.assignment_id})!\n\nNote: The email invitation could not be sent directly due to network/API restrictions (${data.email_error || 'timeout'}). The assignment is saved and active in your dashboard.`);
        } else {
          alert('Reviewer invited! Automated email dispatched.');
        }
        setReviewerEmail('');
        loadReviews();
        if (sub.status === 'submitted') {
          handleUpdateStatus(sub.id, 'under-review');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to assign reviewer: ${errData.detail || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error assigning reviewer: Network connection failed. Check console.');
    } finally {
      setAssigning(false);
    }
  };
  
  return (
    <>
      <tr style={{ borderBottom: expanded ? 'none' : '1px solid var(--color-border)', transition: 'background 0.15s' }}>
        <td style={{ padding: '0.85rem', fontSize: '0.9rem' }}>
          <code style={{ background: 'var(--color-surface-alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{sub.id}</code>
        </td>
        <td style={{ padding: '0.85rem', maxWidth: '280px' }}>
          <strong style={{ color: 'var(--color-primary-dark)', display: 'block', marginBottom: '0.2rem' }}>{sub.title}</strong>
          <span className="muted" style={{ fontSize: '0.8rem' }}>{sub.category}</span>
        </td>
        <td style={{ padding: '0.85rem', fontSize: '0.9rem' }}>{sub.author.name}</td>
        <td style={{ padding: '0.85rem' }}>
          <span className={`status-badge ${sub.status}`} style={{
            display: 'inline-block',
            padding: '0.25rem 0.65rem',
            borderRadius: '50px',
            fontSize: '0.75rem',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            background: (sub.status === 'published' || sub.status === 'payment-received') ? 'rgba(46, 125, 79, 0.15)' : sub.status === 'rejected' ? 'rgba(179, 38, 30, 0.15)' : 'rgba(201, 164, 73, 0.2)',
            color: (sub.status === 'published' || sub.status === 'payment-received') ? '#2e7d4f' : sub.status === 'rejected' ? '#b3261e' : '#8c6d1f',
            border: `1px solid ${(sub.status === 'published' || sub.status === 'payment-received') ? 'rgba(46, 125, 79, 0.3)' : sub.status === 'rejected' ? 'rgba(179, 38, 30, 0.3)' : 'rgba(201, 164, 73, 0.4)'}`
          }}>
            {sub.status}
          </span>
        </td>
        <td style={{ padding: '0.85rem' }}>
          <div className="flex table-actions" style={{ gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              className="btn"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: '4px', fontWeight: '600', color: 'var(--color-primary-dark)', cursor: 'pointer' }}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Collapse' : 'Expand Panel'}
            </button>
            <a 
              href={`/api/uploads/download/${encodeURIComponent(sub.manuscriptName)}`} 
              className="btn"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: '#059669', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontWeight: '600' }}
              download
            >
              Download File
            </a>
            <a 
              href={`/api/uploads/view/${encodeURIComponent(sub.manuscriptName)}`} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--color-primary)', border: '1px solid var(--color-border)', borderRadius: '4px', textDecoration: 'none' }}
            >
              View
            </a>
            {sub.status === 'payment-received' && (
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '4px', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                onClick={() => handleUpdateStatus(sub.id, 'published')}
                disabled={actionLoading === sub.id}
              >
                {actionLoading === sub.id ? '...' : 'Publish'}
              </button>
            )}
            {(sub.status === 'submitted' || sub.status === 'under-review') && (
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '4px', background: '#3b82f6', borderColor: '#3b82f6', color: '#fff' }}
                onClick={() => handleUpdateStatus(sub.id, 'accepted')}
                disabled={actionLoading === sub.id}
              >
                {actionLoading === sub.id ? '...' : 'Accept'}
              </button>
            )}
            {sub.status !== 'rejected' && (
              <button 
                className="btn btn-ghost" 
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--color-danger)', border: '1px solid rgba(179, 38, 30, 0.3)', borderRadius: '4px' }}
                onClick={() => handleUpdateStatus(sub.id, 'rejected')}
                disabled={actionLoading === sub.id}
              >
                {actionLoading === sub.id ? '...' : 'Reject'}
              </button>
            )}
            {sub.status === 'rejected' && (
              <button 
                className="btn" 
                style={{ 
                  padding: '0.35rem 0.65rem', 
                  fontSize: '0.8rem', 
                  color: '#ffffff', 
                  backgroundColor: '#dc2626', 
                  border: '1px solid #b91c1c',
                  borderRadius: '4px',
                  cursor: actionLoading === sub.id ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
                onClick={() => handleDeleteSubmission(sub.id)}
                disabled={actionLoading === sub.id}
              >
                {actionLoading === sub.id ? '...' : 'Delete'}
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="expanded-row" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
          <td colSpan={5} style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
            
            {/* Metadata & Abstract Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <strong style={{ color: 'var(--color-primary-dark)', fontSize: '1rem' }}>Abstract & Scholarly Metadata</strong>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <a href={`/api/uploads/download/${encodeURIComponent(sub.manuscriptName)}`} download style={{ padding: '0.25rem 0.65rem', background: '#059669', color: '#fff', borderRadius: '4px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Download Manuscript File
                  </a>
                  <a href={`${API_URL}/api/submissions/${sub.id}/jats.xml`} target="_blank" rel="noreferrer" style={{ padding: '0.25rem 0.65rem', background: '#1e3a5f', color: '#fff', borderRadius: '4px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: '600' }}>
                    Export NISO JATS XML
                  </a>
                  <a href={`${API_URL}/api/submissions/${sub.id}/metadata`} target="_blank" rel="noreferrer" style={{ padding: '0.25rem 0.65rem', background: '#2b5282', color: '#fff', borderRadius: '4px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: '600' }}>
                    Dublin Core Metadata
                  </a>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                {sub.abstract}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', fontSize: '0.9rem', background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
              <div>
                <strong style={{ color: 'var(--color-primary-dark)' }}>Academic DOI:</strong>
                <p style={{ marginTop: '0.5rem', margin: 0, fontFamily: 'monospace', fontWeight: '600', color: sub.doi ? '#2e7d4f' : '#888' }}>
                  {sub.doi || 'Issued automatically on Acceptance/Publication'}
                </p>
              </div>
              <div>
                <strong style={{ color: 'var(--color-primary-dark)' }}>Keywords:</strong>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {sub.keywords.map(kw => (
                    <span key={kw} style={{ padding: '0.2rem 0.6rem', backgroundColor: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <strong style={{ color: 'var(--color-primary-dark)' }}>Category & Version:</strong>
                <p style={{ marginTop: '0.5rem', margin: 0 }}>{sub.category} (v{sub.version || 1})</p>
              </div>
              <div>
                <strong style={{ color: 'var(--color-primary-dark)' }}>Author Contact:</strong>
                <p style={{ marginTop: '0.5rem', margin: 0 }}>
                  <a href={`mailto:${sub.author.email}`}>{sub.author.email}</a>
                  <br />
                  <span className="muted" style={{ fontSize: '0.85rem' }}>{sub.author.affiliation}</span>
                </p>
              </div>
            </div>

            {/* Peer Review Management Section */}
            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #cfe2ff', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#1e3a5f', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Peer Review Management & Double-Blind Evaluations
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                    Assign expert reviewers and inspect anonymized double-blind scoring reports.
                  </p>
                </div>
              </div>

              {/* Assign Reviewer Form */}
              <form onSubmit={handleAssignReviewer} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <input
                  type="email"
                  placeholder="Enter external reviewer email (e.g. professor@university.edu)"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                  style={{ flex: '1 1 250px', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  required
                />
                <button
                  type="submit"
                  disabled={assigning}
                  style={{ padding: '0.5rem 1rem', background: '#1e3a5f', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: '600', fontSize: '0.85rem', cursor: assigning ? 'not-allowed' : 'pointer' }}
                >
                  {assigning ? 'Inviting...' : 'Invite Reviewer via Email'}
                </button>
              </form>

              {/* Reviews List */}
              {loadingReviews ? (
                <p style={{ fontSize: '0.85rem', color: '#666' }}>Loading peer review scores...</p>
              ) : reviews.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic', margin: 0 }}>
                  No peer reviewers assigned yet. Invite a reviewer above to trigger automated double-blind review invitations.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {reviews.map((rev) => (
                    <div key={rev.id} style={{ padding: '0.85rem', borderRadius: '6px', background: rev.status === 'completed' ? '#f0fdf4' : '#fffbeb', border: `1px solid ${rev.status === 'completed' ? '#bbf7d0' : '#fde68a'}`, fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <div>
                          <strong style={{ color: '#1e3a5f' }}>Reviewer:</strong> {rev.reviewer_email} &nbsp;
                          <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: rev.status === 'completed' ? '#dcfce7' : '#fef3c7', color: rev.status === 'completed' ? '#166534' : '#92400e', fontWeight: '700', textTransform: 'uppercase' }}>
                            {rev.status}
                          </span>
                        </div>
                        {rev.recommendation && (
                          <div style={{ fontWeight: '700', color: rev.recommendation === 'Accept' ? '#166534' : rev.recommendation === 'Reject' ? '#991b1b' : '#b45309' }}>
                            Decision: {rev.recommendation}
                          </div>
                        )}
                      </div>
                      {rev.comments_for_editor && (
                        <div style={{ marginTop: '0.4rem', padding: '0.5rem', background: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                          <strong style={{ fontSize: '0.8rem', color: '#4b5563' }}>Confidential Comments for Editor:</strong>
                          <p style={{ margin: '0.2rem 0 0 0', color: '#1f2937' }}>{rev.comments_for_editor}</p>
                        </div>
                      )}
                      {rev.comments_for_author && (
                        <div style={{ marginTop: '0.4rem', padding: '0.5rem', background: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                          <strong style={{ fontSize: '0.8rem', color: '#4b5563' }}>Comments for Author:</strong>
                          <p style={{ margin: '0.2rem 0 0 0', color: '#1f2937' }}>{rev.comments_for_author}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </td>
        </tr>
      )}
    </>
  );
}
