// Root layout with Better Auth provider, Inter font, aurora background, error boundary.

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'FAN Tasks - A premium task workspace',
  description:
    'Glassmorphism task workspace with priorities, tags, due dates, search, filters, and lightning-fast sync.',
  keywords: [
    'todo',
    'task management',
    'productivity',
    'glassmorphism',
    'aurora',
    'priorities',
    'tags',
    'due dates',
  ],
  authors: [{ name: 'FAN Tasks' }],
  creator: 'FAN Tasks',
  publisher: 'FAN Tasks',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'FAN Tasks - A premium task workspace',
    description:
      'Glassmorphism task workspace with priorities, tags, due dates, search, filters.',
    siteName: 'FAN Tasks',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0820',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans"
        suppressHydrationWarning
      >
        {/* Animated aurora gradient background (fixed, behind everything) */}
        <div className="bg-aurora" aria-hidden="true" />
        <div className="bg-aurora-grain" aria-hidden="true" />

        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
