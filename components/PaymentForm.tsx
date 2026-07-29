'use client';

import { useState, FormEvent } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { isStripeDemo } from '@/lib/stripe';
import { journalInfo } from '@/lib/data';

interface Props {
  amount: number;
  currency?: string;
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
  description: string;
}

/**
 * This component is a self-contained payment form. When a real Stripe
 * publishable key is configured via `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, the
 * `StripeProvider` in the parent wraps it in `<Elements>` and you can swap the
 * inner form for a real `<PaymentElement>` from `@stripe/react-stripe-js`. In
 * demo mode (no key), it shows a simulated card form so reviewers can always
 * walk through the flow.
 */
export default function PaymentForm({ amount, currency = journalInfo.currency, onSuccess, onBack, description }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNgn = currency === 'NGN';
  const displaySymbol = isNgn ? '₦' : '$';

  const simulatePayment = () => {
    setSubmitting(true);
    setError(null);
    setTimeout(() => {
      onSuccess('pi_demo_' + Math.random().toString(36).slice(2, 12));
    }, 1200);
  };

  return (
    <div>
      <div className="callout">
        <strong>Order Summary</strong>
        <div className="kv" style={{ marginTop: '0.5rem' }}>
          <div className="k">Description</div><div>{description}</div>
          <div className="k">Journal</div><div>{journalInfo.shortName}</div>
          <div className="k">Fee Type</div><div>Article Processing Charge (APC)</div>
          <div className="k">Amount</div>
          <div><strong>{displaySymbol}{amount.toLocaleString()} {currency}</strong></div>
        </div>
      </div>

      {isStripeDemo ? (
        <div className="alert alert-info">
          <strong>Demo Mode:</strong> No Stripe publishable key configured —
          using a simulated payment form. Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{' '}
          to your <code>.env.local</code> to use real Stripe Elements.
        </div>
      ) : null}

      {isStripeDemo ? (
        <SimulatedCardForm
          amount={amount}
          currency={currency}
          displaySymbol={displaySymbol}
          onPay={simulatePayment}
          submitting={submitting}
          error={error}
        />
      ) : (
        <RealCardForm
          amount={amount}
          currency={currency}
          displaySymbol={displaySymbol}
          onSuccess={onSuccess}
          submitting={submitting}
          setSubmitting={setSubmitting}
          error={error}
          setError={setError}
        />
      )}
      
      <div className="row" style={{ marginTop: '1rem' }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onBack}
          style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

function RealCardForm({ 
  amount, 
  currency,
  displaySymbol,
  onSuccess, 
  submitting, 
  setSubmitting, 
  error, 
  setError 
}: { 
  amount: number, 
  currency: string,
  displaySymbol: string,
  onSuccess: (id: string) => void, 
  submitting: boolean, 
  setSubmitting: (val: boolean) => void, 
  error: string | null, 
  setError: (val: string | null) => void 
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleRealPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    
    setSubmitting(true);
    setError(null);
    
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/dashboard',
      },
      redirect: 'if_required',
    });
    
    if (submitError) {
      setError(submitError.message || 'An error occurred during payment');
      setSubmitting(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setError('Payment not completed.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleRealPayment}>
      <PaymentElement />
      {error && <div className="alert alert-danger" style={{ marginTop: '1rem' }}>{error}</div>}
      <div className="row" style={{ marginTop: '1rem' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || !stripe || !elements}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          {submitting ? 'Processing…' : `Pay ${displaySymbol}${amount.toLocaleString()} ${currency}`}
        </button>
      </div>
    </form>
  );
}

function SimulatedCardForm({
  amount,
  currency,
  displaySymbol,
  onPay,
  submitting,
  error,
}: {
  amount: number;
  currency: string;
  displaySymbol: string;
  onPay: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [exp, setExp] = useState('12 / 28');
  const [cvc, setCvc] = useState('123');
  const [name, setName] = useState('Demo Researcher');
  const [err, setErr] = useState<string | null>(null);

  const handle = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (card.replace(/\s/g, '').length < 13) {
      setErr('Please enter a valid card number.');
      return;
    }
    if (cvc.length < 3) {
      setErr('Please enter a valid CVC.');
      return;
    }
    onPay();
  };

  return (
    <form onSubmit={handle}>
      <div className="form-group">
        <label>Card Number</label>
        <div className="stripe-box">
          <input
            value={card}
            onChange={(e) => setCard(e.target.value)}
            style={{ border: 'none', padding: 0, background: 'transparent', width: '100%' }}
            maxLength={23}
          />
        </div>
        <div className="help">Stripe test card: <code>4242 4242 4242 4242</code></div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label>Cardholder Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Expiration (MM / YY)</label>
          <input value={exp} onChange={(e) => setExp(e.target.value)} />
        </div>
        <div className="form-group">
          <label>CVC</label>
          <input value={cvc} onChange={(e) => setCvc(e.target.value)} maxLength={4} />
        </div>
        <div className="form-group">
          <label>Country</label>
          <select>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>Malaysia</option>
            <option>Nigeria</option>
            <option>Singapore</option>
          </select>
        </div>
      </div>
      {err && <div className="alert alert-danger">{err}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row" style={{ marginTop: '1rem' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          {submitting ? 'Processing…' : `Pay ${displaySymbol}${amount.toLocaleString()} ${currency}`}
        </button>
      </div>
    </form>
  );
}
