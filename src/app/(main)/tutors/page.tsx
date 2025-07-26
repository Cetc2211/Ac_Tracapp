
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
import { Phone } from 'lucide-react';
import { students as initialStudents, Student } from '@/lib/placeholder-data';
import { useState, useEffect } from 'react';

export default function TutorsPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  
  useEffect(() => {
    const storedStudents = localStorage.getItem('students');
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contacto de Tutores</CardTitle>
            <CardDescription>
              Lista de estudiantes y la información de contacto de sus tutores.
            </CardDescription>
          </div>
        </div>
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
            {students
              .filter(student => student.tutorName && student.tutorPhone)
              .map((student) => (
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    