'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { MockStore } from '@/lib/mock-store';
import { announcePayment } from '@/lib/soundbox';
import type { Merchant } from '@/types';

export default function SettingsPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('merchants').select('*').eq('user_id', user.id).single();
          if (data) {
            setMerchant(data);
            return;
          }
        }
      } catch {}

      setMerchant(MockStore.getMerchant());
    }
    load();
  }, []);

  async function handleSave() {
    if (!merchant) return;
    setSaving(true);

    try {
      const supabase = createClient();
      await supabase.from('merchants').update({
        business_name: merchant.business_name,
        soundbox_enabled: merchant.soundbox_enabled,
        soundbox_volume: merchant.soundbox_volume,
        surcharge_enabled: merchant.surcharge_enabled,
      }).eq('id', merchant.id);
    } catch {}

    MockStore.updateMerchant({
      business_name: merchant.business_name,
      soundbox_enabled: merchant.soundbox_enabled,
      soundbox_volume: merchant.soundbox_volume,
      surcharge_enabled: merchant.surcharge_enabled,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function testSoundbox() {
    announcePayment({
      amount: 250,
      customerName: 'Sarah Miller',
      totalToday: 850,
      volume: merchant?.soundbox_volume || 80,
    });
  }

  if (!merchant) {
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-pulse py-8">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24 md:pb-8 page-enter">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Customize your Soundbox, payments, and branding</p>
      </div>

      {/* Business info */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-base">Business Profile</h2>
        <div>
          <label className="block text-sm font-medium mb-1.5">Trade / Business Name</label>
          <input
            className="fp-input"
            value={merchant.business_name}
            onChange={(e) => setMerchant((m) => m ? { ...m, business_name: e.target.value } : m)}
          />
        </div>
      </section>

      {/* Soundbox settings */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              🔊 Voice Soundbox
              <span className="badge text-emerald-400 bg-emerald-400/10 border-emerald-400/20 text-[10px]">Active</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Speaks amount and customer name when paid</p>
          </div>
          <button
            type="button"
            onClick={() => setMerchant((m) => m ? { ...m, soundbox_enabled: !m.soundbox_enabled } : m)}
            className={`w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${merchant.soundbox_enabled ? 'bg-emerald-500' : 'bg-muted border border-border'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white mt-0.5 shadow transition-transform duration-200 ${merchant.soundbox_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {merchant.soundbox_enabled && (
          <div className="space-y-4 pt-2 border-t border-border">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Announcement Volume</label>
                <span className="text-sm font-mono text-muted-foreground">{merchant.soundbox_volume}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={merchant.soundbox_volume}
                onChange={(e) => setMerchant((m) => m ? { ...m, soundbox_volume: parseInt(e.target.value) } : m)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
            <button type="button" onClick={testSoundbox} className="fp-btn-secondary text-sm">
              🔊 Test Soundbox Announcement
            </button>
          </div>
        )}
      </section>

      {/* Payment settings */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-base">💳 Card Surcharge</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pass 3% credit card fee to customer to incentivize 0% bank payments
          </p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <div className="text-sm font-medium">Enable 3% Surcharge on Cards</div>
            <div className="text-xs text-muted-foreground">Auto-disabled for debit cards & CT/MA by law</div>
          </div>
          <button
            type="button"
            onClick={() => setMerchant((m) => m ? { ...m, surcharge_enabled: !m.surcharge_enabled } : m)}
            className={`w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${merchant.surcharge_enabled ? 'bg-emerald-500' : 'bg-muted border border-border'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white mt-0.5 shadow transition-transform duration-200 ${merchant.surcharge_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </section>

      {/* Plan */}
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Plan</div>
            <div className="text-2xl font-black text-emerald-400 capitalize mt-0.5">{merchant.plan} ($29/mo)</div>
            <div className="text-xs text-muted-foreground mt-1">Unlimited invoices · 0.8% ACH Pay-by-Bank</div>
          </div>
          <button
            type="button"
            onClick={() => alert('You are currently on the Solo Plan preview.')}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-400 transition-colors"
          >
            Manage Plan
          </button>
        </div>
      </section>

      {/* Save */}
      <button type="button" onClick={handleSave} disabled={saving} className="fp-btn-primary">
        {saved ? '✅ Saved Successfully!' : saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
