
import { GraduationCap } from 'lucide-react';
import Image from 'next/image';

interface AppLogoProps {
    name?: string;
    logoUrl?: string;
}

export function AppLogo({ name = "Academic Tracker", logoUrl }: AppLogoProps) {
  // Divide el nombre en la primera línea (primeras 3 palabras) y el resto.
  const words = name.split(' ');
  const firstLine = words.slice(0, 3).join(' ');
  const restOfName = words.slice(3).join(' ');

  return (
    <div className="flex flex-col p-4">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          {logoUrl ? (
            <Image src={logoUrl} alt={`${name} Logo`} width={56} height={56} className="size-14 object-contain" />
          ) : (
            <GraduationCap className="size-14 text-sidebar-foreground" />
          )}
        </div>
        <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">
          <span>{firstLine}</span>
        </h1>
      </div>
      {restOfName && (
        <h1 className="text-lg font-bold text-sidebar-foreground leading-tight mt-1">
            <span>{restOfName}</span>
        </h1>
      )}
    </div>
  );
}
