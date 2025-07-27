
import { GraduationCap } from 'lucide-react';
import Image from 'next/image';

interface AppLogoProps {
    name?: string;
    logoUrl?: string;
}

export function AppLogo({ name = "Academic Tracker", logoUrl }: AppLogoProps) {
  return (
    <div className="flex items-center gap-4 p-4">
      {logoUrl ? (
          <Image src={logoUrl} alt={`${name} Logo`} width={48} height={48} className="size-12 object-contain shrink-0" />
      ) : (
        <GraduationCap className="size-12 text-sidebar-foreground shrink-0" />
      )}
      <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">
        {name}
      </h1>
    </div>
  );
}
