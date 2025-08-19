'use client';

import './globals.css';
import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/hooks/use-auth.tsx';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/' || pathname === '/signup';

  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {isAuthPage ? (
            <>{children}</>
          ) : (
            <DataProvider>
              <MainLayoutClient>{children}</MainLayoutClient>
            </DataProvider>
          )}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
