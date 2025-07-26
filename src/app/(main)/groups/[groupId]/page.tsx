
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { groups as initialGroups, students as allStudents, Student } from '@/lib/placeholder-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, UserPlus } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function GroupDetailsPage({
  params,
}: {
  params: { groupId: string };
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [students, setStudents] = useState(allStudents);
  const { toast } = useToast();
  
  useEffect(() => {
    const storedGroups = localStorage.getItem('groups');
    if (storedGroups) {
      setGroups(JSON.parse(storedGroups));
    }
    const storedStudents = localStorage.getItem('students');
    if(storedStudents) {
      setStudents(JSON.parse(storedStudents));
    }
  }, []);

  const saveGroups = (newGroups: typeof initialGroups) => {
      setGroups(newGroups);
      localStorage.setItem('groups', JSON.stringify(newGroups));
  };


  const group = groups.find((g) => g.id === params.groupId);

  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const studentsInGroup = group ? group.students : [];
  const availableStudents = students.filter(s => !studentsInGroup.some(gs => gs.id === s.id));


  if (!group) {
    return notFound();
  }
  
  const handleRemoveStudent = (studentId: string) => {
    const newGroups = groups.map(g => {
        if (g.id === group.id) {
            return { ...g, students: g.students.filter(s => s.id !== studentId) };
        }
        return g;
    });
    saveGroups(newGroups);
    toast({
        title: "Estudiante eliminado",
        description: "El estudiante ha sido quitado del grupo.",
    });
  };
  
  const handleAddStudents = () => {
    const studentsToAdd = students.filter(s => selectedStudents.includes(s.id));
    const newGroups = groups.map(g => {
        if (g.id === group.id) {
            const newStudents = [...g.students, ...studentsToAdd].filter((student, index, self) =>
                index === self.findIndex((s) => (
                    s.id === student.id
                ))
            );
            return { ...g, students: newStudents };
        }
        return g;
    });
    saveGroups(newGroups);
    setSelectedStudents([]);
    setIsAddStudentDialogOpen(false);
    toast({
        title: "Estudiantes agregados",
        description: `${studentsToAdd.length} estudiante(s) han sido añadidos al grupo.`
    });
  };

  const onStudentSelect = (studentId: string, checked: boolean | 'indeterminate') => {
      setSelectedStudents(prev => 
        checked ? [...prev, studentId] : prev.filter(id => id !== studentId)
      );
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/groups">
            <ArrowLeft />
            <span className="sr-only">Volver a grupos</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{group.subject}</h1>
          <p className="text-muted-foreground">
            Detalles del grupo y lista de estudiantes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estudiantes en el Grupo</CardTitle>
              <CardDescription>
                Actualmente hay {group.students.length} estudiantes en este
                grupo.
              </CardDescription>
            </div>
            <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Agregar Estudiante
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Estudiantes al Grupo</DialogTitle>
                  <DialogDescription>
                    Selecciona los estudiantes que deseas añadir a "{group.subject}".
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                    {availableStudents.map(student => (
                         <div key={student.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`student-${student.id}`} 
                                onCheckedChange={(checked) => onStudentSelect(student.id, checked)}
                                checked={selectedStudents.includes(student.id)}
                            />
                            <Label htmlFor={`student-${student.id}`} className="flex items-center gap-3">
                                <Image
                                    alt="Foto del estudiante"
                                    className="aspect-square rounded-full object-cover"
                                    height="40"
                                    src={student.photo}
                                    data-ai-hint="student photo"
                                    width="40"
                                />
                                <div>
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">{student.id}</p>
                                </div>
                            </Label>
                        </div>
                    ))}
                    {availableStudents.length === 0 && (
                        <p className="text-center text-muted-foreground">No hay más estudiantes para agregar.</p>
                    )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddStudentDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddStudents} disabled={selectedStudents.length === 0}>Agregar Seleccionados</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                <TableHead>Nivel de Riesgo</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.students.map((student) => (
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
                  <TableCell className="hidden md:table-cell">
                    {student.email}
                  </TableCell>
                  <TableCell>
                    {student.riskLevel === 'high' && (
                      <Badge variant="destructive">Alto</Badge>
                    )}
                    {student.riskLevel === 'medium' && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-400 text-black"
                      >
                        Medio
                      </Badge>
                    )}
                    {student.riskLevel === 'low' && (
                      <Badge variant="secondary">Bajo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Ver Perfil Completo</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRemoveStudent(student.id)} className="text-destructive">
                          Quitar del Grupo
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
    </div>
  );
}

    