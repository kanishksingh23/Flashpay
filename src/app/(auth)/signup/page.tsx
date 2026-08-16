'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', businessName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { business_name: form.businessName },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create merchant profile
        await supabase.from('merchants').insert({
          user_id: authData.user.id,
          business_name: form.businessName,
        });

        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">⚡</div>
        <span className="font-bold text-xl tracking-tight">FlashPay</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start your 14-day free trial · No card needed</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Business name</label>
              <input
                className="fp-input"
                type="text"
                placeholder="Mike's Mobile Detailing"
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input
                className="fp-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                className="fp-input"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                minLength={8}
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="fp-btn-primary"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create free account →'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Log in
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By signing up, you agree to our{' '}
          <Link href="#" className="underline hover:text-foreground">Terms</Link>
          {' '}and{' '}
          <Link href="#" className="underline hover:text-foreground">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
