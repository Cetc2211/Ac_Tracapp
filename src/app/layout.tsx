
'use client';

import './globals.css';
import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/hooks/use-auth.tsx';

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/' || pathname === '/signup';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <DataProvider>
      <MainLayoutClient>{children}</MainLayoutClient>
    </DataProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
            <AppContent>{children}</AppContent>
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
