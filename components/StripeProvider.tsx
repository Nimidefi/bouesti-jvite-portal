'use client';

import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { getStripe, isStripeDemo } from '@/lib/stripe';
import { journalInfo } from '@/lib/data';

export default function StripeProvider({ children, clientSecret }: { children: React.ReactNode, clientSecret?: string | null }) {
  if (isStripeDemo) {
    return <>{children}</>;
  }
  const stripe = getStripe();
  
  const appearance: StripeElementsOptions['appearance'] = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#1e3a5f',
      colorBackground: '#ffffff',
      colorText: '#2a2a2a',
      colorDanger: '#b3261e',
      fontFamily: 'Georgia, serif',
      borderRadius: '6px',
    },
  };

  const options: StripeElementsOptions = clientSecret
    ? {
        clientSecret,
        appearance,
      }
    : {
        mode: 'payment',
        amount: journalInfo.publicationFee * 100, // cents
        currency: journalInfo.currency.toLowerCase(),
        appearance,
      };

  return (
    <Elements stripe={stripe} options={options}>
      {children}
    </Elements>
  );
}
