import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Navigation } from '@/components/ui/navigation';

export const metadata: Metadata = {
  title: 'UCL Living Universe',
  description: 'Persistent multi-season UEFA Champions League simulator',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 xl:px-10 xl:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
