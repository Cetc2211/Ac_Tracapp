
'use client';

import Image from 'next/image';
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
import { Button } from '@/components/ui/button';
import { Phone, Users } from 'lucide-react';
import { groups as initialGroups, Group } from '@/lib/placeholder-data';
import { useState, useEffect } from 'react';

export default function TutorsPage() {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  
  useEffect(() => {
    try {
        const storedGroups = localStorage.getItem('groups');
        if (storedGroups) {
          setGroups(JSON.parse(storedGroups));
        }
    } catch (error) {
        console.error("Failed to parse groups from localStorage", error);
        setGroups(initialGroups);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold">Contacto de Tutores</CardTitle>
            <CardDescription>
              Lista de estudiantes y la información de contacto de sus tutores, agrupados por asignatura.
            </CardDescription>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            {groups.map(group => {
                const studentsWithTutors = group.students.filter(student => student.tutorName && student.tutorPhone);

                return (
                    <Card key={group.id}>
                        <CardHeader>
                            <CardTitle>{group.subject}</CardTitle>
                            <CardDescription>
                                {studentsWithTutors.length} de {group.students.length} estudiantes tienen información de tutor.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead>Tutor</TableHead>
                                    <TableHead>Teléfono del Tutor</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentsWithTutors.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium flex items-center gap-3">
                                        <Image
                                            alt="Foto del estudiante"
                                            className="aspect-square rounded-full object-cover"
                                            height="40"
                                            src={student.photo}
                                            data-ai-hint="student photo"
                                            width="40"
                                        />
                                        {student.name}
                                        </TableCell>
                                        <TableCell>{student.tutorName}</TableCell>
                                        <TableCell>{student.tutorPhone}</TableCell>
                                        <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={`tel:${student.tutorPhone}`}>
                                            <Phone className="mr-2 h-4 w-4" />
                                            Llamar
                                            </a>
                                        </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                     {studentsWithTutors.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">
                                                No hay estudiantes con información de tutor en este grupo.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )
            })}
             {groups.length === 0 && (
                <Card className="md:col-span-2">
                    <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                        <div className="bg-muted rounded-full p-4">
                            <Users className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <CardTitle>No hay grupos creados</CardTitle>
                        <CardDescription>No se puede mostrar la información de tutores porque no existen grupos.</CardDescription>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}
