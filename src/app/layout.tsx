import './globals.css';
import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Academic Tracker Pro',
  description: 'Una aplicación para el seguimiento académico de estudiantes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
      </head>
      <body className="bg-background">
            <DataProvider>
              <MainLayoutClient>{children}</MainLayoutClient>
            </DataProvider>
          <Toaster />
      </body>
    </html>
  );
}
