
import { GraduationCap } from 'lucide-react';
import Image from 'next/image';

interface AppLogoProps {
    name?: string;
    logoUrl?: string;
}

export function AppLogo({ name = "Academic Tracker", logoUrl }: AppLogoProps) {
  return (
    <div className="p-4 overflow-hidden">
      <div className="flex items-center gap-4">
        {logoUrl ? (
            <Image src={logoUrl} alt={`${name} Logo`} width={56} height={56} className="size-14 object-contain float-left" />
        ) : (
          <GraduationCap className="size-14 text-sidebar-foreground float-left" />
        )}
        <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">
          {name}
        </h1>
      </div>
    </div>
  );
}
