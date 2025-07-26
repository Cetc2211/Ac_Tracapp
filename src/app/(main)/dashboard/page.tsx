
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, BookCopy, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { students as initialStudents, groups as initialGroups } from '@/lib/placeholder-data';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  // NOTE: In a real application, this data would be fetched from a persistent store
  // and likely managed with a global state manager. For this prototype, we'll
  // simulate fetching from localStorage to maintain state across page navigations.
  const [students, setStudents] = useState(initialStudents);
  const [groups, setGroups] = useState(initialGroups);

  useEffect(() => {
    const storedStudents = localStorage.getItem('students');
    const storedGroups = localStorage.getItem('groups');
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    }
    if (storedGroups) {
      setGroups(JSON.parse(storedGroups));
    }
  }, []);
  
  const atRiskStudents = students.filter(
    (s) => s.riskLevel === 'high' || s.riskLevel === 'medium'
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estudiantes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de estudiantes registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos Creados</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de asignaturas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estudiantes en Riesgo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {atRiskStudents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención especial
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Participación Media
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+75%</div>
            <p className="text-xs text-muted-foreground">
              Promedio en todas las clases
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Grupos Recientes</CardTitle>
              <CardDescription>
                Resumen de los grupos y su rendimiento.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/groups">
                Ver Todos
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asignatura</TableHead>
                  <TableHead className="text-center">Estudiantes</TableHead>
                  <TableHead className="text-right">Promedio Gral.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.slice(0, 5).map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div className="font-medium">{group.subject}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      {group.students.length}
                    </TableCell>
                    <TableCell className="text-right">8.5</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estudiantes con Alertas</CardTitle>
            <CardDescription>
              Estudiantes que requieren seguimiento por conducta o ausencias.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {atRiskStudents.map((student) => (
              <div key={student.id} className="flex items-center gap-4">
                <Image
                  alt="Avatar"
                  className="rounded-full"
                  height={40}
                  src={student.photo}
                  data-ai-hint="student avatar"
                  style={{
                    aspectRatio: '40/40',
                    objectFit: 'cover',
                  }}
                  width={40}
                />
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">
                    {student.name}
                  </p>
                  <p className="text-sm text-muted-foreground">ID: {student.id}</p>
                </div>
                <div className="ml-auto font-medium">
                  {student.riskLevel === 'high' && (
                    <Badge variant="destructive">Alto Riesgo</Badge>
                  )}
                  {student.riskLevel === 'medium' && (
                    <Badge variant="secondary" className="bg-amber-400 text-black">
                      Medio Riesgo
                    </Badge>
                  )}
                </div>
              </div>
            ))}
             {atRiskStudents.length === 0 && (
                <p className="text-sm text-center text-muted-foreground">No hay estudiantes con alertas.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    