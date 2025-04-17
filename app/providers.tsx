'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  return (
    <ClerkProvider
      appearance={{
        baseTheme: isDarkMode ? dark : undefined,
        elements: {
          footerAction: 'hidden',
          formButtonPrimary: 
            'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm normal-case',
          card: 'border-2 border-slate-200 dark:border-slate-800 shadow-lg',
        }
      }}
      localization={{
        socialButtonsBlockButton: "Continue with {{provider}}"
      }}
    >
      {children}
      <Toaster position="bottom-right" />
    </ClerkProvider>
  );
} 