
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
  Loader2,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

import { AppLogo } from '@/components/app-logo';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';

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
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { settings, activeGroup, activePartialId, isLoading: isDataLoading, error: dataError } = useData();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    const theme = settings?.theme || defaultSettings.theme;
    document.body.className = theme;
  }, [settings?.theme]);
  
  if (authLoading || isDataLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Cargando datos...</span>
        </div>
    );
  }

  if (dataError) {
      return (
        <div className="flex h-screen w-full items-center justify-center text-center">
          <div className="p-4 rounded-md border bg-card text-card-foreground max-w-md">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4"/>
            <h2 className="text-xl font-bold">Error de Conexión</h2>
            <p className="text-muted-foreground mt-2">
              No se pudo conectar a la base de datos. Por favor, revisa tu conexión a internet y vuelve a intentarlo.
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">Recargar Página</Button>
          </div>
        </div>
      )
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <AppLogo name={settings.institutionName} logoUrl={settings.logo} />
          </SidebarHeader>
          <SidebarContent>
            {activeGroup && user ? (
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
            <div className='flex-1' />
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Image
                    src={user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.charAt(0)}`}
                    alt="Avatar del usuario"
                    className="rounded-full"
                    fill
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'Usuario'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
