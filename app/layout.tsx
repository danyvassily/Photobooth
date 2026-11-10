import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Photobooth V3 — Photomaton HD & AR',
  description: 'Photobooth web PWA haute performance avec 12 thèmes, traitement Rust/WASM et accessoires AR locaux.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Photobooth',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#190E11',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased selection:bg-brass selection:text-ink">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(err => {
                    console.log('ServiceWorker registration error:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
