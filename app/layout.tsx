import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { APP_VERSION_CODE } from './lib/version';

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
  title: `Geoid Forge — GeoTIFF zu PGM · ${APP_VERSION_CODE}`,
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
        <meta name="theme-color" content="#f3f5f8" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement,m=localStorage.getItem('geoid-forge-theme');if(m!=='light'&&m!=='dark')m='auto';var t=m==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;d.dataset.theme=t;d.dataset.themeMode=m;var c=document.querySelector('meta[name="theme-color"]');if(c)c.setAttribute('content',t==='dark'?'#14171c':'#f3f5f8');var l=localStorage.getItem('geoid-forge-language');if(l!=='de'&&l!=='en')l=(navigator.language||'de').toLowerCase().indexOf('de')===0?'de':'en';d.lang=l;}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
