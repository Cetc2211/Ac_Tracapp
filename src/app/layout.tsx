'use client';

import './globals.css';
import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { initializeFirebase } from '@/lib/firebase';
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
    // initializeFirebase() devuelve una promesa, asegurando que podamos esperar
    // a que la inicialización esté completa.
    initializeFirebase()
      .then(() => {
        setIsFirebaseReady(true);
      })
      .catch((error) => {
        console.error("Firebase initialization failed:", error);
        // Opcionalmente, mostrar un estado de error al usuario
      });
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
