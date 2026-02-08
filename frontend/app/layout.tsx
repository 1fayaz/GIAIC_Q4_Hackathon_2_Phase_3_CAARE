// Root layout with Better Auth provider and global error boundary
// Implements T022, T098, T104 from tasks.md

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// T104: Add proper meta tags for SEO
export const metadata: Metadata = {
  title: "Todo App - Manage Your Tasks Efficiently",
  description: "A modern, full-stack todo application with authentication, persistent storage, and real-time updates. Organize your tasks and boost productivity.",
  keywords: ["todo", "task management", "productivity", "task list", "todo app", "task organizer"],
  authors: [{ name: "Todo App Team" }],
  creator: "Todo App",
  publisher: "Todo App",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://todoapp.example.com",
    title: "Todo App - Manage Your Tasks Efficiently",
    description: "A modern, full-stack todo application with authentication and persistent storage.",
    siteName: "Todo App",
  },
  twitter: {
    card: "summary_large_image",
    title: "Todo App - Manage Your Tasks Efficiently",
    description: "A modern, full-stack todo application with authentication and persistent storage.",
  },
};

// T104: Viewport configuration (Next.js 16+ requires separate export)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {/* T098: Global error boundary */}
        <ErrorBoundary>
          {/* T022: Better Auth provider */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
