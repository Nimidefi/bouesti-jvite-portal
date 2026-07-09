# JVITE — Journal of Vocational & Industrial Technology Education

A demo frontend for the Department of Vocational and Industrial Technology Education's
academic journal platform, built with **Next.js 14 (App Router)**, **React 18**, **TypeScript**,
and **Stripe Elements** for publication-fee payments.

## Features

- **Multi-page journal site** — Home, About, Issues, Guidelines, Submit, Dashboard, Contact
- **Article submission flow** — 4-step wizard with full form validation
  - Manuscript details (title, abstract, keywords, category)
  - Author information (name, email, affiliation, ORCID, co-authors)
  - File upload (drag-and-drop, type & size validation, policy agreements)
  - Publication fee payment
- **Stripe Elements integration** — production-ready card collection using
  `@stripe/react-stripe-js`. Falls back to a simulated card form when no Stripe key is
  configured so the demo is always walkable.
- **Persistent demo state** — submissions stored in `localStorage` (no backend needed)
- **Author dashboard** — view submissions, pay pending fees, track status
- **Polished academic UI** — header with branding, sticky navigation, side widgets,
  callouts, multi-column layout, responsive design

## Project Structure

```
journal-demo/
├── app/
│   ├── layout.tsx          # Root layout with header/nav/footer
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global academic styling
│   ├── about/page.tsx      # About the journal
│   ├── issues/page.tsx     # Issues & archives
│   ├── guidelines/page.tsx # Author guidelines
│   ├── submit/page.tsx     # Multi-step submission + payment
│   ├── dashboard/page.tsx  # My submissions
│   ├── contact/page.tsx    # Contact form
│   └── payment/success/    # Receipt page
├── components/
│   ├── Header.tsx
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   ├── StripeProvider.tsx
│   └── PaymentForm.tsx
├── lib/
│   ├── data.ts             # Journal metadata, issues, guidelines
│   ├── stripe.ts           # Stripe client-side loader
│   └── useSubmissions.ts   # localStorage-backed submission hook
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.example
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Configure a real Stripe test key
cp .env.example .env.local
# edit .env.local and set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# 3. Run the dev server
npm run dev

# 4. Open the site
# http://localhost:3000
```

## Stripe Setup (Optional)

The demo works **without a real Stripe key** — a simulated card form is shown. To use
real Stripe Elements:

1. Sign up at https://stripe.com (test mode)
2. Copy your test publishable key (`pk_test_…`)
3. Paste it into `.env.local` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Restart `npm run dev`

Use Stripe's test card: `4242 4242 4242 4242`, any future date, any CVC.

> **Note:** This is a frontend-only demo. In production, you'd add a server-side
> `createPaymentIntent` endpoint that returns a `clientSecret` to the PaymentElement.
> See Stripe docs: https://stripe.com/docs/payments/quickstart

## Walk-through

1. From the **home page**, click *Submit Your Manuscript*.
2. Fill in the 4-step submission form (use any data — validation is enforced).
3. On the final step, the publication fee is displayed. Use the simulated card form
   (or real Stripe if configured) to complete payment.
4. You'll be redirected to a **receipt page** and can view your submission in the
   **dashboard** at `/dashboard`.

## License

MIT — Demo project for the Department of Vocational and Industrial Technology Education.
