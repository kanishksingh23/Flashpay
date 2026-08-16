'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { MockStore } from '@/lib/mock-store';
import { formatCurrency, formatDate, formatPhone, getStatusColor, getStatusLabel, calculateSavingsVsCard } from '@/lib/utils';
import { announcePayment } from '@/lib/soundbox';
import type { Invoice, Merchant } from '@/types';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      // 1. Try Supabase
      try {
        const supabase = createClient();
        const { data: invData } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();

        if (invData) {
          setInvoice(invData);
          const { data: mData } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', invData.merchant_id)
            .single();
          if (mData) setMerchant(mData);
          setLoading(false);
          return;
        }
      } catch {
        // fallback to MockStore
      }

      // 2. Fallback to MockStore
      const mockInv = MockStore.getInvoice(invoiceId);
      const mockM = MockStore.getMerchant();
      if (mockInv) setInvoice(mockInv);
      if (mockM) setMerchant(mockM);
      setLoading(false);
    }

    loadData();
  }, [invoiceId]);

  function handleCopyLink() {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/pay/${invoice?.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleResendSMS() {
    if (!invoice) return;
    const link = `${window.location.origin}/pay/${invoice.id}`;
    const smsBody = encodeURIComponent(
      `Hi ${invoice.customer_name || 'there'}, your invoice of ${formatCurrency(invoice.amount)} from ${merchant?.business_name || 'us'} is ready: ${link}`
    );
    const phone = (invoice.customer_phone || '').replace(/\D/g, '');
    window.open(`sms:${phone}&body=${smsBody}`, '_self');
  }

  function handleMarkPaid() {
    if (!invoice) return;
    MockStore.markInvoicePaid(invoice.id, 'bank');
    setInvoice((prev) => prev ? { ...prev, status: 'paid', payment_method: 'bank', paid_at: new Date().toISOString() } : null);

    if (merchant?.soundbox_enabled) {
      announcePayment({
        amount: invoice.amount,
        customerName: invoice.customer_name,
        volume: merchant.soundbox_volume,
      });
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-4 animate-pulse py-8">
        <div className="h-8 w-40 skeleton" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="text-5xl">📄</div>
        <h1 className="text-xl font-bold">Invoice not found</h1>
        <p className="text-muted-foreground text-sm">This invoice could not be located.</p>
        <Link href="/dashboard" className="fp-btn-secondary inline-flex">Back to dashboard</Link>
      </div>
    );
  }

  const payUrl = typeof window !== 'undefined' ? `${window.location.origin}/pay/${invoice.id}` : `/pay/${invoice.id}`;
  const savings = calculateSavingsVsCard(invoice.amount);

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 md:pb-8 page-enter">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono-amount">{invoice.invoice_number}</h1>
              <span className={`badge ${getStatusColor(invoice.status)}`}>
                {getStatusLabel(invoice.status)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Created {formatDate(invoice.created_at)}</p>
          </div>
        </div>

        {invoice.status === 'pending' && (
          <button
            onClick={handleMarkPaid}
            className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20"
          >
            Simulate payment ✓
          </button>
        )}
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        {/* Amount */}
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Invoice Amount</div>
            <div className="text-4xl font-black font-mono-amount text-foreground">
              {formatCurrency(invoice.amount)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">Estimated Savings</div>
            <div className="text-lg font-bold font-mono-amount text-emerald-400">
              +{formatCurrency(savings)}
            </div>
            <div className="text-[11px] text-muted-foreground">vs 2.6% Square fee</div>
          </div>
        </div>

        {/* Customer details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Customer</div>
            <div className="font-semibold">{invoice.customer_name || 'Not provided'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Phone</div>
            <div className="font-semibold">{invoice.customer_phone ? formatPhone(invoice.customer_phone) : '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Payment Method</div>
            <div className="font-semibold capitalize">{invoice.payment_method ? `via ${invoice.payment_method} transfer` : 'Pending checkout'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Payment Date</div>
            <div className="font-semibold">{invoice.paid_at ? formatDate(invoice.paid_at) : '—'}</div>
          </div>
        </div>

        {/* Line Items */}
        {invoice.services && invoice.services.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Services Billed</div>
            <div className="divide-y divide-border/60 rounded-xl bg-muted/40 p-3">
              {invoice.services.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
                  <span className="text-foreground">{s.name}</span>
                  <span className="font-semibold font-mono-amount">{formatCurrency(s.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share & Payment Link Box */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Payment Link</h2>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={payUrl}
            className="fp-input text-xs font-mono select-all"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 text-sm font-semibold border border-border whitespace-nowrap transition-colors"
          >
            {copied ? 'Copied! ✓' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <a
            href={`/pay/${invoice.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fp-btn-secondary text-sm"
          >
            Open checkout ↗
          </a>
          <button
            onClick={handleResendSMS}
            className="fp-btn-primary text-sm"
          >
            Resend SMS 📱
          </button>
        </div>
      </div>
    </div>
  );
}
