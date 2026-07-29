'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSubmissions } from '@/lib/useSubmissions';
import StripeProvider from '@/components/StripeProvider';
import PaymentForm from '@/components/PaymentForm';
import { journalInfo, type Submission } from '@/lib/data';
import { API_URL } from '@/lib/config';

function statusBadge(status: Submission['status']) {
  switch (status) {
    case 'submitted': return <span className="badge info">Under Editorial Review</span>;
    case 'under-review': return <span className="badge warning">Peer Review</span>;
    case 'accepted': return <span className="badge success">Accepted (Payment Required)</span>;
    case 'payment-received': return <span className="badge success">Payment Received</span>;
    case 'published': return <span className="badge success">Published</span>;
  }
}

export default function DashboardPage() {
  const { submissions, loaded, update } = useSubmissions({ myOnly: true });
  const [payingId, setPayingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const [authorCountry, setAuthorCountry] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('author_token');
    if (!token) {
      router.push('/login?callbackUrl=/dashboard');
    } else {
      setIsAuthenticated(true);
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setAuthorCountry(data.country);
        })
        .catch(console.error);
    }
  }, [router]);

  const getAmount = () => authorCountry === 'Nigeria' ? 45000 : 150;
  const getCurrency = () => authorCountry === 'Nigeria' ? 'NGN' : 'USD';
  const getFeeString = () => authorCountry === 'Nigeria' ? '₦45,000 NGN' : '$150 USD';


  if (!isAuthenticated) return null;

  return (
    <div className="page">
      <div className="main-col">
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="section-title">My Submissions</h1>
            <p>Track the status of your submissions and complete pending payments.</p>
          </div>
          <button 
            className="btn btn-ghost" 
            onClick={() => {
              sessionStorage.removeItem('author_token');
              router.push('/login');
            }}
          >
            Log Out
          </button>
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

            {s.status === 'accepted' && (
              <>
                <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                  <strong>Payment Required:</strong> Complete the publication fee payment to
                  proceed to final publication and DOI assignment.
                </div>
                {payingId === s.id && clientSecret ? (
                  <div>
                    <StripeProvider clientSecret={clientSecret}>
                      <PaymentForm
                        amount={getAmount()}
                        currency={getCurrency()}
                        description={`Publication fee for "${s.title}"`}
                        onSuccess={async (pi) => {
                          try {
                            const res = await fetch(`${API_URL}/api/payments/verify`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ paymentIntentId: pi, submissionId: s.id })
                            });
                            if (res.ok) {
                              window.location.reload();
                            } else {
                              const errText = await res.text();
                              console.error("Verification failed:", res.status, errText);
                              alert(`Payment succeeded in Stripe but failed to verify on the server: ${res.status} ${errText}`);
                            }
                          } catch (e) {
                            console.error(e);
                          }
                          setPayingId(null);
                          setClientSecret(null);
                        }}
                        onBack={() => {
                          setPayingId(null);
                          setClientSecret(null);
                        }}
                      />
                    </StripeProvider>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    disabled={payingId === s.id}
                    onClick={async () => {
                      setPayingId(s.id);
                      try {
                        const paymentRes = await fetch(`${API_URL}/api/payments/create-intent`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ amount: getAmount(), currency: getCurrency(), submissionId: s.id }),
                        });
                        if (paymentRes.ok) {
                          const paymentData = await paymentRes.json();
                          setClientSecret(paymentData.clientSecret);
                        } else {
                          setPayingId(null);
                          alert("Failed to create payment intent.");
                        }
                      } catch (e) {
                        console.error(e);
                        setPayingId(null);
                      }
                    }}
                  >
                    {payingId === s.id ? 'Loading...' : `Pay ${getFeeString()} Publication Fee`}
                  </button>
                )}
              </>
            )}

            {s.status === 'payment-received' && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                <strong>Payment received.</strong> Your manuscript is fully cleared for publication.
                You will be notified once it is live online.
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
