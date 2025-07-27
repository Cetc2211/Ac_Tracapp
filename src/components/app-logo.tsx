
import { GraduationCap } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AppLogoProps {
    name?: string;
    logoUrl?: string;
}

export function AppLogo({ name = "Academic Tracker", logoUrl }: AppLogoProps) {
  return (
    <div className="flex items-start gap-4 p-4">
      <div className="shrink-0">
        {logoUrl ? (
          <Image src={logoUrl} alt={`${name} Logo`} width={56} height={56} className="size-14 object-contain" />
        ) : (
          <GraduationCap className="size-14 text-sidebar-foreground" />
        )}
      </div>
      <div className="pt-1">
        <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">
          {name}
        </h1>
      </div>
    </div>
  );
}
