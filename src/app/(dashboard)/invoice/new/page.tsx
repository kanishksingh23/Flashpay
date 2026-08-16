'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { MockStore } from '@/lib/mock-store';
import { generateInvoiceNumber, formatCurrency } from '@/lib/utils';
import type { Service } from '@/types';

// Default services for quick selection
const DEFAULT_SERVICES: Omit<Service, 'id' | 'merchant_id' | 'created_at'>[] = [
  { name: 'Full Service', price: 150, emoji: '⭐' },
  { name: 'Basic Wash', price: 75, emoji: '🚿' },
  { name: 'Interior Detail', price: 120, emoji: '🧹' },
  { name: 'Exterior Detail', price: 100, emoji: '✨' },
  { name: 'Ceramic Coat', price: 500, emoji: '💎' },
  { name: 'Custom Amount', price: 0, emoji: '✏️' },
];

export default function NewInvoicePage() {
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<{ name: string; price: number; emoji: string }[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState('');
  const [invoiceLink, setInvoiceLink] = useState('');

  const totalAmount = selectedServices.reduce((sum, s) => sum + s.price, 0) +
    (parseFloat(customAmount) || 0);

  function toggleService(service: typeof DEFAULT_SERVICES[0]) {
    if (service.name === 'Custom Amount') return;
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.name === service.name);
      if (exists) return prev.filter((s) => s.name !== service.name);
      return [...prev, service];
    });
  }

  async function handleSendInvoice() {
    if (totalAmount <= 0) return;
    if (!customerPhone) return;

    setSending(true);
    const invoiceNumber = generateInvoiceNumber();

    const lineItems = [
      ...selectedServices.map((s) => ({ name: s.name, price: s.price, quantity: 1 })),
      ...(parseFloat(customAmount) > 0
        ? [{ name: 'Custom Service', price: parseFloat(customAmount), quantity: 1 }]
        : []),
    ];

    let invId = '';

    // 1. Try Supabase
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: invoice, error } = await supabase
          .from('invoices')
          .insert({
            merchant_id: user.id,
            invoice_number: invoiceNumber,
            customer_name: customerName || null,
            customer_phone: customerPhone,
            amount: totalAmount,
            status: 'pending',
            services: lineItems,
          })
          .select()
          .single();

        if (!error && invoice) {
          invId = invoice.id;
        }
      }
    } catch {
      // fallback
    }

    // 2. Fallback / Sync with MockStore
    if (!invId) {
      const m = MockStore.getMerchant();
      const mockInvoice = MockStore.createInvoice({
        merchant_id: m.id,
        invoice_number: invoiceNumber,
        customer_name: customerName || 'Customer',
        customer_phone: customerPhone,
        amount: totalAmount,
        services: lineItems,
      });
      invId = mockInvoice.id;
    }

    const link = `${window.location.origin}/pay/${invId}`;
    setCreatedInvoiceId(invId);
    setInvoiceLink(link);
    setSent(true);
    setSending(false);

    // Open native SMS with pre-filled message
    const smsBody = encodeURIComponent(
      `Hi ${customerName || 'there'}, your invoice of ${formatCurrency(totalAmount)} is ready. Pay instantly here: ${link}`
    );
    const phone = customerPhone.replace(/\D/g, '');
    window.open(`sms:${phone}&body=${smsBody}`, '_self');
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-8 page-enter pb-24 md:pb-8">
        <div className="text-6xl mb-2 animate-bounce">🚀</div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Invoice Generated & Sent!</h2>
          <p className="text-muted-foreground text-sm">
            SMS app opened with payment link pre-filled.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold font-mono-amount text-emerald-400 text-lg">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium">{customerName || customerPhone}</span>
          </div>
          <div className="border-t border-border pt-3">
            <div className="text-xs text-muted-foreground mb-1">Customer Checkout Link</div>
            <div className="text-xs font-mono bg-muted rounded-lg px-3 py-2 break-all">{invoiceLink}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={`/pay/${createdInvoiceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fp-btn-secondary text-sm"
          >
            Test Checkout ↗
          </a>
          <button
            onClick={() => router.push(`/invoice/${createdInvoiceId}`)}
            className="fp-btn-primary text-sm"
          >
            View Invoice
          </button>
        </div>

        <button
          onClick={() => {
            setSent(false);
            setSelectedServices([]);
            setCustomAmount('');
            setCustomerPhone('');
            setCustomerName('');
            setInvoiceLink('');
          }}
          className="text-xs text-muted-foreground hover:text-foreground underline block mx-auto mt-2"
        >
          Create another invoice
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24 md:pb-8 page-enter">
      <div>
        <h1 className="text-2xl font-bold">New Invoice</h1>
        <p className="text-sm text-muted-foreground mt-0.5">5-second mobile invoicing workflow</p>
      </div>

      {/* Quick-select services */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-muted-foreground">
          Quick select catalog
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DEFAULT_SERVICES.filter((s) => s.name !== 'Custom Amount').map((service) => {
            const isSelected = selectedServices.some((s) => s.name === service.name);
            return (
              <button
                key={service.name}
                type="button"
                onClick={() => toggleService(service)}
                className={`service-btn ${isSelected ? 'selected' : ''}`}
              >
                <span className="text-2xl">{service.emoji}</span>
                <span className="text-xs font-medium text-center leading-tight">{service.name}</span>
                <span className="text-xs text-emerald-400 font-semibold font-mono-amount">{formatCurrency(service.price)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom amount */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Custom amount (optional)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
          <input
            className="fp-input pl-8"
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />
        </div>
      </div>

      {/* Total */}
      {totalAmount > 0 && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5 font-medium">Total Billed</div>
            <div className="text-3xl font-black text-emerald-400 font-mono-amount">
              {formatCurrency(totalAmount)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">ACH Processing Fee</div>
            <div className="text-sm font-semibold text-muted-foreground font-mono-amount">
              {formatCurrency(totalAmount * 0.008)}
            </div>
            <div className="text-xs text-emerald-400 font-medium">0.8% Pay-by-Bank</div>
          </div>
        </div>
      )}

      {/* Customer info */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Customer name (optional)</label>
          <input
            className="fp-input"
            type="text"
            placeholder="e.g. Sarah Miller"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Customer mobile number <span className="text-red-400">*</span>
          </label>
          <input
            className="fp-input"
            type="tel"
            placeholder="(555) 000-0000"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Opens native SMS app with payment link pre-filled
          </p>
        </div>
      </div>

      {/* Send button */}
      <button
        type="button"
        onClick={handleSendInvoice}
        disabled={totalAmount <= 0 || !customerPhone || sending}
        className="fp-btn-primary"
      >
        {sending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating Invoice...
          </span>
        ) : (
          <>⚡ Send invoice — {totalAmount > 0 ? formatCurrency(totalAmount) : '$0.00'}</>
        )}
      </button>

      {totalAmount <= 0 && (
        <p className="text-center text-xs text-muted-foreground">Select a service or enter an amount to proceed</p>
      )}
    </div>
  );
}
