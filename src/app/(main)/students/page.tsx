
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
import { PlusCircle, MoreHorizontal } from 'lucide-react';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const [multiStudentNames, setMultiStudentNames] = useState('');

  const { toast } = useToast();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (editingStudent) {
        setEditingStudent((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleOpenDialog = (student: Partial<Student> | null) => {
    setEditingStudent(student ? { ...student } : {});
    setMultiStudentNames('');
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingStudent(null);
    setIsDialogOpen(false);
  }

  const handleSave = () => {
    if (editingStudent && editingStudent.id) { // Editing a single student
      handleSaveSingleStudent();
    } else { // Adding one or more new students
      handleSaveNewStudents();
    }
  };


  const handleSaveSingleStudent = () => {
    if (!editingStudent?.name?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El nombre del estudiante es obligatorio.',
      });
      return;
    }

    if (editingStudent.id) {
        // Edit existing student
        const updatedStudents = students.map(s => 
            s.id === editingStudent.id ? { ...s, ...editingStudent } as Student : s
        );
        saveStudents(updatedStudents);
        toast({
            title: 'Éxito',
            description: 'Estudiante actualizado correctamente.',
        });
    }
    handleCloseDialog();
  };
  
  const handleSaveNewStudents = () => {
    const namesToProcess = editingStudent?.name ? [editingStudent.name] : multiStudentNames.split('\n');
    const newStudents = namesToProcess
      .map(name => name.trim())
      .filter(name => name) // Filter out empty lines
      .map(name => ({
        id: `S${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: name,
        email: '',
        phone: '',
        tutorName: '',
        tutorPhone: '',
        photo: 'https://placehold.co/100x100.png',
        riskLevel: 'low' as 'low' | 'medium' | 'high',
      }));

    if (newStudents.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, ingresa al menos un nombre de estudiante.',
      });
      return;
    }

    saveStudents([...students, ...newStudents]);
    toast({
      title: 'Éxito',
      description: `${newStudents.length} estudiante(s) agregados correctamente.`,
    });
    
    handleCloseDialog();
  }

  const handleDeleteStudent = (studentId: string) => {
    saveStudents(students.filter(s => s.id !== studentId));
    toast({
        title: "Estudiante eliminado",
        description: "El estudiante ha sido eliminado de la lista.",
    });
  }

  const isEditing = editingStudent && editingStudent.id;


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
          <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={() => handleOpenDialog(null)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Nuevo Estudiante
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
            <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Editar Estudiante' : 'Agregar Nuevos Estudiantes'}</DialogTitle>
                  <DialogDescription>
                    {isEditing 
                      ? 'Actualiza la información del estudiante.' 
                      : 'Puedes agregar un estudiante o pegar una lista de nombres (uno por línea).'}
                  </DialogDescription>
                </DialogHeader>
                {isEditing ? (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="id" className="text-right">
                        ID Estudiante
                      </Label>
                      <Input
                        id="id"
                        className="col-span-3"
                        value={editingStudent?.id || ''}
                        onChange={handleInputChange}
                        disabled={true}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Nombre*
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ana Torres"
                        className="col-span-3"
                        value={editingStudent?.name || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ana.t@example.com"
                        className="col-span-3"
                        value={editingStudent?.email || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">
                        Teléfono
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="555-123-4567"
                        className="col-span-3"
                        value={editingStudent?.phone || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tutorName" className="text-right">
                        Tutor
                      </Label>
                      <Input
                        id="tutorName"
                        placeholder="Juan Torres"
                        className="col-span-3"
                        value={editingStudent?.tutorName || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tutorPhone" className="text-right">
                        Tel. Tutor
                      </Label>
                      <Input
                        id="tutorPhone"
                        type="tel"
                        placeholder="555-765-4321"
                        className="col-span-3"
                        value={editingStudent?.tutorPhone || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 py-4">
                      <Label htmlFor="name" className="text-left">
                        Nombre de un estudiante
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ana Torres"
                        value={editingStudent?.name || ''}
                        onChange={(e) => setEditingStudent({ name: e.target.value })}
                        disabled={!!multiStudentNames}
                      />
                      <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">O</span>
                          </div>
                      </div>
                      <Label htmlFor="multiStudentNames" className="text-left">
                        Pega una lista de nombres (uno por línea)
                      </Label>
                      <Textarea
                        id="multiStudentNames"
                        placeholder="Laura Jimenez\nCarlos Sanchez\nSofia Castillo"
                        className="col-span-3"
                        rows={5}
                        value={multiStudentNames}
                        onChange={(e) => {
                          setMultiStudentNames(e.target.value);
                          if (e.target.value) {
                            setEditingStudent({ name: '' });
                          }
                        }}
                      />
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                  <Button onClick={handleSave}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Table>
          <TableHeader>
            <TableRow>
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
              <TableRow key={student.id}>
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
                <TableCell className="font-medium">{student.name}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleOpenDialog(student)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem disabled>Ver Perfil Completo</DropdownMenuItem>
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground p-8">
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

    