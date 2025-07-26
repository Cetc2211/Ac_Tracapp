import { GraduationCap } from 'lucide-react';

export function AppLogo() {
  return (
    <div className="flex items-center gap-2 p-2">
      <GraduationCap className="size-8 text-sidebar-foreground" />
      <h1 className="text-lg font-bold text-sidebar-foreground">
        Academic Tracker
      </h1>
    </div>
  );
}
