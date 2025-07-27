
import { GraduationCap } from 'lucide-react';
import Image from 'next/image';

interface AppLogoProps {
    name?: string;
    logoUrl?: string;
}

export function AppLogo({ name = "Academic Tracker", logoUrl }: AppLogoProps) {
  return (
    <div className="p-4 overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="shrink-0 self-start">
          {logoUrl ? (
              <Image src={logoUrl} alt={`${name} Logo`} width={56} height={56} className="size-14 object-contain" />
          ) : (
            <GraduationCap className="size-14 text-sidebar-foreground" />
          )}
        </div>
        <h1 className="text-lg font-bold text-sidebar-foreground leading-tight pt-1">
          {name}
        </h1>
      </div>
    </div>
  );
}
