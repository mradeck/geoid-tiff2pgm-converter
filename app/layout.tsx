import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'https://geoid-forge.workspace-vo-5150.chatgpt.site'),
  title: 'Geoid Forge — GeoTIFF zu PGM',
  description: 'GeoTIFF-Geoidmodelle lokal analysieren, kartieren und als 16-Bit-PGM exportieren.',
  openGraph: {
    title: 'Geoid Forge — GeoTIFF zu PGM',
    description: 'GeoTIFF-Geoidmodelle lokal analysieren, kartieren und als 16-Bit-PGM exportieren.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Geoid Forge — GeoTIFF zu PGM' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Geoid Forge — GeoTIFF zu PGM',
    description: 'GeoTIFF-Geoidmodelle lokal analysieren, kartieren und als 16-Bit-PGM exportieren.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
