import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculatePlatformFee } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, paymentMethod, merchantStripeAccountId } = await req.json();

    const supabase = await createAdminClient();
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, merchants(*)')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    const amountCents = Math.round(invoice.amount * 100);
    const platformFeeCents = calculatePlatformFee(amountCents);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const sessionParams: any = {
      mode: 'payment',
      success_url: `${appUrl}/pay/${invoiceId}?success=true`,
      cancel_url: `${appUrl}/pay/${invoiceId}?cancelled=true`,
      metadata: { invoiceId, merchantId: invoice.merchant_id },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: invoice.merchants?.business_name || 'Service payment',
              description: `Invoice ${invoice.invoice_number}`,
            },
          },
          quantity: 1,
        },
      ],
    };

    // Payment method configuration
    if (paymentMethod === 'bank') {
      sessionParams.payment_method_types = ['us_bank_account'];
      sessionParams.payment_method_options = {
        us_bank_account: {
          financial_connections: {
            permissions: ['payment_method'],
          },
        },
      };
    } else {
      sessionParams.payment_method_types = ['card'];
    }

    // Route payment through connected account if available
    if (merchantStripeAccountId && merchantStripeAccountId !== 'demo') {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: merchantStripeAccountId },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Update invoice with checkout session ID
    await supabase
      .from('invoices')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', invoiceId);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
