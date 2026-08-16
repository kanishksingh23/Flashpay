'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
  { href: '/invoice/new', label: 'New Invoice', emoji: '⚡' },
  { href: '/settings', label: 'Settings', emoji: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 p-4 fixed top-0 left-0 h-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">⚡</div>
          <span className="font-bold text-lg tracking-tight">FlashPay</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'nav-item',
                (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) && 'active'
              )}
            >
              <span className="text-base">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="nav-item text-left w-full"
        >
          <span className="text-base">🚪</span>
          <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {/* Mobile top nav */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">⚡</div>
            <span className="font-bold tracking-tight">FlashPay</span>
          </div>
          <Link href="/invoice/new" className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold">
            + Invoice
          </Link>
        </div>

        {/* Page content */}
        <div className="p-4 md:p-8 page-enter">
          {children}
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-xl">
          <div className="flex items-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors',
                  pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    ? 'text-emerald-400'
                    : 'text-muted-foreground'
                )}
              >
                <span className="text-lg">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
