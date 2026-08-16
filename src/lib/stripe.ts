import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-07-29.dahlia' as any,
  typescript: true,
});

export const PLATFORM_FEE_PERCENT = 0.008; // 0.8% ACH fee charged to merchant
export const STRIPE_ACH_PERCENT = 0.008;   // Stripe's actual cost (0.8% up to $5)
export const STRIPE_ACH_CAP = 500;          // $5.00 cap in cents

export function calculatePlatformFee(amountCents: number): number {
  const fee = Math.round(amountCents * PLATFORM_FEE_PERCENT);
  return Math.min(fee, STRIPE_ACH_CAP);
}
