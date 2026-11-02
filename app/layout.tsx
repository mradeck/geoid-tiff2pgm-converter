import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import './globals.css';
import { APP_NAME, APP_ORIGIN, APP_VERSION_CODE } from './lib/version';

const TITLE = `${APP_NAME} — Geoid-GeoTIFF zu PGM`;
const DESCRIPTION = 'Geoid-GeoTIFF-Modelle lokal analysieren, kartieren und als 16-Bit-PGM exportieren.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_ORIGIN),
  title: `${TITLE} · ${APP_VERSION_CODE}`,
  description: DESCRIPTION,
  applicationName: APP_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: APP_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
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
            __html: `(function(){try{var d=document.documentElement,m=localStorage.getItem('geoid-tiff2pgm-theme');if(m!=='light'&&m!=='dark')m='auto';var t=m==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;d.dataset.theme=t;d.dataset.themeMode=m;var c=document.querySelector('meta[name="theme-color"]');if(c)c.setAttribute('content',t==='dark'?'#14171c':'#f3f5f8');var l=localStorage.getItem('geoid-tiff2pgm-language');if(l!=='de'&&l!=='en')l=(navigator.language||'de').toLowerCase().indexOf('de')===0?'de':'en';d.lang=l;}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
