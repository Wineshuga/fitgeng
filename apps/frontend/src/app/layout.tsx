import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { brand, theme, themeCss } from '@/config/brand';
import { env } from '@/config/env';
import { themeInitScript } from '@/contexts/themeScript';
import { Providers } from './providers';
import '@/styles/globals.css';

// Self-hosted at build time: no third-party font request, no layout shift.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: `${brand.name} | ${brand.tagline}`, template: `%s | ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
};

export const viewport: Viewport = {
  themeColor: theme.palette.brand,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: themeInitScript adds the `dark` class before React hydrates.
    <html lang="en-NG" className={inter.variable} suppressHydrationWarning>
      <head>
        <style id="fg-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
