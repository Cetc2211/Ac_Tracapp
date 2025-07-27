
import { GraduationCap } from 'lucide-react';
import Image from 'next/image';

interface AppLogoProps {
    name?: string;
    logoUrl?: string;
}

export function AppLogo({ name = "Academic Tracker", logoUrl }: AppLogoProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
      {logoUrl ? (
          <Image src={logoUrl} alt={`${name} Logo`} width={64} height={64} className="size-16 object-contain" />
      ) : (
        <GraduationCap className="size-16 text-sidebar-foreground" />
      )}
      <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">
        {name}
      </h1>
    </div>
  );
}
