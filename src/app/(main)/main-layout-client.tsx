
'use client';

import {
  BookCopy,
  LayoutDashboard,
  Settings,
  Users,
  Presentation,
  Contact,
  BarChart3,
  FileText,
  CalendarCheck,
  Package,
  BookText,
  PenSquare,
  FilePen,
  ClipboardCheck,
  User
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AppLogo } from '@/components/app-logo';
import { UserNav } from '@/components/user-nav';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SheetTitle } from '@/components/ui/sheet';
import { useData } from '@/hooks/use-data';
import { getPartialLabel } from '@/lib/utils';


const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/groups', icon: BookCopy, label: 'Grupos' },
  { href: '/grades', icon: FilePen, label: 'Calificaciones' },
  { href: '/attendance', icon: CalendarCheck, label: 'Asistencia' },
  { href: '/participations', icon: PenSquare, label: 'Participaciones' },
  { href: '/activities', icon: ClipboardCheck, label: 'Actividades' },
  { href: '/observations', icon: BookText, label: 'Observaciones' },
  { href: '/reports', icon: FileText, label: 'Informes' },
  { href: '/statistics', icon: BarChart3, label: 'Estadísticas' },
  { href: '/tutors', icon: Contact, label: 'Tutores' },
];

const defaultSettings = {
    institutionName: "Academic Tracker",
    logo: "",
    theme: "theme-default"
};


export default function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { settings, activeGroup, activePartial } = useData();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    // Apply theme from settings
    if (settings.theme) {
      document.body.className = settings.theme;
    } else {
      document.body.className = defaultSettings.theme;
    }
  }, [settings.theme]);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          {isClient ? (
            <AppLogo name={settings.institutionName} logoUrl={settings.logo} />
          ) : (
            <div className="flex items-center gap-4 p-4">
              <Skeleton className="size-12 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
          )}
        </SidebarHeader>
        <SidebarContent>
           {isClient && activeGroup ? (
                <>
                  <div className="px-4 py-2">
                      <p className="text-xs font-semibold text-sidebar-foreground/70 tracking-wider uppercase">Grupo Activo</p>
                      <p className="font-bold text-sidebar-foreground flex items-center gap-2">
                        <Package className="h-4 w-4"/>
                        {activeGroup.subject}
                      </p>
                       {activePartial && (
                        <p className="text-sm text-sidebar-foreground/80 mt-1">
                          Parcial Activo: {getPartialLabel(activePartial)}
                        </p>
                       )}
                  </div>
                  <Separator className="my-2" />
                </>
            ) : isClient ? null : (
                <>
                  <div className="px-4 py-2">
                     <Skeleton className="h-3 w-20 mb-2" />
                     <Skeleton className="h-4 w-32 mb-1" />
                     <Skeleton className="h-4 w-24" />
                  </div>
                  <Separator className="my-2" />
                </>
            )
          }
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="flex-col !items-start gap-4">
          <Separator className="mx-0" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/profile')}>
                <Link href="/profile">
                  <User />
                  <span>Mi Perfil</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')}>
                <Link href="/settings">
                  <Settings />
                  <span>Ajustes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex w-full items-center justify-end gap-4">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
