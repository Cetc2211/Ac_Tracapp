
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
import { groups as initialGroups, students as initialStudents, Student } from '@/lib/placeholder-data';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, UserPlus, Trash2, PlusCircle, Trash } from 'lucide-react';
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
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
};

export default function GroupDetailsPage({
  params,
}: {
  params: { groupId: string };
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [students, setStudents] = useState(initialStudents);
  const { toast } = useToast();
  const router = useRouter();

  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriteria[]>([]);
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newCriterionWeight, setNewCriterionWeight] = useState('');
  
  
  useEffect(() => {
    try {
      const storedGroups = localStorage.getItem('groups');
      if (storedGroups) {
        setGroups(JSON.parse(storedGroups));
      } else {
        setGroups(initialGroups);
        localStorage.setItem('groups', JSON.stringify(initialGroups));
      }

      const storedStudents = localStorage.getItem('students');
      if(storedStudents) {
        setStudents(JSON.parse(storedStudents));
      } else {
        setStudents(initialStudents);
        localStorage.setItem('students', JSON.stringify(initialStudents));
      }
      
      const storedCriteria = localStorage.getItem(`criteria_${params.groupId}`);
        if (storedCriteria) {
            setEvaluationCriteria(JSON.parse(storedCriteria));
        }

    } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        setGroups(initialGroups);
        setStudents(initialStudents);
    }
  }, [params.groupId]);

  const saveGroups = (newGroups: typeof initialGroups) => {
      setGroups(newGroups);
      localStorage.setItem('groups', JSON.stringify(newGroups));
  };
  
  const saveCriteria = (newCriteria: EvaluationCriteria[]) => {
    setEvaluationCriteria(newCriteria);
    localStorage.setItem(`criteria_${params.groupId}`, JSON.stringify(newCriteria));
  };


  const group = groups.find((g) => g.id === params.groupId);

  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const studentsInGroup = group ? group.students.map(s => s.id) : [];
  const availableStudents = students.filter(s => !studentsInGroup.includes(s.id));


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

  const handleDeleteGroup = () => {
    const newGroups = groups.filter(g => g.id !== group.id);
    saveGroups(newGroups);
    localStorage.removeItem(`criteria_${params.groupId}`);
    toast({
        title: 'Grupo Eliminado',
        description: `El grupo "${group.subject}" ha sido eliminado.`,
    });
    router.push('/groups');
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
  
  const handleAddCriterion = () => {
    const weight = parseFloat(newCriterionWeight);
    if (!newCriterionName.trim() || isNaN(weight) || weight <= 0 || weight > 100) {
        toast({
            variant: 'destructive',
            title: 'Datos inválidos',
            description: 'El nombre no puede estar vacío y el peso debe ser un número entre 1 y 100.',
        });
        return;
    }

    const totalWeight = evaluationCriteria.reduce((sum, c) => sum + c.weight, 0) + weight;
    if (totalWeight > 100) {
        toast({
            variant: 'destructive',
            title: 'Límite de peso excedido',
            description: `El peso total (${totalWeight}%) no puede superar el 100%.`,
        });
        return;
    }

    const newCriterion: EvaluationCriteria = {
        id: `C${Date.now()}`,
        name: newCriterionName.trim(),
        weight: weight,
    };

    saveCriteria([...evaluationCriteria, newCriterion]);
    setNewCriterionName('');
    setNewCriterionWeight('');
    toast({ title: 'Criterio Agregado', description: `Se agregó "${newCriterion.name}" a la lista.`});
  };
  
  const handleRemoveCriterion = (criterionId: string) => {
    const newCriteria = evaluationCriteria.filter(c => c.id !== criterionId);
    saveCriteria(newCriteria);
    toast({ title: 'Criterio Eliminado', description: 'El criterio de evaluación ha sido eliminado.' });
  };
  
  const totalWeight = useMemo(() => {
    return evaluationCriteria.reduce((sum, c) => sum + c.weight, 0);
  }, [evaluationCriteria]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
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
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Más opciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Opciones del Grupo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Grupo
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el grupo,
                                sus criterios de evaluación y desvinculará a los estudiantes.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive hover:bg-destructive/90">
                                Sí, eliminar grupo
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
            <CardContent className="p-0">
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
                   {group.students.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground p-8">
                            No hay estudiantes en este grupo.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Criterios de Evaluación</CardTitle>
                <CardDescription>
                    Define los rubros y su peso para la calificación final. Total actual: {totalWeight}%.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Nombre del criterio (Ej. Tareas)" 
                            value={newCriterionName}
                            onChange={(e) => setNewCriterionName(e.target.value)}
                        />
                        <Input 
                            type="number" 
                            placeholder="Peso %" 
                            className="max-w-[100px]"
                            value={newCriterionWeight}
                            onChange={(e) => setNewCriterionWeight(e.target.value)}
                        />
                        <Button size="icon" onClick={handleAddCriterion} disabled={!newCriterionName || !newCriterionWeight}>
                            <PlusCircle className="h-4 w-4"/>
                            <span className="sr-only">Agregar</span>
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {evaluationCriteria.map(criterion => (
                            <div key={criterion.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <span>{criterion.name}</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{criterion.weight}%</Badge>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveCriterion(criterion.id)}>
                                        <Trash className="h-4 w-4 text-destructive"/>
                                        <span className="sr-only">Eliminar</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {evaluationCriteria.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground pt-4">No has agregado criterios de evaluación.</p>
                        )}
                    </div>
                     {totalWeight > 0 && (
                        <div className="text-right text-sm font-bold">
                            Total: {totalWeight}%
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
