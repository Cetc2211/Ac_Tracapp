
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <DataProvider>
          <MainLayoutClient>{children}</MainLayoutClient>
        </DataProvider>
      </body>
    </html>
  );
}
