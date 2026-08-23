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
  metadataBase: new URL(process.env.URL ?? process.env.SITE_URL ?? 'https://geoid-forge.netlify.app'),
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
    <html lang="de" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f4f3ed" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('geoid-forge-theme');if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var l=localStorage.getItem('geoid-forge-language');if(l!=='de'&&l!=='en')l=(navigator.language||'de').toLowerCase().indexOf('de')===0?'de':'en';document.documentElement.dataset.theme=t;document.documentElement.lang=l;}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
