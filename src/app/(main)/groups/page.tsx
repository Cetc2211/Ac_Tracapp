
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { groups as initialGroups, students as initialStudents, Student } from '@/lib/placeholder-data';
import { Users, ClipboardList, PlusCircle } from 'lucide-react';
import { AttendanceRandomizer } from '@/components/attendance-randomizer';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';


export default function GroupsPage() {
  const [groups, setGroups] = useState(initialGroups);
  const [students, setStudents] = useState(initialStudents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedGroups = localStorage.getItem('groups');
    if (storedGroups) {
      setGroups(JSON.parse(storedGroups));
    } else {
       localStorage.setItem('groups', JSON.stringify(initialGroups));
    }

    const storedStudents = localStorage.getItem('students');
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    }
  }, []);

  const saveGroups = (newGroups: typeof initialGroups) => {
    setGroups(newGroups);
    localStorage.setItem('groups', JSON.stringify(newGroups));
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'El nombre de la asignatura es obligatorio.'
        });
        return;
    }

    const studentsForNewGroup = students.filter(s => selectedStudents.includes(s.id));

    const newGroup = {
        id: `G${Date.now()}`,
        subject: newGroupName,
        students: studentsForNewGroup
    };

    saveGroups([...groups, newGroup]);

    // Reset form
    setNewGroupName('');
    setSelectedStudents([]);
    setIsDialogOpen(false);

    toast({
        title: 'Grupo Creado',
        description: `El grupo "${newGroupName}" ha sido creado exitosamente.`
    });
  };

  const onStudentSelect = (studentId: string, checked: boolean | 'indeterminate') => {
      setSelectedStudents(prev => 
        checked ? [...prev, studentId] : prev.filter(id => id !== studentId)
      );
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grupos de Asignaturas</h1>
          <p className="text-muted-foreground">
            Gestiona tus grupos, toma asistencia y registra actividades.
          </p>
        </div>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                 <Button size="sm" className="gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Nuevo Grupo
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles para crear un nuevo grupo de asignatura.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="group-name">Nombre de la Asignatura*</Label>
                        <Input 
                            id="group-name" 
                            placeholder="Ej. Cálculo Diferencial"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label>Seleccionar Estudiantes (Opcional)</Label>
                        <div className="grid gap-4 py-2 max-h-[300px] overflow-y-auto border p-2 rounded-md">
                            {students.map(student => (
                                <div key={student.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`select-student-${student.id}`} 
                                        onCheckedChange={(checked) => onStudentSelect(student.id, checked)}
                                        checked={selectedStudents.includes(student.id)}
                                    />
                                    <Label htmlFor={`select-student-${student.id}`} className="flex items-center gap-3 w-full cursor-pointer">
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
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateGroup}>Crear Grupo</Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.subject}</CardTitle>
              <CardDescription className="flex items-center gap-2 pt-2">
                <Users className="h-4 w-4" />
                <span>{group.students.length} estudiantes</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Promedio del grupo: 8.5</p>
                <p>Actividades pendientes: 3</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild variant="outline">
                <Link href={`/groups/${group.id}`}>
                  <ClipboardList className="mr-2 h-4 w-4" /> Ver Detalles
                </Link>
              </Button>
              <AttendanceRandomizer students={group.students} />
            </CardFooter>
          </Card>
        ))}
         {groups.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                     <div className="bg-muted rounded-full p-4">
                        <BookCopy className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle>No hay grupos todavía</CardTitle>
                    <CardDescription>Crea tu primer grupo para empezar a organizar a tus estudiantes.</CardDescription>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
