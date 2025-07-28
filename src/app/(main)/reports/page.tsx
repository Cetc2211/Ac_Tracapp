
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, ArrowRight } from 'lucide-react';
import { Group } from '@/lib/placeholder-data';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReportsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedGroups = localStorage.getItem('groups');
      if (storedGroups) {
        setGroups(JSON.parse(storedGroups));
      }
    } catch (error) {
      console.error("Failed to parse groups from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return <div>Cargando grupos...</div>
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Generar Informes</h1>
          <p className="text-muted-foreground">
            Selecciona un grupo para generar un informe parcial o semestral.
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map(group => (
          <Card key={group.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{group.subject}</CardTitle>
              <CardDescription className="flex items-center gap-2 pt-2">
                <Users className="h-4 w-4" />
                <span>{group.students.length} estudiantes</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                Genera un informe detallado con calificaciones, asistencias y observaciones para este grupo.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="#">
                  Generar Informe <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

       {groups.length === 0 && !isLoading && (
        <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                <div className="bg-muted rounded-full p-4">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle>No hay grupos para generar informes</CardTitle>
                <CardDescription>
                  Crea un grupo y añade estudiantes para poder generar un informe.
                </CardDescription>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
