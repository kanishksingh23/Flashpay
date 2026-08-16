import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'FlashPay — Get Paid Instantly. Keep More Money.',
    template: '%s | FlashPay',
  },
  description:
    'The payment app built for mobile service pros. Send invoices in 5 seconds, get paid by bank transfer at 0.8%, and hear your soundbox chime when money arrives.',
  keywords: [
    'payment app for service businesses',
    'mobile invoicing',
    'ACH payment',
    'square alternative',
    'soundbox payment',
    'mobile detailing payment',
    'landscaping invoice app',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FlashPay',
  },
  openGraph: {
    title: 'FlashPay — Get Paid Instantly. Keep More Money.',
    description: 'The payment + soundbox app for US service pros.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#060d1a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background">{children}</body>
    </html>
  );
}
