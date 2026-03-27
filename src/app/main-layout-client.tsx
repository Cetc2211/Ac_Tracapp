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
  ChevronRight,
  Loader2,
  LogOut,
  ClipboardSignature,
  Shield,
  Megaphone,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data';
import { getPartialLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/use-admin';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { isDemoMode } from '@/lib/firebase';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/announcements', icon: Megaphone, label: 'Sala de Anuncios' },
  { href: '/tutor', icon: GraduationCap, label: 'Tutoría' },
  { href: '/groups', icon: BookCopy, label: 'Grupos' },
  { href: '/bitacora', icon: BookText, label: 'Bitácora' },
  { href: '/grades', icon: FilePen, label: 'Calificaciones' },
  { href: '/attendance', icon: CalendarCheck, label: 'Asistencia' },
  { href: '/participations', icon: PenSquare, label: 'Participaciones' },
  { href: '/activities', icon: ClipboardCheck, label: 'Actividades' },
  { href: '/semester-evaluation', icon: Presentation, label: 'Eva. Semestral' },
  { href: '/records', icon: ClipboardSignature, label: 'Actas' },
  { href: '/reports', icon: FileText, label: 'Informes' },
  { href: '/admin/absences', icon: Users, label: 'Seguimiento' },
  { href: '/statistics', icon: BarChart3, label: 'Estadísticas' },
  { href: '/contact', icon: Contact, label: 'Contacto y Soporte' },
];

const defaultSettings = {
  institutionName: "Academic Tracker",
  logo: "",
  theme: "theme-mint",
  teacherPhoto: "",
};

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user, loading: isAuthLoading, signOut } = useAuth();
  const { isAdmin, loading: loadingAdmin } = useAdmin();
  const { officialGroups, settings, syncStatus, activeGroup, activePartialId, isLoading: isDataLoading, unreadAnnouncementsCount } = useData();
  const pathname = usePathname();
  const router = useRouter();
  const [isTutor, setIsTutor] = useState(false);

  useEffect(() => {
    if (!user || !user.email) return;
    
    // En modo demo, siempre es tutor
    if (isDemoMode) {
      setIsTutor(true);
      return;
    }

    // Admin siempre tiene acceso
    if (isAdmin) {
      setIsTutor(true);
      return;
    }

    // Verificar si es Tutor
    if (officialGroups && officialGroups.length > 0) {
      const isAssignedTutor = officialGroups.some(og => og.tutorEmail?.toLowerCase() === user.email?.toLowerCase());
      setIsTutor(isAssignedTutor);
    } else {
      setIsTutor(false);
    }
  }, [user, officialGroups, isAdmin]);

  const filteredNavItems = navItems.filter(item => {
    if (item.label === 'Seguimiento') {
      return true;
    }
    if (item.label === 'Tutoría') {
      return isTutor;
    }
    return true;
  });

  useEffect(() => {
    if (!isAuthLoading) {
      if (user) {
        if (pathname === '/login' || pathname === '/signup') {
          router.replace('/dashboard');
        }
      } else {
        if (pathname !== '/login' && pathname !== '/signup') {
          router.replace('/login');
        }
      }
    }
  }, [user, isAuthLoading, router, pathname]);

  useEffect(() => {
    const theme = settings?.theme || defaultSettings.theme;
    document.body.className = theme;
  }, [settings?.theme]);

  if (isDataLoading || isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Cargando datos...</span>
      </div>
    );
  }

  if (!user || pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    if (syncStatus === 'pending') {
      toast({
        title: "Cambios pendientes",
        description: "Hay cambios locales pendientes de sincronización. Por favor, espere a que se sincronicen antes de cerrar sesión.",
        variant: "destructive",
      });
      return;
    }
    await signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Banner de modo demo */}
      {isDemoMode && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-1 text-sm font-medium z-[60]">
          🎯 MODO DEMO - Los datos se almacenan localmente
        </div>
      )}
      
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <AppLogo name={settings.institutionName} logoUrl={settings.logo} />
            <div className="px-4 py-2 flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                syncStatus === 'synced' ? "bg-green-500" : 
                syncStatus === 'pending' ? "bg-red-500 animate-pulse" : 
                "bg-yellow-500 animate-pulse"
              )} />
              <span className="text-xs text-sidebar-foreground/70">
                {isDemoMode ? 'Demo Local' :
                 syncStatus === 'synced' ? 'Sincronizado' : 
                 syncStatus === 'pending' ? 'Pendiente' : 
                 'Sincronizando'}
              </span>
            </div>
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
            ) : null}
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link href={item.href} className="relative flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <item.icon />
                        <span>{item.label}</span>
                      </div>
                      {item.href === '/announcements' && unreadAnnouncementsCount > 0 && (
                        <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse lg:mr-2" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="flex-col !items-start gap-4">
            <div className="w-full px-4 mt-auto mb-4">
              <p className="font-dancing text-2xl text-sidebar-foreground/60 text-engraved text-center">
                By Cetc
              </p>
            </div>
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
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/admin') && !pathname.startsWith('/admin/absences')}>
                    <Link href="/admin">
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className={cn(
            "flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6",
            isDemoMode && "mt-7"
          )}>
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={settings.teacherPhoto || user.photoURL || ''} alt="Avatar" />
                    <AvatarFallback>{user.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Mi Cuenta</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {isDemoMode && (
                      <p className="text-xs text-yellow-600">Modo Demo</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
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
