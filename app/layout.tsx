import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'WarungKu POS',
  description: 'Sistem kasir dan manajemen warung Madura modern untuk POS, stock, piutang, dan laporan.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#20231F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable}`}>
        {children}
      </body>
    </html>
  );
}
