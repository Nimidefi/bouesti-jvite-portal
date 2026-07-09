'use client';

import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Stripe publishable key. In production this is supplied via env.
 * The placeholder is intentionally not a valid Stripe key (does not start
 * with `pk_live_` or `pk_test_` followed by real characters), so the simulated
 * payment form takes over in the demo.
 */
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

/**
 * `true` when no real Stripe key is configured. Used by the payment form to
 * skip Stripe loading entirely and show the simulated card form.
 */
export const isStripeDemo = !PUBLISHABLE_KEY;

export function getStripe(): Promise<Stripe | null> | null {
  if (isStripeDemo) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(PUBLISHABLE_KEY).catch(() => null);
  }
  return stripePromise;
}
