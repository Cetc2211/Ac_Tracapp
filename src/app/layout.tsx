'use client';

import './globals.css';
import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/';

  return (
    <html lang="es">
      <body>
        <DataProvider>
          {isAuthPage ? children : <MainLayoutClient>{children}</MainLayoutClient>}
        </DataProvider>
      </body>
    </html>
  );
}
