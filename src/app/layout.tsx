'use client';

import './globals.css';
import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/' || pathname === '/login';

  return (
    <html lang="es">
      <body>
        <DataProvider>
          {isAuthPage ? children : <MainLayoutClient>{children}</MainLayoutClient>}
          <Toaster />
        </DataProvider>
      </body>
    </html>
  );
}
