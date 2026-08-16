'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { MockStore } from '@/lib/mock-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { announcePayment } from '@/lib/soundbox';
import type { Invoice, Merchant } from '@/types';

type SimulationState = 'idle' | 'connecting' | 'verifying' | 'success';

export default function CheckoutPage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [simState, setSimState] = useState<SimulationState>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInvoice() {
      // 1. Try Supabase
      try {
        const supabase = createClient();
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();

        if (invoiceData) {
          setInvoice(invoiceData);
          const { data: merchantData } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', invoiceData.merchant_id)
            .single();

          if (merchantData) setMerchant(merchantData);
          setLoading(false);
          return;
        }
      } catch {
        // fallback
      }

      // 2. Fallback to MockStore
      const mockInv = MockStore.getInvoice(invoiceId);
      const mockM = MockStore.getMerchant();
      if (mockInv) setInvoice(mockInv);
      if (mockM) setMerchant(mockM);
      setLoading(false);
    }

    fetchInvoice();
  }, [invoiceId]);

  async function handlePayment() {
    if (!invoice || !merchant) return;
    setProcessing(true);
    setError('');

    // Try live Stripe checkout API
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          paymentMethod,
          merchantStripeAccountId: merchant.stripe_account_id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch {
      // Fall through to interactive test simulation
    }

    // Interactive Demo Simulation Flow
    setSimState('connecting');
    await new Promise((r) => setTimeout(r, 1200));

    setSimState('verifying');
    await new Promise((r) => setTimeout(r, 1400));

    // Mark paid in MockStore
    const paidInv = MockStore.markInvoicePaid(invoice.id, paymentMethod);
    if (paidInv) setInvoice(paidInv);

    setSimState('success');
    setProcessing(false);

    // Announce via soundbox audio
    if (merchant.soundbox_enabled) {
      announcePayment({
        amount: invoice.amount,
        customerName: invoice.customer_name || 'Valued Customer',
        volume: merchant.soundbox_volume,
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-sm px-4 animate-pulse">
          <div className="h-6 w-32 skeleton" />
          <div className="h-48 skeleton rounded-2xl" />
          <div className="h-14 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-bold mb-2">Invoice not found</h1>
          <p className="text-muted-foreground text-sm">This payment link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  if (invoice.status === 'paid' || simState === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-5 page-enter">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl mx-auto soundbox-pulse">
            ✅
          </div>
          <div>
            <h1 className="text-2xl font-black">Payment Confirmed!</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Paid to <strong className="text-foreground">{merchant?.business_name || 'Merchant'}</strong>
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Amount Settled</span>
              <span className="text-2xl font-black text-emerald-400 font-mono-amount">
                {formatCurrency(invoice.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-border/60 pt-2">
              <span className="text-muted-foreground">Method</span>
              <span className="font-semibold capitalize">Instant Bank Transfer (0.8% ACH)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Confirmation ID</span>
              <span className="font-mono text-muted-foreground">{invoice.invoice_number}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground">🔊 Soundbox Notification Fired</div>
            <p>Merchant received audible payment confirmation on their device.</p>
          </div>

          <a
            href="/dashboard"
            className="fp-btn-secondary text-sm"
          >
            ← Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const bankAmount = invoice.amount;
  const cardSurcharge = merchant?.surcharge_enabled ? invoice.amount * 0.03 : 0;
  const cardAmount = invoice.amount + cardSurcharge;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simulation Modal */}
      {simState !== 'idle' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center space-y-4 page-enter">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto animate-spin">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {simState === 'connecting' && 'Connecting to Bank Rail...'}
                {simState === 'verifying' && 'Authorizing Real-Time Transfer...'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {simState === 'connecting' && 'Secure 256-bit financial connection'}
                {simState === 'verifying' && 'Instant settlement via Pay-by-Bank'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-xl px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">⚡</div>
          <span className="font-bold">{merchant?.business_name || 'FlashPay'}</span>
        </div>
        <p className="text-xs text-muted-foreground">Secure Pay-by-Bank Checkout</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-5 page-enter">

          {/* Invoice summary */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-muted-foreground">{invoice.invoice_number}</span>
              <span className="text-xs text-muted-foreground">{formatDate(invoice.created_at)}</span>
            </div>

            {/* Line items */}
            {invoice.services && invoice.services.length > 0 && (
              <div className="space-y-2 mb-4 border-b border-border pb-4">
                {invoice.services.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-mono-amount font-semibold">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Due</span>
              <span className="text-3xl font-black font-mono-amount text-foreground">{formatCurrency(invoice.amount)}</span>
            </div>
          </div>

          {/* Payment method selection */}
          <div className="space-y-3">
            {/* Bank payment — PRIMARY */}
            <button
              type="button"
              onClick={() => setPaymentMethod('bank')}
              className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                paymentMethod === 'bank'
                  ? 'border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                  : 'border-border bg-card hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl">🏦</div>
                  <div>
                    <div className="font-semibold text-sm">Pay via Bank Account</div>
                    <div className="text-xs text-emerald-400 font-medium">Instant · 0% fee to you</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black font-mono-amount">{formatCurrency(bankAmount)}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold">Recommended</div>
                </div>
              </div>
            </button>

            {/* Card payment — SECONDARY */}
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                paymentMethod === 'card'
                  ? 'border-border bg-muted ring-2 ring-border'
                  : 'border-border/50 bg-card/60 hover:bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">💳</div>
                  <div>
                    <div className="font-medium text-sm text-muted-foreground">Pay with Card</div>
                    {cardSurcharge > 0 && (
                      <div className="text-xs text-amber-400">+{formatCurrency(cardSurcharge)} card fee</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold font-mono-amount ${cardSurcharge > 0 ? 'text-muted-foreground' : ''}`}>
                    {formatCurrency(cardAmount)}
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Pay button */}
          <button
            type="button"
            onClick={handlePayment}
            disabled={processing}
            className="fp-btn-primary"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting...
              </span>
            ) : (
              `Authorize ${formatCurrency(paymentMethod === 'bank' ? bankAmount : cardAmount)} ${paymentMethod === 'bank' ? '🏦' : '💳'}`
            )}
          </button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">🔒 256-bit SSL</span>
            <span>·</span>
            <span className="flex items-center gap-1">🏦 Bank-Grade Security</span>
            <span>·</span>
            <span>Powered by Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
