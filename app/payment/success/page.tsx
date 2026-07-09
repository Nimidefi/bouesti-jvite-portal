'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { journalInfo } from '@/lib/data';

function SuccessContent() {
  const params = useSearchParams();
  const id = params.get('id');
  const pi = params.get('pi');

  return (
    <div className="page">
      <div className="main-col">
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem' }}>🎉</div>
          <h1 style={{ color: 'var(--color-success)' }}>Payment Successful!</h1>
          <p style={{ fontSize: '1.1rem' }}>
            Thank you for your submission to {journalInfo.shortName}.
          </p>
          <p>
            A receipt has been emailed to you. Your manuscript will now enter peer review.
          </p>
        </div>

        <div className="receipt">
          <h2 style={{ marginTop: 0, color: 'var(--color-success)' }}>📄 Payment Receipt</h2>
          <div className="kv">
            <div className="k">Submission ID</div><div><code>{id || '—'}</code></div>
            <div className="k">Payment ID</div><div><code>{pi || 'pi_demo_local'}</code></div>
            <div className="k">Amount</div><div className="total">${journalInfo.publicationFee.toFixed(2)} {journalInfo.currency}</div>
            <div className="k">Description</div><div>Article Processing Charge (APC)</div>
            <div className="k">Date</div>
            <div>{new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</div>
            <div className="k">Status</div>
            <div>
              <span className="badge success">✓ PAID</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">What happens next?</h2>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Confirmation email</strong> — You will receive a confirmation with submission details (1–2 hours).</li>
            <li><strong>Editorial screening</strong> — Our editors verify scope and format (3–5 days).</li>
            <li><strong>Peer review</strong> — Two expert reviewers evaluate your work (4–6 weeks).</li>
            <li><strong>Decision</strong> — You will be notified of accept, revise, or reject (via email).</li>
            <li><strong>Production</strong> — Copy-editing, typesetting, and online publication (2–3 weeks).</li>
          </ol>
        </div>

        <div className="row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <Link href="/dashboard" className="btn btn-primary">View My Submissions</Link>
          <Link href="/" className="btn btn-secondary">Return to Home</Link>
        </div>
      </div>

      <aside className="side-col">
        <div className="widget">
          <h3>📞 Need Help?</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            For questions about your payment or submission, contact our editorial office.
          </p>
          <ul>
            <li>editor@jvite.example.edu</li>
            <li>+1 (555) 234-5678</li>
          </ul>
        </div>
        <div className="widget">
          <h3>📥 Download</h3>
          <ul>
            <li><a href="#">Print this receipt</a></li>
            <li><a href="#">Download PDF receipt</a></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="page"><div className="card">Loading…</div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
