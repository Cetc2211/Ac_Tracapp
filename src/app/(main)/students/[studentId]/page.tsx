
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { students as initialStudents, Student, Group, StudentObservation } from '@/lib/placeholder-data';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Edit, Mail, Phone, User, Save, Contact, CalendarDays, TrendingUp, BookText } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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


export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const [studentStats, setStudentStats] = useState<{level: 'low' | 'medium' | 'high', reason: string, averageGrade: number, attendance: {[groupId: string]: {p:number, a:number, l:number, total: number}}} | null>(null);
  const [observations, setObservations] = useState<StudentObservation[]>([]);
  const { toast } = useToast();
  
  const calculateFinalGrade = useCallback((studentId: string, groupId: string, criteria: EvaluationCriteria[], grades: Grades) => {
    if (!grades || !criteria || criteria.length === 0) return 0;
    const studentGrades = grades[studentId];
    if (!studentGrades) return 0;
    
    let finalGrade = 0;
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

  const getStudentStats = useCallback((currentStudent: Student | null) => {
    if (!currentStudent) return;

    let allGroups : Group[] = [];
    try {
      const storedGroups = localStorage.getItem('groups');
      allGroups = storedGroups ? JSON.parse(storedGroups) : [];
    } catch(e) {
      console.error(e);
    }
    const studentGroups = allGroups.filter(g => g.students.some(s => s.id === currentStudent.id));

    if (studentGroups.length === 0) {
        setStudentStats({level: 'low', reason: 'No está en grupos.', averageGrade: 0, attendance: {}});
        return;
    };
    
    let totalGrades = 0;
    let gradeSum = 0;
    let maxAbsencePercentage = 0;
    const attendanceStats: {[groupId: string]: {p:number, a:number, l:number, total: number}} = {};

    for(const group of studentGroups) {
      const criteriaKey = `criteria_${group.id}`;
      const gradesKey = `grades_${group.id}`;
      const attendanceKey = `attendance_${group.id}`;

      const storedCriteria = localStorage.getItem(criteriaKey);
      const evaluationCriteria: EvaluationCriteria[] = storedCriteria ? JSON.parse(storedCriteria) : [];

      const storedGrades = localStorage.getItem(gradesKey);
      const grades: Grades = storedGrades ? JSON.parse(storedGrades) : {};
      
      const finalGrade = calculateFinalGrade(currentStudent.id, group.id, evaluationCriteria, grades);
      gradeSum += finalGrade;
      totalGrades++;

      
      const storedAttendance = localStorage.getItem(attendanceKey);
      const groupAttendance: DailyAttendance = storedAttendance ? JSON.parse(storedAttendance) : {};
      
      const totalDays = Object.keys(groupAttendance).length;
      let presents = 0;
      let absences = 0;
      let lates = 0;

      if (totalDays > 0) {
          for(const date in groupAttendance) {
              const status = groupAttendance[date][currentStudent.id];
              if(status === 'present') presents++;
              else if(status === 'absent') absences++;
              else if(status === 'late') lates++;
          }
          const absencePercentage = (absences / totalDays) * 100;
          if(absencePercentage > maxAbsencePercentage) {
              maxAbsencePercentage = absencePercentage;
          }
      }
      attendanceStats[group.id] = {p: presents, a: absences, l: lates, total: totalDays};
    }

    const averageGrade = totalGrades > 0 ? gradeSum / totalGrades : 10;
    let level: 'low' | 'medium' | 'high' = 'low';
    let reason = `Promedio de ${averageGrade.toFixed(1)} y ${maxAbsencePercentage.toFixed(0)}% de ausencias.`;

    if (averageGrade < 7 || maxAbsencePercentage > 20) {
        level = 'high';
        reason = `Promedio de ${averageGrade.toFixed(1)} o ${maxAbsencePercentage.toFixed(0)}% de ausencias.`;
    } else if (averageGrade < 8 || maxAbsencePercentage > 10) {
       level = 'medium';
       reason = `Promedio de ${averageGrade.toFixed(1)} o ${maxAbsencePercentage.toFixed(0)}% de ausencias.`;
    }
    
    setStudentStats({level, reason, averageGrade, attendance: attendanceStats });
  }, [calculateFinalGrade]);

  useEffect(() => {
    try {
      const storedStudents = localStorage.getItem('students');
      const studentsList: Student[] = storedStudents ? JSON.parse(storedStudents) : initialStudents;
      setAllStudents(studentsList);
      
      const currentStudent = studentsList.find((s: Student) => s.id === studentId);
      setStudent(currentStudent || null);
      setEditingStudent(currentStudent || null);

      const storedGroups = localStorage.getItem('groups');
      const allGroups: Group[] = storedGroups ? JSON.parse(storedGroups) : [];
      const studentGroups = allGroups.filter((g: Group) => 
        g.students.some(s => s.id === studentId)
      );
      setGroups(studentGroups);

      const observationsKey = `observations_${studentId}`;
      const storedObservations = localStorage.getItem(observationsKey);
      const studentObservations: StudentObservation[] = storedObservations ? JSON.parse(storedObservations) : [];
      setObservations(studentObservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      
      getStudentStats(currentStudent);

    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      setStudent(null);
    }
  }, [studentId, getStudentStats]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (editingStudent) {
      setEditingStudent((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSave = () => {
    if (!editingStudent || !editingStudent.name) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'El nombre del estudiante es obligatorio.',
        });
        return;
    }
    
    const updatedStudents = allStudents.map(s => s.id === editingStudent.id ? {...s, ...editingStudent} as Student : s);
    
    const storedGroups = localStorage.getItem('groups');
    let allGroups: Group[] = storedGroups ? JSON.parse(storedGroups) : [];
    
    const updatedGroups = allGroups.map(g => ({
        ...g,
        students: g.students.map(s => s.id === editingStudent.id ? {...s, ...editingStudent} as Student : s)
    }));

    setAllStudents(updatedStudents);
    setStudent(editingStudent as Student);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    localStorage.setItem('groups', JSON.stringify(updatedGroups));
    
    toast({
      title: 'Estudiante Actualizado',
      description: 'La información del estudiante ha sido guardada.',
    });
    setIsEditDialogOpen(false);
  };
  
  if (!student) {
    return null; // or a loading spinner
  }
  
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft />
              <span className="sr-only">Volver</span>
            </Button>
            <div>
            <h1 className="text-3xl font-bold">Perfil del Estudiante</h1>
            <p className="text-muted-foreground">
                Información detallada de {student.name}.
            </p>
            </div>
         </div>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Perfil
              </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Estudiante</DialogTitle>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre*</Label>
                        <Input id="name" className="col-span-3" value={editingStudent?.name || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" className="col-span-3" value={editingStudent?.email || ''} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Teléfono</Label>
                        <Input id="phone" type="tel" className="col-span-3" value={editingStudent?.phone || ''} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tutorName" className="text-right">Tutor</Label>
                        <Input id="tutorName" className="col-span-3" value={editingStudent?.tutorName || ''} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tutorPhone" className="text-right">Tel. Tutor</Label>
                        <Input id="tutorPhone" type="tel" className="col-span-3" value={editingStudent?.tutorPhone || ''} onChange={handleInputChange} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader className="flex items-center flex-row gap-4">
                    <Image
                        src={student.photo}
                        alt={student.name}
                        width={80}
                        height={80}
                        className="rounded-full"
                    />
                    <div>
                        <CardTitle className="text-2xl">{student.name}</CardTitle>
                        <CardDescription>ID: {student.id}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        {studentStats?.level === 'high' && <Badge variant="destructive" className="text-md">Alto Riesgo</Badge>}
                        {studentStats?.level === 'medium' && <Badge variant="secondary" className="bg-amber-400 text-black text-md">Riesgo Medio</Badge>}
                        {studentStats?.level === 'low' && <Badge variant="secondary" className="text-md">Riesgo Bajo</Badge>}
                        <p className="text-xs text-muted-foreground mt-1">{studentStats?.reason}</p>
                     </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{student.email || "No registrado"}</span>
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{student.phone || "No registrado"}</span>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Contact className="h-5 w-5"/>
                        Información del Tutor
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{student.tutorName || "No registrado"}</span>
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{student.tutorPhone || "No registrado"}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Rendimiento Académico</CardTitle>
                    <CardDescription>Calificaciones finales y resumen de asistencia en los grupos inscritos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Grupo</TableHead>
                                <TableHead className="text-center">Asistencia</TableHead>
                                <TableHead className="text-right">Calificación Final</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups.map(group => {
                                const storedCriteria = localStorage.getItem(`criteria_${group.id}`);
                                const evaluationCriteria: EvaluationCriteria[] = storedCriteria ? JSON.parse(storedCriteria) : [];

                                const storedGrades = localStorage.getItem(`grades_${group.id}`);
                                const grades: Grades = storedGrades ? JSON.parse(storedGrades) : {};
                                
                                return (
                                <TableRow key={group.id}>
                                    <TableCell>{group.subject}</TableCell>
                                    <TableCell className="text-center text-xs">
                                        {studentStats?.attendance[group.id] ? 
                                        `P: ${studentStats.attendance[group.id].p} / A: ${studentStats.attendance[group.id].a} / R: ${studentStats.attendance[group.id].l}`
                                        : 'N/A'
                                        }
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-lg">{calculateFinalGrade(student.id, group.id, evaluationCriteria, grades)}</TableCell>
                                </TableRow>
                                )
                            })}
                            {groups.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">El estudiante no está en ningún grupo.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookText /> Bitácora de Observaciones</CardTitle>
                    <CardDescription>Historial de observaciones de conducta y seguimiento.</CardDescription>
                </CardHeader>
                <CardContent>
                    {observations.length > 0 ? (
                        <div className="space-y-4">
                            {observations.map(obs => (
                                <div key={obs.id} className="border-l-4 pl-4 py-2" style={{borderColor: obs.type === 'Mérito' ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}}>
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{obs.type}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(obs.date), "PPP", { locale: es })}</p>
                                    </div>
                                    <p className="text-sm mt-1">{obs.details}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-8">No hay observaciones registradas para este estudiante.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
