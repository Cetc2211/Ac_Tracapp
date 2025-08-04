
'use client';

import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Student } from '@/lib/placeholder-data';
import { Search, Users, BookText } from 'lucide-react';
import { ObservationDialog } from '@/components/observation-dialog';
import { useData } from '@/hooks/use-data';

export default function ObservationsPage() {
  const { activeGroup } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const studentsToDisplay = useMemo(() => {
    return activeGroup?.students || [];
  }, [activeGroup]);

  const handleOpenDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  const filteredStudents = useMemo(() => {
    return studentsToDisplay.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [studentsToDisplay, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
       {selectedStudent && (
        <ObservationDialog
          student={selectedStudent}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bitácora de Observaciones</h1>
          <p className="text-muted-foreground">
            {activeGroup 
                ? `Registra observaciones para el grupo: ${activeGroup.subject}.`
                : 'Selecciona un grupo para ver a sus estudiantes.'
            }
          </p>
        </div>
      </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Lista de Estudiantes</CardTitle>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar estudiante..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="hidden w-[80px] sm:table-cell">
                            Foto
                        </TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.map(student => (
                        <TableRow key={student.id}>
                            <TableCell className="hidden sm:table-cell">
                            <Image
                                src={student.photo}
                                alt={student.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                            </TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.id}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(student)}>
                                    <BookText className="mr-2 h-4 w-4" />
                                    Registrar Observación
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filteredStudents.length === 0 && (
                     <div className="text-center p-12 text-muted-foreground">
                         {studentsToDisplay.length > 0 ? (
                            <p>No se encontraron estudiantes con ese nombre.</p>
                         ) : (
                            <div className="flex flex-col items-center gap-4">
                                <Users className="h-12 w-12" />
                                <h3 className="text-lg font-semibold">
                                    {activeGroup ? "Este grupo no tiene estudiantes" : "No hay un grupo activo seleccionado"}
                                </h3>
                                <p className="text-sm">
                                    {activeGroup ? "Agrega estudiantes desde la página del grupo." : "Por favor, ve a la sección 'Grupos' y selecciona uno para empezar."}
                                </p>
                            </div>
                         )}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
