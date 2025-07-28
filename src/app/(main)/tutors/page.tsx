
'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Users, Eye } from 'lucide-react';
import { groups as initialGroups, Group, Student } from '@/lib/placeholder-data';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

// Extracted TutorListDialog to be a top-level component.
const TutorListDialog = ({ group, studentsWithTutors }: { group: Group, studentsWithTutors: Student[] }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full" disabled={studentsWithTutors.length === 0}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Lista de Tutores
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Tutores del Grupo: {group.subject}</DialogTitle>
                    <DialogDescription>
                        Lista completa de estudiantes y la información de contacto de sus tutores.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
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
                                        {student.tutorPhone &&
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={`tel:${student.tutorPhone}`}>
                                                    <Phone className="mr-2 h-4 w-4" />
                                                    Llamar
                                                </a>
                                            </Button>
                                        }
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
};


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
            <h1 className="text-3xl font-bold">Contacto de Tutores</h1>
            <p className="text-muted-foreground">
              Lista de estudiantes y la información de contacto de sus tutores, agrupados por asignatura.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map(group => {
                const studentsWithTutors = group.students.filter(student => student.tutorName && student.tutorPhone);
                const displayedStudents = studentsWithTutors.slice(0, 3);
                const remainingStudentsCount = studentsWithTutors.length - displayedStudents.length;

                return (
                    <Card key={group.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{group.subject}</CardTitle>
                            <CardDescription>
                                {studentsWithTutors.length} de {group.students.length} estudiantes tienen información de tutor.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="flex items-center space-x-2">
                                <div className="flex -space-x-4">
                                    {displayedStudents.map(student => (
                                        <Image
                                            key={student.id}
                                            alt={student.name}
                                            className="aspect-square rounded-full object-cover border-2 border-card"
                                            height="40"
                                            src={student.photo}
                                            data-ai-hint="student avatar"
                                            width="40"
                                        />
                                    ))}
                                </div>
                                {remainingStudentsCount > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                        + {remainingStudentsCount} más
                                    </span>
                                )}
                                 {studentsWithTutors.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No hay tutores registrados.</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                           <TutorListDialog group={group} studentsWithTutors={studentsWithTutors} />
                        </CardFooter>
                    </Card>
                )
            })}
             {groups.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                        <div className="bg-muted rounded-full p-4">
                            <Users className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h1 className="text-2xl font-bold">No hay grupos creados</h1>
                        <p className="text-muted-foreground">No se puede mostrar la información de tutores porque no existen grupos.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}
