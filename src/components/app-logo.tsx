
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
    <div className="flex items-start gap-4 p-4">
      <div className="shrink-0">
        {logoUrl ? (
          <Image src={logoUrl} alt={`${name} Logo`} width={56} height={56} className="size-14 object-contain" />
        ) : (
          <GraduationCap className="size-14 text-sidebar-foreground" />
        )}
      </div>
      <div className="flex-grow">
        <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">
          <span>{firstLine}</span>
          {restOfName && <span className="block">{restOfName}</span>}
        </h1>
      </div>
    </div>
  );
}
