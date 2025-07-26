'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { groups as initialGroups } from '@/lib/placeholder-data';
import { Users, ClipboardList } from 'lucide-react';
import { AttendanceRandomizer } from '@/components/attendance-randomizer';
import Link from 'next/link';
import { useState } from 'react';

export default function GroupsPage() {
  const [groups] = useState(initialGroups);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grupos de Asignaturas</h1>
          <p className="text-muted-foreground">
            Gestiona tus grupos, toma asistencia y registra actividades.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.subject}</CardTitle>
              <CardDescription className="flex items-center gap-2 pt-2">
                <Users className="h-4 w-4" />
                <span>{group.students.length} estudiantes</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Promedio del grupo: 8.5</p>
                <p>Actividades pendientes: 3</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild variant="outline">
                <Link href={`/groups/${group.id}`}>
                  <ClipboardList className="mr-2 h-4 w-4" /> Ver Detalles
                </Link>
              </Button>
              <AttendanceRandomizer students={group.students} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
