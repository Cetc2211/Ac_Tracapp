
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function StatisticsPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground">
            Analiza el rendimiento de tus grupos y estudiantes.
          </p>
        </div>
      </div>
       <Card className="md:col-span-2 lg:col-span-3">
          <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
              <div className="bg-muted rounded-full p-4">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle>En Construcción</CardTitle>
              <CardDescription>
                Esta sección está siendo desarrollada para ofrecerte análisis detallados. ¡Vuelve pronto!
              </CardDescription>
          </CardContent>
      </Card>
    </div>
  );
}
