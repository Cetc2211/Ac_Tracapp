
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
import { Input } from '@/components/ui/input';
import { useData } from '@/hooks/use-data';
import { useState, useMemo } from 'react';
import { Search, Contact, Mail, Phone, MessageSquare } from 'lucide-react';
import { Student } from '@/lib/placeholder-data';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type TutorWithStudents = {
    name: string;
    students: (Student & { groupSubject: string })[];
}

export default function TutorsPage() {
    const { groups } = useData();
    const [searchQuery, setSearchQuery] = useState('');

    const tutors = useMemo(() => {
        const tutorMap: Map<string, TutorWithStudents> = new Map();

        groups.forEach(group => {
            group.students.forEach(student => {
                if (student.tutorName) {
                    if (!tutorMap.has(student.tutorName)) {
                        tutorMap.set(student.tutorName, { name: student.tutorName, students: [] });
                    }
                    const tutorData = tutorMap.get(student.tutorName)!;
                    
                    // Avoid adding duplicate students to a tutor
                    if (!tutorData.students.some(s => s.id === student.id)) {
                        tutorData.students.push({ ...student, groupSubject: group.subject });
                    }
                }
            });
        });

        return Array.from(tutorMap.values()).sort((a,b) => a.name.localeCompare(b.name));
    }, [groups]);

    const filteredTutors = useMemo(() => {
        if (!searchQuery) return tutors;
        const lowerCaseQuery = searchQuery.toLowerCase();

        return tutors.filter(tutor => 
            tutor.name.toLowerCase().includes(lowerCaseQuery) ||
            tutor.students.some(student => student.name.toLowerCase().includes(lowerCaseQuery))
        );
    }, [tutors, searchQuery]);

    const getWhatsAppLink = (phone: string | undefined, studentName: string) => {
        if (!phone) return '#';
        const cleanPhone = phone.replace(/\D/g, '');
        const message = encodeURIComponent(`Hola, le contacto en relación al seguimiento académico de ${studentName}.`);
        return `https://wa.me/${cleanPhone}?text=${message}`;
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold">Directorio de Tutores</h1>
                <p className="text-muted-foreground">
                    Encuentra la información de contacto de los tutores de tus estudiantes.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nombre de tutor o estudiante..." 
                            className="pl-8 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {filteredTutors.length > 0 ? filteredTutors.map(tutor => (
                            <div key={tutor.name}>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Contact className="h-5 w-5 text-primary" />
                                    {tutor.name}
                                </h3>
                                <div className="border-l-2 border-primary pl-4 ml-2 mt-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Estudiante</TableHead>
                                                <TableHead>Grupo</TableHead>
                                                <TableHead>Contacto del Tutor</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tutor.students.map(student => (
                                                <TableRow key={student.id}>
                                                    <TableCell className="font-medium">
                                                        <Link href={`/students/${student.id}`} className="flex items-center gap-2 hover:underline">
                                                            <Image src={student.photo} alt={student.name} width={32} height={32} className="rounded-full" />
                                                            {student.name}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{student.groupSubject}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            {student.tutorPhone && (
                                                                <a 
                                                                    href={getWhatsAppLink(student.tutorPhone, student.name)}
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 hover:text-primary"
                                                                >
                                                                    <Phone className="h-4 w-4" /> {student.tutorPhone}
                                                                </a>
                                                            )}
                                                            <span className="text-muted-foreground">|</span>
                                                            <a 
                                                                href={`mailto:${student.email}`}
                                                                className="flex items-center gap-1 hover:text-primary"
                                                            >
                                                                <Mail className="h-4 w-4" /> Enviar Correo
                                                            </a>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No se encontraron tutores que coincidan con tu búsqueda.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
