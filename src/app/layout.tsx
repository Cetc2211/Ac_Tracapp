'use client';

import './globals.css';
import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/';
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscriber
    const unsubscribe = auth.onAuthStateChanged(user => {
      // This callback runs when the initial auth state is determined.
      // At this point, we know Firebase is initialized and we can proceed.
      setIsAuthReady(true);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);


  if (!isAuthReady) {
    return (
        <html lang="es">
            <body>
                <div className="flex h-screen w-full items-center justify-center">
                    <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                    <span>Inicializando...</span>
                </div>
            </body>
        </html>
    );
  }

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
