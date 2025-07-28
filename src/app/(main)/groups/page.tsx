
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
import { Textarea } from '@/components/ui/textarea';
import { groups as initialGroups, students as initialStudents, Student, Group } from '@/lib/placeholder-data';
import { Users, ClipboardList, PlusCircle, BookCopy, Settings, AlertTriangle } from 'lucide-react';
import { AttendanceRandomizer } from '@/components/attendance-randomizer';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

type GroupStats = {
  average: number;
  highRiskCount: number;
}

const cardColors = [
    'bg-card-1',
    'bg-card-2',
    'bg-card-3',
    'bg-card-4',
    'bg-card-5',
];


export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>(initialStudents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [bulkNames, setBulkNames] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkPhones, setBulkPhones] = useState('');
  const [bulkTutorNames, setBulkTutorNames] = useState('');
  const [bulkTutorPhones, setBulkTutorPhones] = useState('');

  const { toast } = useToast();
  const [groupStats, setGroupStats] = useState<{[groupId: string]: GroupStats}>({});

  const calculateFinalGrade = useCallback((studentId: string, criteria: EvaluationCriteria[], grades: Grades) => {
    if (!criteria || criteria.length === 0 || !grades || !grades[studentId]) return 0;
    
    let finalGrade = 0;
    const studentGrades = grades[studentId];
    if (!studentGrades) return 0;
    
    for (const criterion of criteria) {
      const gradeDetail = studentGrades[criterion.id];
      const delivered = gradeDetail?.delivered ?? 0;
      const average = gradeDetail?.average ?? 0;
      const expected = criterion.expectedValue;

      if(expected > 0) {
        const criterionScore = (delivered / expected) * average;
        finalGrade += criterionScore * (criterion.weight / 100);
      }
    }
    return parseFloat(finalGrade.toFixed(2));
  }, []);

  const getStudentRiskLevel = useCallback((student: Student, criteria: EvaluationCriteria[], grades: Grades, attendance: DailyAttendance) => {
    const finalGrade = calculateFinalGrade(student.id, criteria, grades);

    const totalDays = Object.keys(attendance).length;
    let absences = 0;
    if(totalDays > 0) {
        for(const date in attendance) {
            if(attendance[date][student.id] === 'absent') {
                absences++;
            }
        }
    }
    const absencePercentage = totalDays > 0 ? (absences / totalDays) * 100 : 0;
    
    if (finalGrade < 7 || absencePercentage > 20) return 'high';
    if (finalGrade < 8 || absencePercentage > 10) return 'medium';
    return 'low';
  }, [calculateFinalGrade]);

  useEffect(() => {
    try {
        const storedGroups = localStorage.getItem('groups');
        const loadedGroups = storedGroups ? JSON.parse(storedGroups) : initialGroups;
        setGroups(loadedGroups);

        const storedStudents = localStorage.getItem('students');
        const loadedStudents = storedStudents ? JSON.parse(storedStudents) : initialStudents;
        setAllStudents(loadedStudents);
        
        const allStats: {[groupId: string]: GroupStats} = {};

        for(const group of loadedGroups) {
            const criteriaKey = `criteria_${group.id}`;
            const gradesKey = `grades_${group.id}`;
            const attendanceKey = `attendance_${group.id}`;

            const storedCriteria = localStorage.getItem(criteriaKey);
            const evaluationCriteria: EvaluationCriteria[] = storedCriteria ? JSON.parse(storedCriteria) : [];

            const storedGrades = localStorage.getItem(gradesKey);
            const grades: Grades = storedGrades ? JSON.parse(storedGrades) : {};

            const storedAttendance = localStorage.getItem(attendanceKey);
            const attendance: DailyAttendance = storedAttendance ? JSON.parse(storedAttendance) : {};

            const groupGrades = group.students.map(s => calculateFinalGrade(s.id, evaluationCriteria, grades));
            const groupAverage = groupGrades.length > 0 ? groupGrades.reduce((a, b) => a + b, 0) / groupGrades.length : 0;
            const highRiskStudents = group.students.filter(s => getStudentRiskLevel(s, evaluationCriteria, grades, attendance) === 'high').length;
            
            allStats[group.id] = {
                average: groupAverage,
                highRiskCount: highRiskStudents
            };
        }
        setGroupStats(allStats);

    } catch(e) {
        console.error("Could not parse data from local storage", e);
        setGroups(initialGroups);
        setAllStudents(initialStudents);
    }
  }, [calculateFinalGrade, getStudentRiskLevel]);
  

  const saveState = (newGroups: Group[], newAllStudents: Student[]) => {
    setGroups(newGroups);
    localStorage.setItem('groups', JSON.stringify(newGroups));

    setAllStudents(newAllStudents);
    localStorage.setItem('students', JSON.stringify(newAllStudents));
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

    const names = bulkNames.trim().split('\n').filter(name => name);
    const emails = bulkEmails.trim().split('\n');
    const phones = bulkPhones.trim().split('\n');
    const tutorNames = bulkTutorNames.trim().split('\n');
    const tutorPhones = bulkTutorPhones.trim().split('\n');
    
    const studentsForNewGroup: Student[] = names.map((name, index) => ({
      id: `S${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${index}`,
      name: name.trim(),
      email: emails[index]?.trim() || '',
      phone: phones[index]?.trim() || '',
      tutorName: tutorNames[index]?.trim() || '',
      tutorPhone: tutorPhones[index]?.trim() || '',
      photo: 'https://placehold.co/100x100.png',
    }));

    const newGroup: Group = {
        id: `G${Date.now()}`,
        subject: newGroupName,
        students: studentsForNewGroup
    };
    
    const updatedGroups = [...groups, newGroup];
    const updatedAllStudents = [...allStudents];
    studentsForNewGroup.forEach(newStudent => {
        if (!updatedAllStudents.some(s => s.id === newStudent.id)) {
            updatedAllStudents.push(newStudent);
        }
    });

    saveState(updatedGroups, updatedAllStudents);

    // Reset form
    setNewGroupName('');
    setBulkNames('');
    setBulkEmails('');
    setBulkPhones('');
    setBulkTutorNames('');
    setBulkTutorPhones('');
    setIsDialogOpen(false);

    toast({
        title: 'Grupo Creado',
        description: `El grupo "${newGroupName}" ha sido creado exitosamente.`
    });
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
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles para crear un nuevo grupo de asignatura y añade a sus estudiantes.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
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
                        <Label>Añadir Estudiantes al Grupo (Opcional)</Label>
                         <p className="text-sm text-muted-foreground">
                            Pega una columna de datos en cada campo. Asegúrate de que cada línea corresponda al mismo estudiante. Los estudiantes nuevos se crearán y añadirán al grupo.
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <Textarea className="lg:col-span-1" placeholder="Nombres* (uno por línea)" rows={5} value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} />
                            <Textarea className="lg:col-span-1" placeholder="Emails (opcional)" rows={5} value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} />
                            <Textarea className="lg:col-span-1" placeholder="Teléfonos (opcional)" rows={5} value={bulkPhones} onChange={(e) => setBulkPhones(e.target.value)} />
                            <Textarea className="lg:col-span-1" placeholder="Nombres Tutor (opcional)" rows={5} value={bulkTutorNames} onChange={(e) => setBulkTutorNames(e.target.value)} />
                            <Textarea className="lg:col-span-1" placeholder="Teléfonos Tutor (opcional)" rows={5} value={bulkTutorPhones} onChange={(e) => setBulkTutorPhones(e.target.value)} />
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
        {groups.map((group, index) => {
            const stats = groupStats[group.id] || { average: 0, highRiskCount: 0 };
            const colorClass = cardColors[index % cardColors.length];
            
            return (
              <Card key={group.id} className={cn("flex flex-col text-card-foreground-alt", colorClass)}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">{group.subject}</CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-2 text-card-foreground-alt/80">
                                <Users className="h-4 w-4" />
                                <span>{group.students.length} estudiantes</span>
                            </CardDescription>
                        </div>
                        <Button asChild variant="ghost" size="icon" className="text-card-foreground-alt hover:bg-white/20 hover:text-card-foreground-alt">
                            <Link href={`/groups/${group.id}`}>
                                <Settings className="h-5 w-5" />
                                 <span className="sr-only">Configurar</span>
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-sm space-y-2">
                    <div className='flex items-center gap-2'><span className='font-semibold'>Promedio Gral:</span> <span className={`font-bold`}>{stats.average.toFixed(1)}</span></div>
                    <div className='flex items-center gap-2'><span className='font-semibold'>Riesgo Alto:</span> <span className='font-bold flex items-center gap-1'>{stats.highRiskCount > 0 && <AlertTriangle className="h-4 w-4" />} {stats.highRiskCount}</span></div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <Button asChild variant="outline" className="bg-transparent border-card-foreground-alt/50 text-card-foreground-alt hover:bg-white/20 hover:text-card-foreground-alt">
                    <Link href={`/groups/${group.id}`}>
                      <ClipboardList className="mr-2 h-4 w-4" /> Detalles
                    </Link>
                  </Button>
                  <AttendanceRandomizer students={group.students} variant="outline" className="bg-transparent border-card-foreground-alt/50 text-card-foreground-alt hover:bg-white/20 hover:text-card-foreground-alt" />
                </CardFooter>
              </Card>
            )
        })}
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
