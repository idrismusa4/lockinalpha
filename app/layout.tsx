import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { initializeSupabaseStorage } from "./supabase";

// Initialize Supabase storage buckets
try {
  initializeSupabaseStorage();
} catch (error) {
  console.error('Failed to initialize Supabase storage:', error);
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
    <html lang="en" suppressHydrationWarning>
      <body className={lexend.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
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
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
