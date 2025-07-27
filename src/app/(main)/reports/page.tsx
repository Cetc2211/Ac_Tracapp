
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Informes</h1>
          <p className="text-muted-foreground">
            Genera informes parciales y semestrales de tus grupos.
          </p>
        </div>
      </div>
       <Card className="md:col-span-2 lg:col-span-3">
          <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
              <div className="bg-muted rounded-full p-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle>En Construcción</CardTitle>
              <CardDescription>
                Esta sección está siendo desarrollada para permitirte generar informes personalizados. ¡Vuelve pronto!
              </CardDescription>
          </CardContent>
      </Card>
    </div>
  );
}
