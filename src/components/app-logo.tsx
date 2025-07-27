
import { GraduationCap } from 'lucide-react';
import Image from 'next/image';

interface AppLogoProps {
    name?: string;
    logoUrl?: string;
}

export function AppLogo({ name = "Academic Tracker", logoUrl }: AppLogoProps) {
  return (
    <div className="flex items-center gap-2 p-2">
      {logoUrl ? (
          <Image src={logoUrl} alt={`${name} Logo`} width={32} height={32} className="size-8 object-contain" />
      ) : (
        <GraduationCap className="size-8 text-sidebar-foreground" />
      )}
      <h1 className="text-lg font-bold text-sidebar-foreground truncate">
        {name}
      </h1>
    </div>
  );
}
