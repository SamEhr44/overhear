import { SerwistProvider } from '@serwist/next/react';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { Telemetry } from '@/components/Telemetry';
import { SosRibbon } from '@/components/ui/SosRibbon';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'Overhear',
  description:
    'A travel communication cockpit — live English captions of the Spanish around you, two-way conversation, and driver comms.',
  applicationName: 'Overhear',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Overhear',
  },
};

export const viewport: Viewport = {
  themeColor: '#f4f6f8',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="bg-canvas font-sans text-ink">
        <SerwistProvider swUrl="/sw.js">
          <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            {children}
            <SosRibbon />
          </div>
        </SerwistProvider>
        <Telemetry />
      </body>
    </html>
  );
}
