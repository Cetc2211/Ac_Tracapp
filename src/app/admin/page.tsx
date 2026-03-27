'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  GraduationCap, 
  Megaphone, 
  FileCheck, 
  Settings,
  Bug,
  Database,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestión de grupos oficiales, anuncios y configuración del sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Grupos Oficiales */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Grupos Oficiales
            </CardTitle>
            <CardDescription>
              Crear y gestionar grupos institucionales, asignar tutores y agregar estudiantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/official-groups">
                Gestionar Grupos
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Sala de Anuncios */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Anuncios
            </CardTitle>
            <CardDescription>
              Publicar comunicados institucionales visibles para todos los usuarios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/official-groups">
                Publicar Anuncio
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Justificaciones */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Justificaciones
            </CardTitle>
            <CardDescription>
              Registrar justificaciones de inasistencia para estudiantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/official-groups">
                Registrar Justificación
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Seguimiento de Inasistencias */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Seguimiento
            </CardTitle>
            <CardDescription>
              Monitoreo de inasistencias y estudiantes en riesgo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/absences">
                Ver Seguimiento
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Consola de Diagnóstico */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              Consola de Diagnóstico
            </CardTitle>
            <CardDescription>
              Captura de logs, monitoreo de errores y diagnóstico del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/debug">
                Abrir Consola
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Diagnóstico de Datos */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Diagnóstico de Datos
            </CardTitle>
            <CardDescription>
              Verificar estado de sincronización y datos del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/data-diagnostic">
                Diagnosticar
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Diagnóstico de Riesgo */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Análisis de Riesgo
            </CardTitle>
            <CardDescription>
              Visualizar estadísticas de estudiantes en riesgo académico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/risk-diagnostic">
                Ver Análisis
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Desfragmentación */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Mantenimiento
            </CardTitle>
            <CardDescription>
              Desfragmentar datos y optimizar almacenamiento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/defragment-data">
                Mantenimiento
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Tutoría */}
        <Card className="hover:shadow-md transition-shadow bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              Panel de Tutoría
            </CardTitle>
            <CardDescription>
              Acceso directo al panel de tutoría (visible para tutores asignados).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/tutor">
                Ir a Tutoría
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
