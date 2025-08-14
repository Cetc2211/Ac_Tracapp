
'use client';

import './globals.css';
import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { app } from '@/lib/firebase'; // Import to ensure firebase is initialized
import { Loader2 } from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/';
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    // The mere act of importing from firebase.ts initializes the app.
    // We use a state to ensure components don't render before this effect has run.
    setIsFirebaseReady(true);
  }, []);

  if (!isFirebaseReady) {
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
