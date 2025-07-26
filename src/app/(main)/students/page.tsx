
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
import { PlusCircle, MoreHorizontal, Upload } from 'lucide-react';
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
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingStudent(null);
    setIsDialogOpen(false);
  }

  const handleSaveStudent = () => {
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
    } else {
        // Add new student
        const studentToAdd: Student = {
            id: editingStudent.id || `S${Date.now()}`,
            name: editingStudent.name,
            email: editingStudent.email,
            phone: editingStudent.phone,
            tutorName: editingStudent.tutorName,
            tutorPhone: editingStudent.tutorPhone,
            photo: editingStudent.photo || 'https://placehold.co/100x100.png',
            riskLevel: 'low',
        };
        saveStudents([...students, studentToAdd]);
        toast({
            title: 'Éxito',
            description: 'Estudiante agregado correctamente.',
        });
    }

    handleCloseDialog();
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        toast({
          variant: 'destructive',
          title: 'Error de formato',
          description: 'Por favor, sube un archivo en formato CSV.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const headerMapping: Record<string, string> = {
          nombre: 'name',
          email: 'email',
          telefono: 'phone',
          tutor: 'tutorName',
          telefono_tutor: 'tutorPhone'
        };

        const requiredSpanishHeaders = Object.keys(headerMapping);
        
        const allHeadersPresent = requiredSpanishHeaders.every(header => headers.includes(header));

        if (!allHeadersPresent) {
            toast({
                variant: 'destructive',
                title: 'Error de Cabeceras',
                description: `El archivo CSV debe contener las siguientes cabeceras: ${requiredSpanishHeaders.join(', ')}`,
            });
            return;
        }


        const newStudentsFromFile: Student[] = lines.slice(1).map((line, index) => {
          const data = line.split(',');
          const studentData: any = {};
          headers.forEach((header, i) => {
            const mappedHeader = headerMapping[header.trim().toLowerCase()];
            if (mappedHeader) {
                studentData[mappedHeader] = data[i]?.trim();
            }
          });

          return {
            id: `S-upload-${Date.now()}-${index}`,
            name: studentData.name,
            email: studentData.email,
            phone: studentData.phone,
            tutorName: studentData.tutorName,
            tutorPhone: studentData.tutorPhone,
            photo: 'https://placehold.co/100x100.png',
            riskLevel: 'low',
          };
        });
        saveStudents([...students, ...newStudentsFromFile]);
        toast({
            title: 'Carga Exitosa',
            description: `${newStudentsFromFile.length} estudiantes han sido agregados.`,
        });
      };
      reader.readAsText(file);
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteStudent = (studentId: string) => {
    saveStudents(students.filter(s => s.id !== studentId));
    toast({
        title: "Estudiante eliminado",
        description: "El estudiante ha sido eliminado de la lista.",
    });
  }


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
            <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept=".csv"
            />
            <Button size="sm" variant="outline" className="gap-1" onClick={triggerFileUpload}>
                <Upload className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Importar CSV
                </span>
            </Button>
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
                  <DialogTitle>{editingStudent?.id ? 'Editar Estudiante' : 'Agregar Nuevo Estudiante'}</DialogTitle>
                  <DialogDescription>
                    {editingStudent?.id ? 'Actualiza la información del estudiante.' : 'Complete el formulario para registrar un nuevo estudiante.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="id" className="text-right">
                      ID Estudiante
                    </Label>
                    <Input
                      id="id"
                      placeholder="S007 (Opcional)"
                      className="col-span-3"
                      value={editingStudent?.id || ''}
                      onChange={handleInputChange}
                      disabled={!!editingStudent?.id}
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="photo-upload" className="text-right">
                      Foto
                    </Label>
                    <Input id="photo-upload" type="file" className="col-span-3" disabled/>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                  <Button onClick={handleSaveStudent}>Guardar Cambios</Button>
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

    