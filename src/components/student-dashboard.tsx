'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookCopy, 
  CalendarCheck, 
  FilePen, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

export default function StudentDashboard() {
  const [user] = useAuthState(auth);
  const { groups, officialGroups, activeGroup, isLoading } = useData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Cargando dashboard...</div>
      </div>
    );
  }

  // Calcular estadísticas básicas
  const totalGroups = groups?.length || 0;
  const totalStudents = officialGroups?.reduce((acc, group) => acc + (group.students?.length || 0), 0) || 0;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido a Academic Tracker, {user?.email || 'Usuario'}
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGroups}</div>
            <p className="text-xs text-muted-foreground">
              Grupos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Total de estudiantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupo Activo</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {activeGroup?.subject || 'Sin seleccionar'}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeGroup?.groupKey || 'Selecciona un grupo'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistema</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Activo</div>
            <p className="text-xs text-muted-foreground">
              Academic Tracker v2.0
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookCopy className="h-5 w-5 text-primary" />
              Mis Grupos
            </CardTitle>
            <CardDescription>
              Gestiona tus grupos y materias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/groups">Ver Grupos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilePen className="h-5 w-5 text-primary" />
              Calificaciones
            </CardTitle>
            <CardDescription>
              Registro de calificaciones parciales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/grades">Calificar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Asistencia
            </CardTitle>
            <CardDescription>
              Registro de asistencia diaria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/attendance">Registrar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Información del grupo activo */}
      {activeGroup && (
        <Card>
          <CardHeader>
            <CardTitle>Grupo Activo: {activeGroup.subject}</CardTitle>
            <CardDescription>
              {activeGroup.groupKey} - {activeGroup.students?.length || 0} estudiantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link href={`/groups/${activeGroup.id}`}>Ver Detalles</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/grades/${activeGroup.id}/grades`}>Calificaciones</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/groups/${activeGroup.id}`}>Asistencia</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guía rápida */}
      <Card>
        <CardHeader>
          <CardTitle>Guía Rápida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>1.</strong> Selecciona o crea un grupo en la sección "Grupos"</p>
          <p><strong>2.</strong> Registra calificaciones, asistencia y participaciones</p>
          <p><strong>3.</strong> Genera informes y actas de evaluación</p>
          <p><strong>4.</strong> Consulta estadísticas y reportes en tiempo real</p>
        </CardContent>
      </Card>
    </div>
  );
}
