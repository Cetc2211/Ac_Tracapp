
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Edit, Mail, Phone, User, Save, Contact, CalendarDays, TrendingUp, BookText, EyeOff, Printer, FileText } from 'lucide-react';
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
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

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

type StudentStats = {
  averageGrade: number;
  attendance: { p: number, a: number, l: number, total: number };
  gradesByGroup: { group: string, grade: number }[];
};


export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [observations, setObservations] = useState<StudentObservation[]>([]);
  const { toast } = useToast();
  
  const calculateFinalGrade = useCallback((studentId: string, criteria: EvaluationCriteria[], grades: Grades, participations: ParticipationRecord) => {
    if (!criteria || criteria.length === 0) return 0;
    
    let finalGrade = 0;
    for (const criterion of criteria) {
      let performanceRatio = 0;

      if(criterion.name === 'Participación') {
          const participationDates = Object.keys(participations);
          if (participationDates.length > 0) {
            const participatedClasses = participationDates.filter(date => participations[date]?.[studentId]).length;
            performanceRatio = participatedClasses / participationDates.length;
          }
      } else {
          const gradeDetail = grades[studentId]?.[criterion.id];
          const delivered = gradeDetail?.delivered ?? 0;
          const expected = criterion.expectedValue;
          if(expected > 0) {
            performanceRatio = delivered / expected;
          }
      }
      finalGrade += performanceRatio * criterion.weight;
    }
    return finalGrade > 100 ? 100 : finalGrade;
  }, []);


  useEffect(() => {
    if (!studentId) return;
    try {
      const storedStudents: Student[] = JSON.parse(localStorage.getItem('students') || '[]');
      const currentStudent = storedStudents.find(s => s.id === studentId);
      setStudent(currentStudent || null);

      if (currentStudent) {
        const storedGroups: Group[] = JSON.parse(localStorage.getItem('groups') || '[]');
        const activeGroupId = localStorage.getItem('activeGroupId');
        
        const gradesByGroup: { group: string, grade: number }[] = [];
        let totalGradeSum = 0;
        let groupCount = 0;
        
        const studentGroups = storedGroups.filter(g => g.students.some(s => s.id === studentId));

        studentGroups.forEach(group => {
            const criteria: EvaluationCriteria[] = JSON.parse(localStorage.getItem(`criteria_${group.id}`) || '[]');
            const grades: Grades = JSON.parse(localStorage.getItem(`grades_${group.id}`) || '{}');
            const participations: ParticipationRecord = JSON.parse(localStorage.getItem(`participations_${group.id}`) || '{}');
            const finalGrade = calculateFinalGrade(studentId, criteria, grades, participations);
            gradesByGroup.push({ group: group.subject, grade: finalGrade });
            totalGradeSum += finalGrade;
            groupCount++;
        });

        let attendanceStats = { p: 0, a: 0, l: 0, total: 0 };
        if (activeGroupId) {
          const attendance: DailyAttendance = JSON.parse(localStorage.getItem(`attendance_${activeGroupId}`) || '{}');
          Object.values(attendance).forEach(record => {
            const status = record[studentId];
            if (status === 'present') attendanceStats.p++;
            else if (status === 'absent') attendanceStats.a++;
            else if (status === 'late') attendanceStats.l++;
          });
          attendanceStats.total = Object.keys(attendance).length;
        }

        const observations: StudentObservation[] = JSON.parse(localStorage.getItem(`observations_${studentId}`) || '[]');
        setObservations(observations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        setStudentStats({
          averageGrade: groupCount > 0 ? totalGradeSum / groupCount : 0,
          attendance: attendanceStats,
          gradesByGroup,
        });
      }
    } catch (error) {
      console.error("Failed to load student data from localStorage", error);
      setStudent(null);
    }
  }, [studentId, calculateFinalGrade]);
  
  if (!student) {
    return notFound();
  }

  const attendanceRate = studentStats && studentStats.attendance.total > 0 
    ? (studentStats.attendance.p / studentStats.attendance.total) * 100
    : 0;

  
  return (
    <div className="flex flex-col gap-6">
       <Card className="bg-accent/50">
          <CardHeader>
            <div className="flex items-center gap-4">
               <div className="bg-background p-3 rounded-full">
                  <User className="h-8 w-8 text-primary" />
               </div>
               <div>
                  <h1 className="text-2xl font-bold">{student.name}</h1>
                  <p className="text-muted-foreground">Informe completo con perfil del estudiante, calificaciones detalladas y asistencia.</p>
               </div>
            </div>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                   <Link href="/students"><EyeOff /> Ocultar Perfil</Link>
                </Button>
                <Button variant="outline"><Printer /> Formato Impresión</Button>
                <Button variant="outline"><FileText /> Ver Informe Texto</Button>
             </div>
          </CardContent>
       </Card>
      
      <h2 className="text-xl font-bold text-center">Informe Individual del Estudiante</h2>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                     <div className="flex items-center gap-4">
                        <User className="h-8 w-8 text-primary"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Nombre Completo:</p>
                            <p className="font-semibold">{student.name}</p>
                        </div>
                     </div>
                      <div className="flex items-center gap-4">
                        <Mail className="h-8 w-8 text-primary"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Email:</p>
                            <p className="font-semibold">{student.email || 'No registrado'}</p>
                        </div>
                     </div>
                      <div className="flex items-center gap-4">
                        <Contact className="h-8 w-8 text-primary"/>
                        <div>
                            <p className="text-sm text-muted-foreground">ID de Estudiante:</p>
                            <p className="font-semibold">{student.id}</p>
                        </div>
                     </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Resumen de Calificaciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {studentStats?.gradesByGroup.map(item => (
                            <div key={item.group} className="flex justify-between items-center p-3 rounded-md border">
                                <p>{item.group}</p>
                                <Badge variant="secondary">{item.grade.toFixed(2)}</Badge>
                            </div>
                        ))}
                        {studentStats && studentStats.gradesByGroup.length > 0 && (
                             <div className="flex justify-between items-center p-3 rounded-md bg-green-100 border-green-300">
                                <p className="font-bold text-green-800">Promedio Semestral:</p>
                                <Badge className="text-lg bg-green-600">{studentStats.averageGrade.toFixed(2)}</Badge>
                            </div>
                        )}
                         {studentStats?.gradesByGroup.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4">No hay calificaciones registradas.</p>
                         )}
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Asistencia</CardTitle>
                    <CardDescription>Para el grupo activo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between p-2 border-b"><span>Total de Clases:</span> <span className="font-bold">{studentStats?.attendance.total || 0}</span></div>
                    <div className="flex justify-between p-2 rounded-md bg-green-100"><span>Presente:</span> <span className="font-bold">{studentStats?.attendance.p || 0}</span></div>
                    <div className="flex justify-between p-2 rounded-md bg-yellow-100"><span>Tarde:</span> <span className="font-bold">{studentStats?.attendance.l || 0}</span></div>
                    <div className="flex justify-between p-2 rounded-md bg-red-100"><span>Ausente:</span> <span className="font-bold">{studentStats?.attendance.a || 0}</span></div>
                    <div className="flex justify-between items-center p-3 rounded-md bg-blue-100 mt-2">
                        <p className="font-bold text-blue-800">Tasa de Asistencia:</p>
                        <Badge className="text-lg bg-blue-600">{attendanceRate.toFixed(1)}%</Badge>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Bitácora de Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                     {observations.length > 0 ? (
                        <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                            {observations.map(obs => (
                                <div key={obs.id} className="border-l-4 pl-3 py-1" style={{borderColor: obs.type === 'Mérito' ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}}>
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-sm">{obs.type}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(obs.date), "dd/MM/yy", { locale: es })}</p>
                                    </div>
                                    <p className="text-xs mt-1">{obs.details}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">No hay observaciones.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
