'use client';

import './globals.css';
import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/static/manifest.json" />
        <link rel="apple-touch-icon" href="/static/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/static/icons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/static/favicon.ico" />
      </head>
      <body>
            <DataProvider>
              <MainLayoutClient>{children}</MainLayoutClient>
            </DataProvider>
          <Toaster />
      </body>
    </html>
  );
}
