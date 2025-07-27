
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

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/groups', icon: BookCopy, label: 'Grupos' },
  { href: '/progressions', icon: Presentation, label: 'Progresiones' },
  { href: '/statistics', icon: BarChart3, label: 'Estadísticas' },
  { href: '/reports', icon: FileText, label: 'Informes' },
  { href: '/tutors', icon: Contact, label: 'Tutores' },
];

const defaultSettings = {
    institutionName: "Academic Tracker",
    logo: ""
};


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    try {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    } catch(e) {
        console.error("Could not parse settings from localStorage", e);
    }
  }, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <AppLogo name={settings.institutionName} logoUrl={settings.logo} />
        </SidebarHeader>
        <SidebarContent>
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
          <div className="flex w-full items-center justify-end gap-4">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
