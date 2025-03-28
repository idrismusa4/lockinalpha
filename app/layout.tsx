import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Providers } from "./providers";
import { initializeSupabaseStorage } from "./supabase";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/next';

// Ensure Supabase storage is initialized on the server side
if (typeof window === 'undefined') {
  try {
    console.log('Server-side initialization of Supabase storage buckets...');
    // Use this pattern to ensure the promise is handled
    initializeSupabaseStorage().then(() => {
      console.log('Supabase storage buckets initialized successfully');
    }).catch((error) => {
      console.error('Failed to initialize Supabase storage buckets:', error);
    });
  } catch (error) {
    console.error('Error during Supabase storage initialization:', error);
  }
}

const lexend = Lexend({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LockIn Auto Video Lecture",
  description: "Transform your study materials into engaging video lectures with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={lexend.className}>
        <Providers>
          <Analytics />
          <SpeedInsights />
          <div className="flex min-h-screen flex-col">
            <header className="border-b">
              <div className="container flex h-16 items-center justify-between py-4">
                <div className="flex items-center gap-6">
                  <Link href="/" className="font-bold text-2xl">
                    LockIn
                  </Link>
                  <nav className="hidden md:flex gap-6">
                    <Link href="/" className="text-sm font-medium hover:underline">
                      Home
                    </Link>
                    <Link href="/video" className="text-sm font-medium hover:underline">
                      Create Videos
                    </Link>
                    <Link href="/upload" className="text-sm font-medium hover:underline">
                      Upload Files
                    </Link>
                  </nav>
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6">
              <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} LockIn. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
