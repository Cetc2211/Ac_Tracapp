import { DataProvider } from '@/hooks/use-data';
import MainLayoutClient from './main-layout-client';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <MainLayoutClient>{children}</MainLayoutClient>
    </DataProvider>
  );
}
