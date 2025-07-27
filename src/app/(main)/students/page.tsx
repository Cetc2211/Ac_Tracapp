
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
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { students as initialStudents, Student, Group } from '@/lib/placeholder-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { StudentObservationDialog } from '@/components/student-observation-dialog';

export default function StudentsPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isObservationDialogOpen, setIsObservationDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    try {
        const storedStudents = localStorage.getItem('students');
        if (storedStudents) {
          setAllStudents(JSON.parse(storedStudents));
        } else {
            const allGroupsJson = localStorage.getItem('groups');
            const allGroups: Group[] = allGroupsJson ? JSON.parse(allGroupsJson) : initialGroups;
            const studentsFromGroups = allGroups.flatMap(g => g.students);
            const uniqueStudents = Array.from(new Map(studentsFromGroups.map(s => [s.id, s])).values());
            setAllStudents(uniqueStudents);
            localStorage.setItem('students', JSON.stringify(uniqueStudents));
        }
    } catch (error) {
        console.error("Failed to parse students from localStorage", error);
        setAllStudents(initialStudents);
    }
  }, []);

  const saveStudents = (newStudents: Student[]) => {
      setAllStudents(newStudents);
      localStorage.setItem('students', JSON.stringify(newStudents));
  }

  const handleOpenObservationDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsObservationDialogOpen(true);
  };
  
  const handleDeleteStudent = (studentId: string) => {
    saveStudents(allStudents.filter(s => s.id !== studentId));
    // Also remove from all groups
    const storedGroups = localStorage.getItem('groups');
    if (storedGroups) {
        const groups: Group[] = JSON.parse(storedGroups);
        const updatedGroups = groups.map(g => ({
            ...g,
            students: g.students.filter(s => s.id !== studentId)
        }));
        localStorage.setItem('groups', JSON.stringify(updatedGroups));
    }
    toast({
        title: "Estudiante eliminado",
        description: "El estudiante ha sido eliminado de la lista y de todos los grupos.",
    });
  }
  
  const handleSelectStudent = (studentId: string, checked: boolean | 'indeterminate') => {
      setSelectedStudents(prev => 
        checked ? [...prev, studentId] : prev.filter(id => id !== studentId)
      );
  };
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
      if(checked) {
          setSelectedStudents(allStudents.map(s => s.id));
      } else {
          setSelectedStudents([]);
      }
  };

  const handleDeleteSelectedStudents = () => {
      saveStudents(allStudents.filter(s => !selectedStudents.includes(s.id)));
      
       // Also remove from all groups
        const storedGroups = localStorage.getItem('groups');
        if (storedGroups) {
            const groups: Group[] = JSON.parse(storedGroups);
            const updatedGroups = groups.map(g => ({
                ...g,
                students: g.students.filter(s => !selectedStudents.includes(s.id))
            }));
            localStorage.setItem('groups', JSON.stringify(updatedGroups));
        }

      toast({
        title: "Estudiantes eliminados",
        description: `${selectedStudents.length} estudiante(s) han sido eliminados.`,
      });
      setSelectedStudents([]);
  };

  const numSelected = selectedStudents.length;
  
  const sortedStudents = useMemo(() => {
    return [...allStudents].sort((a,b) => a.name.localeCompare(b.name));
  }, [allStudents]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Estudiantes</CardTitle>
            <CardDescription>
              Lista consolidada de todos los estudiantes en tus grupos. Para agregar estudiantes, ve a un grupo específico.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {numSelected > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-1">
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Eliminar ({numSelected})</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente a los {numSelected} estudiantes seleccionados
                                y todos sus datos asociados de todos los grupos.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSelectedStudents}>Sí, eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
         {selectedStudent && (
            <StudentObservationDialog
                student={selectedStudent}
                open={isObservationDialogOpen}
                onOpenChange={setIsObservationDialogOpen}
            />
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead padding="checkbox">
                 <Checkbox
                    checked={numSelected === allStudents.length && allStudents.length > 0 ? true : (numSelected > 0 ? 'indeterminate' : false)}
                    onCheckedChange={(checked) => handleSelectAll(checked)}
                    aria-label="Seleccionar todo"
                  />
              </TableHead>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Foto</span>
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>ID de Estudiante</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Teléfono</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.map((student) => (
              <TableRow key={student.id} data-state={selectedStudents.includes(student.id) && "selected"}>
                 <TableCell padding="checkbox">
                   <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                        aria-label="Seleccionar fila"
                    />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Image
                    alt="Foto del estudiante"
                    className="aspect-square rounded-md object-cover"
                    height="64"
                    src={student.photo}
                    data-ai-hint="student photo"
                    width="64"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <button onClick={() => handleOpenObservationDialog(student)} className="text-left hover:underline">
                    {student.name}
                  </button>
                </TableCell>
                <TableCell>{student.id}</TableCell>
                <TableCell className="hidden md:table-cell">{student.email}</TableCell>
                <TableCell className="hidden md:table-cell">{student.phone}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/students/${student.id}`)}>Ver Perfil</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteStudent(student.id)}>
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
             {allStudents.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground p-8">
                        No hay estudiantes registrados. Agrégalos desde la página de un grupo.
                    </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
