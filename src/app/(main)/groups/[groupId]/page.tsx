
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
import { notFound, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, UserPlus, Trash2, CalendarCheck, FilePen, Edit, Loader2, PenSquare, X } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
};

type GradeDetail = {
  delivered: number | null;
  average: number | null;
};

type Grades = {
  [studentId: string]: {
    [criterionId: string]: GradeDetail;
  };
};

type AttendanceStatus = 'present' | 'absent' | 'late';

type AttendanceRecord = {
  [studentId: string]: AttendanceStatus;
};

type DailyAttendance = {
    [date: string]: AttendanceRecord;
}

type ParticipationRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [groups, setGroups] = useState<typeof initialGroups>([]);
  const [allStudents, setAllStudents] = useState<typeof initialStudents>([]);
  const { toast } = useToast();
  const router = useRouter();

  const [group, setGroup] = useState<(typeof initialGroups)[0] | null>(null);
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriteria[]>([]);
  const [studentRiskLevels, setStudentRiskLevels] = useState<{[studentId: string]: 'low' | 'medium' | 'high'}>({});
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  
  const [bulkNames, setBulkNames] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkPhones, setBulkPhones] = useState('');
  const [bulkTutorNames, setBulkTutorNames] = useState('');
  const [bulkTutorPhones, setBulkTutorPhones] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lastSelectedStudentId, setLastSelectedStudentId] = useState<string | null>(null);
  
 const calculateFinalGrade = useCallback((studentId: string, criteria: EvaluationCriteria[], grades: Grades, participations: ParticipationRecord) => {
    if (!grades || !criteria || criteria.length === 0) return 0;
    const studentGrades = grades[studentId];
    
    let finalGrade = 0;
    for (const criterion of criteria) {
      if(criterion.name === 'Participación') {
          const participationDates = Object.keys(participations);
          const totalClasses = participationDates.length;
          if (totalClasses > 0) {
              const participatedClasses = participationDates.filter(date => participations[date]?.[studentId]).length;
              const participationScore = (participatedClasses / totalClasses) * 10;
              finalGrade += participationScore * (criterion.weight / 100);
          }
      } else {
        if (!studentGrades) continue;
        const gradeDetail = studentGrades[criterion.id];
        const delivered = gradeDetail?.delivered ?? 0;
        const average = gradeDetail?.average ?? 0;
        const expected = criterion.expectedValue;

        if(expected > 0) {
            const criterionScore = (delivered / expected) * average;
            finalGrade += criterionScore * (criterion.weight / 100);
        }
      }
    }
    return parseFloat(finalGrade.toFixed(2));
  }, []);
  
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedGroups = localStorage.getItem('groups');
      const allGroups = storedGroups ? JSON.parse(storedGroups) : initialGroups;
      setGroups(allGroups);

      const currentGroup = allGroups.find((g: any) => g.id === groupId);
       if (!currentGroup) {
        setGroup(null);
        setIsLoading(false);
        return;
      }
      setGroup(currentGroup);
      // Set active group in localStorage
      localStorage.setItem('activeGroupId', groupId);
      localStorage.setItem('activeGroupName', currentGroup.subject);
       // Dispatch a storage event to notify other tabs/components
      window.dispatchEvent(new Event('storage'));


      const storedStudents = localStorage.getItem('students');
      if(storedStudents) {
        setAllStudents(JSON.parse(storedStudents));
      } else {
        setAllStudents(initialStudents);
      }
      
      const storedCriteria = localStorage.getItem(`criteria_${groupId}`);
      const localCriteria : EvaluationCriteria[] = storedCriteria ? JSON.parse(storedCriteria) : [];
      setEvaluationCriteria(localCriteria);

      const storedGrades = localStorage.getItem(`grades_${groupId}`);
      const localGrades: Grades = storedGrades ? JSON.parse(storedGrades) : {};

      const storedAttendance = localStorage.getItem('globalAttendance');
      const localAttendance: {[date: string]: {[studentId: string]: boolean}} = storedAttendance ? JSON.parse(storedAttendance) : {};

      const storedParticipations = localStorage.getItem(`participations_${groupId}`);
      const localParticipations: ParticipationRecord = storedParticipations ? JSON.parse(storedParticipations) : {};

      const riskLevels : {[studentId: string]: 'low' | 'medium' | 'high'} = {};
      
      const getStudentRiskLevel = (student: Student, criteria: EvaluationCriteria[], grades: Grades, attendance: {[date: string]: {[studentId: string]: boolean}}, participations: ParticipationRecord) => {
        const finalGrade = calculateFinalGrade(student.id, criteria, grades, participations);

        const totalDays = Object.keys(attendance).length;
        let absences = 0;
        if(totalDays > 0) {
            for(const date in attendance) {
                if(attendance[date][student.id] !== true) {
                    absences++;
                }
            }
        }
        const absencePercentage = totalDays > 0 ? (absences / totalDays) * 100 : 0;
        
        if (finalGrade < 7 || absencePercentage > 20) return 'high';
        if (finalGrade < 8 || absencePercentage > 10) return 'medium';
        return 'low';
      };

      currentGroup.students.forEach((s: Student) => {
          riskLevels[s.id] = getStudentRiskLevel(s, localCriteria, localGrades, localAttendance, localParticipations);
      });
      setStudentRiskLevels(riskLevels);


    } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        setGroups(initialGroups);
        setAllStudents(initialStudents);
        setGroup(null);
    } finally {
        setIsLoading(false);
    }
  }, [groupId, calculateFinalGrade]);

  const saveState = (newGroups: typeof initialGroups, newAllStudents: typeof initialStudents) => {
      setGroups(newGroups);
      localStorage.setItem('groups', JSON.stringify(newGroups));
      
      setAllStudents(newAllStudents);
      localStorage.setItem('students', JSON.stringify(newAllStudents));
  };

  const handleRemoveStudent = (studentId: string) => {
    if (!group) return;
    const newGroups = groups.map(g => {
        if (g.id === group!.id) {
            return { ...g, students: g.students.filter(s => s.id !== studentId) };
        }
        return g;
    });
    
    // We don't remove the student from the global list, just the group
    saveState(newGroups, allStudents);
    setGroup(newGroups.find(g => g.id === groupId) || null);
    toast({
        title: "Estudiante eliminado",
        description: "El estudiante ha sido quitado del grupo.",
    });
  };

  const handleDeleteGroup = () => {
    if (!group) return;
    const newGroups = groups.filter(g => g.id !== group.id);
    saveState(newGroups, allStudents);
    localStorage.removeItem(`criteria_${groupId}`);
    localStorage.removeItem(`grades_${groupId}`);
    localStorage.removeItem(`attendance_${groupId}`);
    localStorage.removeItem(`participations_${groupId}`);
    localStorage.removeItem('activeGroupId');
    localStorage.removeItem('activeGroupName');
     // Dispatch a storage event to notify other tabs/components
    window.dispatchEvent(new Event('storage'));
    toast({
        title: 'Grupo Eliminado',
        description: `El grupo "${group.subject}" ha sido eliminado.`,
    });
    router.push('/groups');
  };
  
  const handleAddStudents = () => {
    if (!group) return;

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
    }));

    const updatedAllStudents = [...allStudents];
    newStudents.forEach(newStudent => {
        if (!updatedAllStudents.some(s => s.id === newStudent.id)) {
            updatedAllStudents.push(newStudent);
        }
    });

    const newGroups = groups.map(g => {
        if (g.id === group.id) {
            const groupStudentIds = new Set(g.students.map(s => s.id));
            const studentsToAdd = newStudents.filter(s => !groupStudentIds.has(s.id));
            return { ...g, students: [...g.students, ...studentsToAdd] };
        }
        return g;
    });

    saveState(newGroups, updatedAllStudents);
    setGroup(newGroups.find(g => g.id === groupId) || null);
    
    setBulkNames('');
    setBulkEmails('');
    setBulkPhones('');
    setBulkTutorNames('');
    setBulkTutorPhones('');
    setIsAddStudentDialogOpen(false);
    toast({
        title: "Estudiantes agregados",
        description: `${newStudents.length} estudiante(s) han sido añadidos al grupo.`
    });
  };

  const handleSelectStudent = (studentId: string, isChecked: boolean, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      const shiftKey = event.nativeEvent.shiftKey;
      const studentList = group?.students || [];

      if (shiftKey && lastSelectedStudentId) {
          const lastIndex = studentList.findIndex(s => s.id === lastSelectedStudentId);
          const currentIndex = studentList.findIndex(s => s.id === studentId);

          if (lastIndex !== -1 && currentIndex !== -1) {
              const start = Math.min(lastIndex, currentIndex);
              const end = Math.max(lastIndex, currentIndex);
              const rangeIds = studentList.slice(start, end + 1).map(s => s.id);

              setSelectedStudents(prevSelected => {
                  const newSelected = new Set(prevSelected);
                  const shouldSelect = !prevSelected.includes(studentId);
                  rangeIds.forEach(id => {
                      if (shouldSelect) {
                          newSelected.add(id);
                      } else {
                          newSelected.delete(id);
                      }
                  });
                  return Array.from(newSelected);
              });
          }
      } else {
          setSelectedStudents(prev =>
              isChecked ? [...prev, studentId] : prev.filter(id => id !== studentId)
          );
      }
      setLastSelectedStudentId(studentId);
  };
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
      if(checked && group) {
          setSelectedStudents(group.students.map(s => s.id));
      } else {
          setSelectedStudents([]);
      }
      setLastSelectedStudentId(null);
  };
  
  const handleDeleteSelectedStudents = () => {
    if (!group) return;
    const newGroups = groups.map(g => {
        if (g.id === group.id) {
            return { ...g, students: g.students.filter(s => !selectedStudents.includes(s.id)) };
        }
        return g;
    });
    
    saveState(newGroups, allStudents);
    setGroup(newGroups.find(g => g.id === groupId) || null);

    toast({
        title: "Estudiantes eliminados",
        description: `${selectedStudents.length} estudiante(s) han sido quitados del grupo.`,
    });
    setSelectedStudents([]);
    setLastSelectedStudentId(null);
  };

  const handleCancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedStudents([]);
    setLastSelectedStudentId(null);
  }

    
  const totalWeight = useMemo(() => {
    return evaluationCriteria.reduce((sum, c) => sum + c.weight, 0);
  }, [evaluationCriteria]);

  const numSelected = selectedStudents.length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!group) {
    notFound();
  }
  
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
         <div className="flex items-center gap-2">
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Opciones del Grupo</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar Grupo</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el grupo y todos sus datos asociados (criterios, calificaciones, etc.).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteGroup}>Sí, eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
         </div>
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
                <div className="flex items-center gap-2">
                    {isSelectionMode ? (
                        <>
                            <Button variant="outline" size="sm" onClick={handleCancelSelectionMode} className="gap-1">
                                <X className="h-3.5 w-3.5" />
                                Cancelar
                            </Button>
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
                                            <AlertDialogTitle>¿Eliminar {numSelected} estudiante(s)?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. Se quitarán los estudiantes seleccionados de este grupo, pero no se eliminarán de la lista general de estudiantes.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteSelectedStudents}>Sí, eliminar del grupo</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </>
                    ) : (
                       <Button variant="outline" size="sm" onClick={() => setIsSelectionMode(true)}>
                            Seleccionar Estudiantes
                        </Button>
                    )}
                    <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                        <UserPlus className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Agregar Estudiantes
                        </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                        <DialogTitle>Agregar Nuevos Estudiantes al Grupo</DialogTitle>
                        <DialogDescription>
                            Añade nuevos estudiantes a "{group.subject}". Pega columnas de datos para agregarlos en masa.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
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
                        <Button variant="outline" onClick={() => setIsAddStudentDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddStudents} disabled={!bulkNames.trim()}>Agregar Estudiantes</Button>
                        </DialogFooter>
                    </DialogContent>
                    </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isSelectionMode && (
                        <TableHead padding="checkbox">
                            <Checkbox
                                checked={group.students.length > 0 && numSelected === group.students.length ? true : (numSelected > 0 ? 'indeterminate' : false)}
                                onCheckedChange={(checked) => handleSelectAll(checked)}
                                aria-label="Seleccionar todo"
                            />
                        </TableHead>
                    )}
                    <TableHead>#</TableHead>
                    <TableHead className="hidden w-[100px] sm:table-cell">
                      <span className="sr-only">Foto</span>
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Nivel de Riesgo</TableHead>
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.students.map((student, index) => {
                    const riskLevel = studentRiskLevels[student.id] || 'low';
                    return (
                        <TableRow key={student.id} data-state={selectedStudents.includes(student.id) && "selected"}>
                          {isSelectionMode && (
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedStudents.includes(student.id)}
                                    onCheckedChange={(checked, event: any) => handleSelectStudent(student.id, !!checked, event)}
                                    aria-label="Seleccionar fila"
                                />
                            </TableCell>
                          )}
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
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
                            <Link href={`/students/${student.id}`} className="hover:underline">
                                {student.name}
                            </Link>
                        </TableCell>
                        <TableCell>
                            {riskLevel === 'high' && (
                            <Badge variant="destructive">Alto</Badge>
                            )}
                            {riskLevel === 'medium' && (
                            <Badge
                                variant="secondary"
                                className="bg-amber-400 text-black"
                            >
                                Medio
                            </Badge>
                            )}
                            {riskLevel === 'low' && (
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
                                <DropdownMenuItem onClick={() => router.push(`/students/${student.id}`)}>Ver Perfil Completo</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRemoveStudent(student.id)} className="text-destructive">
                                Quitar del Grupo
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    )
                  })}
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
                <CardTitle>Acciones del Grupo</CardTitle>
                <CardDescription>
                    Gestiona la asistencia, criterios de evaluación y calificaciones.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Button asChild variant="outline">
                    <Link href={`/attendance`}>
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Tomar Asistencia
                    </Link>
                </Button>
                 <Button asChild variant="outline">
                    <Link href={`/participations`}>
                        <PenSquare className="mr-2 h-4 w-4" />
                        Registrar Participaciones
                    </Link>
                </Button>
                 <Button asChild variant="outline">
                    <Link href={`/groups/${group.id}/criteria`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Gestionar Criterios
                    </Link>
                </Button>
                 <Button asChild>
                    <Link href={`/groups/${group.id}/grades`}>
                        <FilePen className="mr-2 h-4 w-4" />
                        Registrar Calificaciones
                    </Link>
                </Button>
            </CardContent>
            <CardHeader className="pt-0">
                <CardTitle className="text-lg">Resumen de Criterios</CardTitle>
                <CardDescription>Peso total: {totalWeight}%</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2">
                    {evaluationCriteria.map(criterion => (
                        <div key={criterion.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <div>
                                <span className="font-medium">{criterion.name}</span>
                                <p className="text-xs text-muted-foreground">
                                  {criterion.name === 'Participación' 
                                    ? 'Automático por participación' 
                                    : `${criterion.expectedValue} es el valor esperado`
                                  }
                                </p>
                            </div>
                            <Badge variant="secondary">{criterion.weight}%</Badge>
                        </div>
                    ))}
                    {evaluationCriteria.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground py-4">No has definido criterios.</p>
                    )}
                     {totalWeight > 100 && (
                        <div className="text-center text-sm font-bold text-destructive pt-2">
                            Total: {totalWeight}% (Sobrepasa el 100%)
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
