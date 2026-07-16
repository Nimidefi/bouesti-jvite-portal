'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/config';

interface BlindSubmission {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  author: {
    name: string;
    email: string;
    affiliation: string;
  };
  manuscriptName: string;
  category: string;
  submittedAt: string;
  status: string;
  double_blind_verified: boolean;
}

export default function ReviewerPortal() {
  const [submissionId, setSubmissionId] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [manuscript, setManuscript] = useState<BlindSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Scorecard state
  const [recommendation, setRecommendation] = useState('Minor Revisions');
  const [commentsForEditor, setCommentsForEditor] = useState('');
  const [commentsForAuthor, setCommentsForAuthor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlAssignId = params.get('assignment_id');
      const urlSubId = params.get('submission_id');
      if (urlAssignId && urlSubId) {
        setAssignmentId(urlAssignId);
        setSubmissionId(urlSubId);
        fetchManuscriptWithIds(urlSubId, urlAssignId);
      }
    }
  }, []);

  const fetchManuscriptWithIds = async (subId: string, assignId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API_URL}/api/reviews/blind-manuscript/${encodeURIComponent(subId.trim())}?assignment_id=${encodeURIComponent(assignId.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setManuscript(data);
      } else {
        const errData = await res.json().catch(() => null);
        setError(errData?.detail || 'Forbidden: Access denied. Please ensure your Assignment ID and Submission ID match those sent to your invitation email.');
        setManuscript(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to Double-Blind review server.');
      setManuscript(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadManuscript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionId.trim() || !assignmentId.trim()) {
      setError('Both Manuscript ID and Assignment ID are strictly required.');
      return;
    }
    await fetchManuscriptWithIds(submissionId, assignmentId);
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manuscript || !assignmentId.trim()) {
      alert('Please enter your valid Assignment ID before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId.trim(),
          recommendation,
          comments_for_editor: commentsForEditor,
          comments_for_author: commentsForAuthor
        })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const errData = await res.json().catch(() => null);
        alert(errData?.detail || 'Could not submit evaluation. Please check your assignment credentials.');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: '960px', margin: '2.5rem auto', padding: '0 1rem' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
        color: '#ffffff',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            padding: '0.35rem 0.85rem',
            borderRadius: '50px',
            fontSize: '0.8rem',
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: '#ffffff',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <img src="/logo.png" alt="BOUESTI Crest Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            <span>Double-Blind Peer Review Portal</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0', fontWeight: '800', color: '#ffffff' }}>
            External Reviewer Evaluation Portal
          </h1>
          <p style={{ fontSize: '1rem', color: '#cbd5e1', maxWidth: '650px', margin: 0, lineHeight: 1.6 }}>
            Welcome to the Dovite Journal Double-Blind review workspace. Author PII and institutional details are automatically stripped to guarantee unbiased scientific evaluation.
          </p>
        </div>
      </div>

      {/* Lookup Form Card */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem', background: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary-dark)', fontSize: '1.15rem' }}>
          🔍 Load Anonymized Manuscript
        </h3>
        <form onSubmit={handleLoadManuscript} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155' }}>
              Manuscript ID <span style={{ color: '#b91c1c' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. sub_37fee648"
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              required
            />
          </div>

          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155' }}>
              Assignment ID <span style={{ color: '#b91c1c' }}>*</span> <span className="muted" style={{ fontWeight: 'normal' }}>(from email invitation)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. assign_81a4bc92"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !submissionId.trim() || !assignmentId.trim()}
            style={{ padding: '0.65rem 1.5rem', background: '#1e3a5f', border: 'none', borderRadius: '6px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}
          >
            {loading ? 'Redacting & Loading...' : '🔒 Open Blinded Workspace'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.85rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '6px', border: '1px solid #fecaca', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Manuscript Content & Scorecard */}
      {manuscript && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* Anonymized Manuscript Viewer Card */}
          <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#166534', background: '#dcfce7', padding: '0.3rem 0.75rem', borderRadius: '50px', border: '1px solid #bbf7d0', display: 'inline-block', marginBottom: '0.75rem' }}>
                  🛡️ Double-Blind Verified: PII Completely Removed
                </span>
                <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: '0 0 0.4rem 0', fontWeight: '800' }}>
                  {manuscript.title}
                </h2>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  Category: <strong style={{ color: '#334155' }}>{manuscript.category}</strong> &nbsp; | &nbsp; 
                  Submission ID: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{manuscript.id}</code>
                </div>
              </div>

              <div className="table-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a
                  href={`/api/uploads/download/${encodeURIComponent(manuscript.manuscriptName)}`}
                  download
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#059669',
                    color: '#ffffff',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    boxShadow: '0 4px 10px rgba(5, 150, 105, 0.2)'
                  }}
                >
                  📥 Download Blinded Manuscript
                </a>
                <a
                  href={`${API_URL}/uploads/${encodeURIComponent(manuscript.manuscriptName)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#1e3a5f',
                    color: '#ffffff',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  👁️ View Online
                </a>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#1e293b', fontSize: '1.05rem', margin: '0 0 0.5rem 0' }}>Abstract</h4>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#334155', background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', margin: 0 }}>
                {manuscript.abstract}
              </p>
            </div>

            <div>
              <h4 style={{ color: '#1e293b', fontSize: '1.05rem', margin: '0 0 0.5rem 0' }}>Indexed Keywords</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {manuscript.keywords.map(kw => (
                  <span key={kw} style={{ background: '#e2e8f0', color: '#1e293b', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Evaluation Scorecard Form */}
          <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '2px solid #3b82f6' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e3a5f', fontSize: '1.4rem' }}>
              📝 Peer Review Evaluation Scorecard
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#64748b' }}>
              Provide your rigorous assessment below. Your recommendations guide the Editorial Board's final publication decision.
            </p>

            {success ? (
              <div style={{ padding: '2rem', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                <h3 style={{ color: '#166534', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                  Peer Evaluation Successfully Submitted!
                </h3>
                <p style={{ color: '#15803d', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Thank you for your valuable contribution to the Dovite Journal peer review process. Your score (`{recommendation}`) and comments have been securely recorded in the immutable editorial ledger.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  style={{ padding: '0.6rem 1.5rem', background: '#166534', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Edit Evaluation / Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitScore} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Recommendation Radio Selector */}
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '1rem', color: '#0f172a', marginBottom: '0.75rem' }}>
                    1. Recommendation Decision <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { val: 'Accept', title: '✓ Accept Submission', desc: 'Publish with no further changes.', border: '#22c55e', bg: '#f0fdf4' },
                      { val: 'Minor Revisions', title: '✍️ Minor Revisions', desc: 'Accept upon minor formatting/clarifications.', border: '#3b82f6', bg: '#eff6ff' },
                      { val: 'Major Revisions', title: '🔄 Major Revisions', desc: 'Require re-submission and re-review.', border: '#f59e0b', bg: '#fffbeb' },
                      { val: 'Reject', title: '✗ Reject Submission', desc: 'Does not meet technical standards.', border: '#ef4444', bg: '#fef2f2' },
                    ].map(opt => (
                      <label
                        key={opt.val}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: `2px solid ${recommendation === opt.val ? opt.border : '#e2e8f0'}`,
                          background: recommendation === opt.val ? opt.bg : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>
                          <input
                            type="radio"
                            name="recommendation"
                            value={opt.val}
                            checked={recommendation === opt.val}
                            onChange={(e) => setRecommendation(e.target.value)}
                            style={{ accentColor: opt.border, width: '18px', height: '18px' }}
                          />
                          {opt.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.3rem', paddingLeft: '1.75rem' }}>
                          {opt.desc}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Confidential Comments to Editor */}
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '1rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                    2. Confidential Comments to Editor <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                    These comments are strictly private and will ONLY be seen by the Editorial Board.
                  </span>
                  <textarea
                    rows={4}
                    required
                    value={commentsForEditor}
                    onChange={(e) => setCommentsForEditor(e.target.value)}
                    placeholder="Provide confidential assessment of methodology, originality, statistical validity, and any ethical or plagiarism concerns..."
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', lineHeight: 1.5, fontFamily: 'inherit' }}
                  />
                </div>

                {/* Constructive Comments for Author */}
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '1rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                    3. Constructive Feedback for Author(s) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                    These comments will be forwarded to the author(s) anonymously during revision requests.
                  </span>
                  <textarea
                    rows={5}
                    required
                    value={commentsForAuthor}
                    onChange={(e) => setCommentsForAuthor(e.target.value)}
                    placeholder="Detail specific suggestions for improving structure, clarity, equations, figures, or literature review..."
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', lineHeight: 1.5, fontFamily: 'inherit' }}
                  />
                </div>

                {/* Submit Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                      color: '#ffffff',
                      padding: '0.85rem 2.25rem',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    {submitting ? 'Submitting Evaluation...' : '✉️ Submit Peer Review Evaluation'}
                  </button>
                </div>

              </form>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
