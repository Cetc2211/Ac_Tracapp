
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
  User as UserIcon,
  ChevronRight,
  Loader2
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
import { Separator } from '@/components/ui/separator';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data';
import { getPartialLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/groups', icon: BookCopy, label: 'Grupos' },
  { href: '/bitacora', icon: BookText, label: 'Bitácora' },
  { href: '/grades', icon: FilePen, label: 'Calificaciones' },
  { href: '/attendance', icon: CalendarCheck, label: 'Asistencia' },
  { href: '/participations', icon: PenSquare, label: 'Participaciones' },
  { href: '/activities', icon: ClipboardCheck, label: 'Actividades' },
  { href: '/semester-evaluation', icon: Presentation, label: 'Eva. Semestral' },
  { href: '/reports', icon: FileText, label: 'Informes' },
  { href: '/statistics', icon: BarChart3, label: 'Estadísticas' },
  { href: '/contact', icon: Contact, label: 'Contacto y Soporte' },
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
  const { settings, activeGroup, activePartialId, isLoading: isDataLoading } = useData();
  
  useEffect(() => {
    const theme = settings?.theme || defaultSettings.theme;
    document.body.className = theme;
  }, [settings?.theme]);
  
  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <AppLogo name={settings.institutionName} logoUrl={settings.logo} />
          </SidebarHeader>
          <SidebarContent>
            {activeGroup ? (
                  <>
                    <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-sidebar-foreground/70 tracking-wider uppercase">Grupo Activo</p>
                         <Button asChild variant="ghost" className={cn("h-auto w-full justify-start p-2 mt-1 text-wrap text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                          <Link href={`/groups/${activeGroup.id}`}>
                            <div className='space-y-1 w-full'>
                              <p className="font-bold flex items-center gap-2">
                                <Package className="h-4 w-4"/>
                                {activeGroup.subject}
                              </p>
                              <p className="font-semibold flex items-center gap-2 text-sm pl-1">
                                <BookText className="h-4 w-4"/>
                                {getPartialLabel(activePartialId)}
                                <ChevronRight className="h-4 w-4 ml-auto"/>
                              </p>
                            </div>
                          </Link>
                        </Button>
                    </div>
                    <Separator className="my-2" />
                  </>
              ) : isDataLoading ? (
                  <>
                    <div className="px-4 py-2">
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Separator className="my-2" />
                  </>
              ) : null
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
                    <UserIcon />
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
          <main className="flex-1 p-4 sm:p-6">{isDataLoading ? (
             <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
             </div>
          ) : children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
