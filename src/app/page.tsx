import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FlashPay — Get Paid Instantly. Keep More Money.',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
            ⚡
          </div>
          <span className="font-bold text-lg tracking-tight">FlashPay</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/20"
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center page-enter">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Now in beta · US market · Stripe-powered
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Stop paying
            <br />
            <span className="gradient-text">Square's fees.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Send invoices in 5 seconds. Get paid via instant bank transfer at{' '}
            <strong className="text-foreground">0.8%</strong> instead of 2.6%.
            Hear your phone announce every payment out loud — hands-free.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg transition-all duration-200 shadow-2xl shadow-emerald-500/30 active:scale-95"
            >
              Start free — no card needed
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-4 rounded-2xl border border-border hover:bg-muted text-foreground font-semibold text-lg transition-all duration-200"
            >
              See how it works →
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-6 text-sm text-muted-foreground">
            Free plan includes 10 invoices/month · No setup fees · Cancel anytime
          </p>
        </div>
      </section>

      {/* Fee comparison visual */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
            <h2 className="text-2xl font-bold text-center mb-10">
              The math is simple
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Square */}
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">■</div>
                  <span className="font-semibold text-muted-foreground">Square (card)</span>
                </div>
                <div className="text-4xl font-black text-red-400 mb-1">2.6%</div>
                <div className="text-sm text-muted-foreground mb-4">per card transaction</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>On $8,000/month:</span>
                    <span className="text-red-400 font-semibold">−$208</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Annual loss:</span>
                    <span className="text-red-400 font-semibold">−$2,496</span>
                  </div>
                </div>
              </div>

              {/* FlashPay */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">⚡</div>
                  <span className="font-semibold">FlashPay (bank)</span>
                </div>
                <div className="text-4xl font-black text-emerald-400 mb-1">0.8%</div>
                <div className="text-sm text-muted-foreground mb-4">per bank transfer</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">On $8,000/month:</span>
                    <span className="text-emerald-400 font-semibold">−$64</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plus $29/mo plan:</span>
                    <span className="text-emerald-400 font-semibold">−$29</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings */}
            <div className="mt-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center">
              <div className="text-sm text-muted-foreground mb-1">Monthly savings with FlashPay</div>
              <div className="text-5xl font-black text-emerald-400">$115</div>
              <div className="text-muted-foreground text-sm mt-1">= $1,380/year you keep</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Built for people who work with their hands</h2>
          <p className="text-muted-foreground text-center mb-12">Not for accountants. Not for SaaS teams. For mobile service professionals.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                emoji: '⚡',
                title: '5-Second Invoices',
                desc: 'Tap a saved service, enter a phone number, hit send. Customer gets an SMS payment link instantly.',
              },
              {
                emoji: '🏦',
                title: 'Pay-by-Bank at 0.8%',
                desc: 'Customers pay directly from their bank account. You receive the money same day or next day.',
              },
              {
                emoji: '🔊',
                title: 'Voice Soundbox',
                desc: 'Your phone says "Received $200 from Mike" out loud. Work with your hands, not your screen.',
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="text-3xl mb-4">{f.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Simple pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Free',
                price: '$0',
                period: '/month',
                desc: 'Try it out',
                features: ['10 invoices/month', 'Pay-by-Bank checkout', 'Soundbox (push notification)', '1 saved service'],
                cta: 'Start free',
                href: '/signup',
                highlighted: false,
              },
              {
                name: 'Solo',
                price: '$29',
                period: '/month',
                desc: 'For active solopreneurs',
                features: ['Unlimited invoices', 'Direct SMS sending', 'PDF receipts auto-sent', 'Auto payment reminders', 'Fee savings counter', 'Custom business branding', 'Client contact book'],
                cta: 'Start 14-day trial',
                href: '/signup?plan=solo',
                highlighted: true,
              },
              {
                name: 'Pro',
                price: '$59',
                period: '/month',
                desc: 'For growing teams',
                features: ['Everything in Solo', '5 team seats', 'Recurring billing', 'QuickBooks sync', 'Advanced analytics', 'White-label checkout', 'Priority support'],
                cta: 'Start 14-day trial',
                href: '/signup?plan=pro',
                highlighted: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  plan.highlighted
                    ? 'border-emerald-500/50 bg-emerald-500/5 relative'
                    : 'border-border bg-card'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{plan.desc}</div>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-400 text-base">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                      : 'border border-border hover:bg-muted text-foreground'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">⚡</div>
          <span className="font-semibold text-foreground">FlashPay US</span>
        </div>
        <p>Powered by Stripe · Bank-grade security · FDIC-insured transfers</p>
        <div className="flex justify-center gap-6 mt-4">
          <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Support</Link>
        </div>
      </footer>
    </main>
  );
}
