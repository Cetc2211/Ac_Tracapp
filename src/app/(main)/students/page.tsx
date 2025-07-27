
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
import { PlusCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { students as initialStudents, Student } from '@/lib/placeholder-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { StudentObservationDialog } from '@/components/student-observation-dialog';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isObservationDialogOpen, setIsObservationDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkNames, setBulkNames] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkPhones, setBulkPhones] = useState('');
  const [bulkTutorNames, setBulkTutorNames] = useState('');
  const [bulkTutorPhones, setBulkTutorPhones] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    try {
        const storedStudents = localStorage.getItem('students');
        if (storedStudents) {
          setStudents(JSON.parse(storedStudents));
        } else {
            setStudents(initialStudents);
            localStorage.setItem('students', JSON.stringify(initialStudents));
        }
    } catch (error) {
        console.error("Failed to parse students from localStorage", error);
        setStudents(initialStudents);
    }
  }, []);

  const saveStudents = (newStudents: Student[]) => {
      setStudents(newStudents);
      localStorage.setItem('students', JSON.stringify(newStudents));
  }

  const handleOpenAddDialog = () => {
    setBulkNames('');
    setBulkEmails('');
    setBulkPhones('');
    setBulkTutorNames('');
    setBulkTutorPhones('');
    setIsAddDialogOpen(true);
  };
  
  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
  }

  const handleOpenObservationDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsObservationDialogOpen(true);
  };

  const handleSaveBulkStudents = () => {
    const names = bulkNames.trim().split('\n').filter(name => name);
    const emails = bulkEmails.trim().split('\n');
    const phones = bulkPhones.trim().split('\n');
    const tutorNames = bulkTutorNames.trim().split('\n');
    const tutorPhones = bulkTutorPhones.trim().split('\n');

    if (names.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, ingresa al menos un nombre de estudiante.',
      });
      return;
    }

    const newStudents: Student[] = names.map((name, index) => ({
      id: `S${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${index}`,
      name: name.trim(),
      email: emails[index]?.trim() || '',
      phone: phones[index]?.trim() || '',
      tutorName: tutorNames[index]?.trim() || '',
      tutorPhone: tutorPhones[index]?.trim() || '',
      photo: 'https://placehold.co/100x100.png',
      riskLevel: 'low' as 'low' | 'medium' | 'high',
    }));

    saveStudents([...students, ...newStudents]);
    toast({
      title: 'Éxito',
      description: `${newStudents.length} estudiante(s) agregados correctamente.`,
    });
    
    handleCloseAddDialog();
  }

  const handleDeleteStudent = (studentId: string) => {
    saveStudents(students.filter(s => s.id !== studentId));
    toast({
        title: "Estudiante eliminado",
        description: "El estudiante ha sido eliminado de la lista.",
    });
  }
  
  const handleSelectStudent = (studentId: string, checked: boolean | 'indeterminate') => {
      setSelectedStudents(prev => 
        checked ? [...prev, studentId] : prev.filter(id => id !== studentId)
      );
  };
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
      if(checked) {
          setSelectedStudents(students.map(s => s.id));
      } else {
          setSelectedStudents([]);
      }
  };

  const handleDeleteSelectedStudents = () => {
      saveStudents(students.filter(s => !selectedStudents.includes(s.id)));
      toast({
        title: "Estudiantes eliminados",
        description: `${selectedStudents.length} estudiante(s) han sido eliminados.`,
      });
      setSelectedStudents([]);
  };

  const numSelected = selectedStudents.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Estudiantes</CardTitle>
            <CardDescription>
              Gestiona los perfiles de los estudiantes de tu institución.
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
                                y todos sus datos asociados.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSelectedStudents}>Sí, eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <Button size="sm" className="gap-1" onClick={handleOpenAddDialog}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Agregar Estudiantes
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Agregar Varios Estudiantes</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        Pega una columna de datos en cada campo. Asegúrate de que cada línea corresponda al mismo estudiante.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bulkNames">Nombres*</Label>
                            <Textarea id="bulkNames" placeholder="Laura Jimenez\nCarlos Sanchez" rows={5} value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bulkEmails">Emails</Label>
                            <Textarea id="bulkEmails" placeholder="laura.j@example.com\ncarlos.s@example.com" rows={5} value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} />
                        </div>
                          <div className="space-y-2">
                            <Label htmlFor="bulkPhones">Teléfonos</Label>
                            <Textarea id="bulkPhones" placeholder="555-3344\n555-6677" rows={5} value={bulkPhones} onChange={(e) => setBulkPhones(e.target.value)} />
                        </div>
                          <div className="space-y-2">
                            <Label htmlFor="bulkTutorNames">Nombres de Tutores</Label>
                            <Textarea id="bulkTutorNames" placeholder="Ricardo Jimenez\nMaria Sanchez" rows={5} value={bulkTutorNames} onChange={(e) => setBulkTutorNames(e.target.value)} />
                        </div>
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="bulkTutorPhones">Teléfonos de Tutores</Label>
                            <Textarea id="bulkTutorPhones" placeholder="555-3355\n555-6688" rows={5} value={bulkTutorPhones} onChange={(e) => setBulkTutorPhones(e.target.value)} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCloseAddDialog}>Cancelar</Button>
                    <Button onClick={handleSaveBulkStudents}>Agregar Estudiantes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

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
                    checked={numSelected === students.length && students.length > 0 ? true : (numSelected > 0 ? 'indeterminate' : false)}
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
            {students.map((student) => (
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
             {students.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground p-8">
                        No hay estudiantes registrados.
                    </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

