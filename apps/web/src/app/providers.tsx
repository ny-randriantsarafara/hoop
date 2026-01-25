'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider, Toaster } from '@/shared/ui/toast';

export function Providers({ children }: { readonly children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <Toaster />
      </ToastProvider>
    </SessionProvider>
  );
}
