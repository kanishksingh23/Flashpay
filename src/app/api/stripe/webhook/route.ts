import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase-server';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { invoiceId, merchantId } = session.metadata || {};

    if (!invoiceId || !merchantId) return NextResponse.json({ ok: true });

    // Determine payment method
    const paymentMethod = session.payment_method_types?.[0] === 'us_bank_account'
      ? 'bank'
      : 'card';

    // Update invoice to paid
    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        payment_method: paymentMethod,
        stripe_payment_intent_id: session.payment_intent as string,
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    // Get invoice details for push notification
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (!invoice) return NextResponse.json({ ok: true });

    // Get merchant's push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('merchant_id', merchantId);

    // Send push notifications (handled by separate endpoint for simplicity)
    if (subscriptions && subscriptions.length > 0) {
      const { sendPaymentPush } = await import('@/lib/push-server');
      await Promise.allSettled(
        subscriptions.map((sub) =>
          sendPaymentPush(sub.subscription, {
            amount: invoice.amount,
            customerName: invoice.customer_name,
            invoiceId: invoice.id,
          })
        )
      );
    }
  }

  return NextResponse.json({ ok: true });
}
