'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { MockStore } from '@/lib/mock-store';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, calculateSavingsVsCard } from '@/lib/utils';
import { announcePayment, preloadVoices } from '@/lib/soundbox';
import type { Invoice, Merchant, DashboardStats } from '@/types';

export default function DashboardPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundboxActive, setSoundboxActive] = useState(false);

  const calculateAndSetStats = (invList: Invoice[]) => {
    const paid = invList.filter((i: Invoice) => i.status === 'paid');
    const pending = invList.filter((i: Invoice) => i.status === 'pending');
    const totalRevenue = paid.reduce((sum: number, i: Invoice) => sum + i.amount, 0);
    const pendingRevenue = pending.reduce((sum: number, i: Invoice) => sum + i.amount, 0);
    const savingsVsCard = calculateSavingsVsCard(totalRevenue);

    setStats({
      total_revenue: totalRevenue,
      pending_revenue: pendingRevenue,
      invoice_count: invList.length,
      paid_count: paid.length,
      savings_vs_card: savingsVsCard,
    });
  };

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const [{ data: merchantData }, { data: invoiceData }] = await Promise.all([
          supabase.from('merchants').select('*').eq('user_id', user.id).single(),
          supabase.from('invoices').select('*').eq('merchant_id', user.id).order('created_at', { ascending: false }).limit(20),
        ]);

        if (merchantData) setMerchant(merchantData);
        if (invoiceData && invoiceData.length > 0) {
          setInvoices(invoiceData);
          calculateAndSetStats(invoiceData);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fallback to local mock store
    }

    // Local / Demo Store Mode
    const m = MockStore.getMerchant();
    const invs = MockStore.getInvoices();
    setMerchant(m);
    setInvoices(invs);
    calculateAndSetStats(invs);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    preloadVoices();

    const handleStoreUpdate = () => {
      fetchData();
    };
    window.addEventListener('flashpay_store_updated', handleStoreUpdate);
    return () => window.removeEventListener('flashpay_store_updated', handleStoreUpdate);
  }, [fetchData]);

  // Real-time subscription for Supabase when connected
  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel('invoices-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'invoices' },
          (payload) => {
            const updated = payload.new as Invoice;
            if (updated.status === 'paid' && merchant?.soundbox_enabled) {
              announcePayment({
                amount: updated.amount,
                customerName: updated.customer_name,
                volume: merchant.soundbox_volume,
              });
              setSoundboxActive(true);
              setTimeout(() => setSoundboxActive(false), 3000);
              fetchData();
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    } catch {}
  }, [merchant, fetchData]);

  function testSoundbox() {
    announcePayment({
      amount: 250,
      customerName: 'Sarah Miller',
      totalToday: (stats?.total_revenue || 0) + 250,
      volume: merchant?.soundbox_volume || 80,
    });
    setSoundboxActive(true);
    setTimeout(() => setSoundboxActive(false), 3500);
  }

  function toggleSoundbox() {
    if (!merchant) return;
    const updated = MockStore.updateMerchant({ soundbox_enabled: !merchant.soundbox_enabled });
    setMerchant(updated);
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              {merchant?.business_name || 'Dashboard'}
            </h1>
            <span className="badge text-emerald-400 bg-emerald-400/10 border-emerald-400/20 text-[11px]">
              Prototype Mode
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/invoice/new"
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          + New Invoice
        </Link>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Revenue collected"
            value={formatCurrency(stats.total_revenue)}
            sub="All time"
            emoji="💰"
            highlight
          />
          <StatCard
            label="Pending"
            value={formatCurrency(stats.pending_revenue)}
            sub={`${stats.invoice_count - stats.paid_count} invoices`}
            emoji="⏳"
          />
          <StatCard
            label="Saved vs Square"
            value={formatCurrency(stats.savings_vs_card)}
            sub="At 0.8% vs 2.6%"
            emoji="🎯"
            positive
          />
          <StatCard
            label="Invoices sent"
            value={String(stats.invoice_count)}
            sub={`${stats.paid_count} paid`}
            emoji="📄"
          />
        </div>
      )}

      {/* Soundbox panel */}
      <div
        className={`rounded-2xl border p-5 flex items-center justify-between transition-all duration-500 ${
          soundboxActive
            ? 'border-emerald-500/50 bg-emerald-500/10'
            : 'border-border bg-card'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${
              soundboxActive ? 'soundbox-pulse bg-emerald-500/20' : 'bg-muted'
            }`}
          >
            🔊
          </div>
          <div>
            <div className="font-semibold flex items-center gap-2">
              {soundboxActive ? 'Payment Announcement Active! 📢' : 'Voice Soundbox Active'}
              {merchant?.soundbox_enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {soundboxActive
                ? 'Speaking customer name & amount out loud...'
                : 'Audible hands-free payment confirmation for mobile trades'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={testSoundbox}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Test Soundbox 🔊
          </button>
          <div
            onClick={toggleSoundbox}
            className={`w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
              merchant?.soundbox_enabled ? 'bg-emerald-500' : 'bg-muted border border-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white mt-0.5 shadow transition-transform duration-200 ${
                merchant?.soundbox_enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Invoice list */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Recent invoices</h2>
          <span className="text-sm text-muted-foreground">{invoices.length} total</span>
        </div>

        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📄</div>
            <p className="font-medium mb-1">No invoices yet</p>
            <p className="text-sm text-muted-foreground mb-4">Send your first invoice in under 5 seconds</p>
            <Link
              href="/invoice/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 transition-colors"
            >
              ⚡ Create invoice
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoice/${invoice.id}`}
                className="invoice-row flex items-center justify-between px-6 py-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate">
                      {invoice.customer_name || invoice.customer_phone || 'Customer'}
                    </span>
                    <span className={`badge ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {invoice.invoice_number} · {formatDate(invoice.created_at)}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold font-mono-amount">
                    {formatCurrency(invoice.amount)}
                  </div>
                  {invoice.payment_method && (
                    <div className="text-xs text-emerald-400 capitalize">
                      via {invoice.payment_method} transfer
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  emoji,
  highlight,
  positive,
}: {
  label: string;
  value: string;
  sub: string;
  emoji: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      className={`stat-card rounded-2xl border p-4 ${
        highlight ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-card'
      }`}
    >
      <div className="text-xl mb-2">{emoji}</div>
      <div className={`text-xl md:text-2xl font-black font-mono-amount ${positive ? 'text-emerald-400' : ''}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      <div className="text-xs text-muted-foreground/60 mt-0.5">{sub}</div>
    </div>
  );
}
