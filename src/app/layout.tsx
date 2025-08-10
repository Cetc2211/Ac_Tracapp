import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
        <body>
            <DataProvider>
                <MainLayoutClient>{children}</MainLayoutClient>
            </DataProvider>
        </body>
    </html>
  );
}
