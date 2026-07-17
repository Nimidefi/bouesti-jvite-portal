'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSubmissions } from '@/lib/useSubmissions';
import StripeProvider from '@/components/StripeProvider';
import PaymentForm from '@/components/PaymentForm';
import { journalInfo, type Submission } from '@/lib/data';
import { API_URL } from '@/lib/config';

function statusBadge(status: Submission['status']) {
  switch (status) {
    case 'submitted': return <span className="badge info">Under Editorial Review</span>;
    case 'under-review': return <span className="badge warning">Peer Review</span>;
    case 'accepted': return <span className="badge success">Accepted</span>;
    case 'published': return <span className="badge success">Published</span>;
  }
}

export default function DashboardPage() {
  const { submissions, loaded, update } = useSubmissions();
  const [payingId, setPayingId] = useState<string | null>(null);

  return (
    <div className="page">
      <div className="main-col">
        <div className="card">
          <h1 className="section-title"> My Submissions</h1>
          <p>Track the status of your submissions and complete pending payments.</p>
        </div>

        {!loaded && <div className="card">Loading…</div>}

        {loaded && submissions.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.1rem' }}>You have no submissions yet.</p>
            <p className="muted">Submit your first manuscript to get started.</p>
            <Link href="/submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Submit a Manuscript
            </Link>
          </div>
        )}

        {loaded && submissions.map((s) => (
          <div className="card" key={s.id}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '0.3rem' }}>{s.title}</h3>
                <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                  Submission ID: <code>{s.id}</code> · Submitted{' '}
                  {new Date(s.submittedAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </div>
              {statusBadge(s.status)}
            </div>

            <div className="divider" />

            <div className="kv">
              <div className="k">Category</div><div>{s.category}</div>
              <div className="k">Author</div><div>{s.author.name} ({s.author.email})</div>
              <div className="k">Affiliation</div><div>{s.author.affiliation}</div>
              <div className="k">Keywords</div><div>{s.keywords.join(', ')}</div>
              <div className="k">Manuscript</div>
              <div className="table-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span>{s.manuscriptName} ({(s.manuscriptSize / 1024 / 1024).toFixed(2)} MB)</span>
                <a 
                  href={`/api/uploads/download/${encodeURIComponent(s.manuscriptName)}`} 
                  download 
                  style={{ textDecoration: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#059669', color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}
                >
                  Download File
                </a>
              </div>
            </div>

            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-primary)' }}>
                View Abstract
              </summary>
              <p style={{ marginTop: '0.5rem' }}>{s.abstract}</p>
            </details>

            {s.status === 'submitted' && (
              <>
                <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                  <strong>Payment Required:</strong> Complete the publication fee payment to
                  proceed with peer review.
                </div>
                {payingId === s.id ? (
                  <div>
                    <StripeProvider>
                      <PaymentForm
                        amount={journalInfo.publicationFee}
                        description={`Publication fee for "${s.title}"`}
                        onSuccess={(pi) => {
                          update(s.id, { status: 'accepted' });
                          setPayingId(null);
                        }}
                        onBack={() => setPayingId(null)}
                      />
                    </StripeProvider>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => setPayingId(s.id)}
                  >
                    Pay ${journalInfo.publicationFee} {journalInfo.currency} Publication Fee
                  </button>
                )}
              </>
            )}

            {s.status === 'accepted' && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                <strong>Payment received &amp; submission accepted.</strong> Your manuscript is
                now in the production queue. You will receive a copy-edited proof within 7–10 days.
              </div>
            )}
          </div>
        ))}
      </div>

      <aside className="side-col">
        <div className="widget">
          <h3>Quick Actions</h3>
          <ul>
            <li><Link href="/submit"> New Submission</Link></li>
            <li><Link href="/guidelines"> Guidelines</Link></li>
            <li><Link href="/issues"> Browse Issues</Link></li>
            <li><Link href="/contact"> Contact Editor</Link></li>
          </ul>
        </div>
        <div className="widget">
          <h3>Status Legend</h3>
          <ul>
            <li><span className="badge info">Under Editorial Review</span></li>
            <li><span className="badge warning">Peer Review</span></li>
            <li><span className="badge success">Accepted</span></li>
            <li><span className="badge success">Published</span></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
