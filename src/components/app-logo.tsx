
import { GraduationCap } from 'lucide-react';
import Image from 'next/image';

interface AppLogoProps {
    name?: string;
    logoUrl?: string;
}

export function AppLogo({ name = "Academic Tracker", logoUrl }: AppLogoProps) {
  const words = name.split(' ');
  const firstLine = words.slice(0, 3).join(' ');
  const restOfName = words.slice(3).join(' ');

  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          {logoUrl ? (
            <Image src={logoUrl} alt={`${name} Logo`} width={56} height={56} className="size-14 object-contain" />
          ) : (
            <GraduationCap className="size-14 text-sidebar-foreground" />
          )}
        </div>
        {firstLine && (
          <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">
            {firstLine}
          </h1>
        )}
      </div>
      {restOfName && (
        <h1 className="text-lg font-bold text-sidebar-foreground leading-tight mt-2">
          {restOfName}
        </h1>
      )}
    </div>
  );
}
