import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
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
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
