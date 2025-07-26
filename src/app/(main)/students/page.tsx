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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Upload } from 'lucide-react';
import { students as initialStudents, Student } from '@/lib/placeholder-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewStudent((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddStudent = () => {
    if (newStudent.name) {
      const studentToAdd: Student = {
        id: newStudent.id || `S${Math.floor(Math.random() * 1000)}`,
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
        tutorName: newStudent.tutorName,
        tutorPhone: newStudent.tutorPhone,
        photo: 'https://placehold.co/100x100.png',
        riskLevel: 'low',
      };
      setStudents([...students, studentToAdd]);
      setNewStudent({});
      setIsDialogOpen(false);
      toast({
        title: 'Éxito',
        description: 'Estudiante agregado correctamente.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El nombre del estudiante es obligatorio.',
      });
    }
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
        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['name', 'email', 'phone', 'tutorName', 'tutorPhone'];
        
        if(!requiredHeaders.every(h => headers.includes(h))) {
            toast({
                variant: 'destructive',
                title: 'Error de Cabeceras',
                description: `El archivo CSV debe contener las siguientes cabeceras: ${requiredHeaders.join(', ')}`,
            });
            return;
        }

        const newStudents: Student[] = lines.slice(1).map((line, index) => {
          const data = line.split(',');
          const studentData: any = {};
          headers.forEach((header, i) => {
            studentData[header] = data[i]?.trim();
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
        setStudents(prev => [...prev, ...newStudents]);
        toast({
            title: 'Carga Exitosa',
            description: `${newStudents.length} estudiantes han sido agregados.`,
        });
      };
      reader.readAsText(file);
    }
     // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };


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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Nuevo Estudiante
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Estudiante</DialogTitle>
                  <DialogDescription>
                    Complete el formulario para registrar un nuevo estudiante.
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
                      value={newStudent.id || ''}
                      onChange={handleInputChange}
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
                      value={newStudent.name || ''}
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
                      value={newStudent.email || ''}
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
                      value={newStudent.phone || ''}
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
                      value={newStudent.tutorName || ''}
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
                      value={newStudent.tutorPhone || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="photo" className="text-right">
                      Foto
                    </Label>
                    <Input id="photo" type="file" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddStudent}>Guardar Estudiante</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Ver Perfil Completo</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
