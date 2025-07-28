
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Student, Group, StudentObservation } from '@/lib/placeholder-data';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Mail, User, Contact, EyeOff, Printer, FileText, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
};

type GradeDetail = {
  delivered: number | null;
};

type Grades = {
  [studentId: string]: {
    [criterionId: string]: GradeDetail;
  };
};

type GlobalAttendanceRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

type ParticipationRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

type StudentStats = {
  averageGrade: number;
  attendance: { p: number, a: number, total: number };
  gradesByGroup: { group: string, grade: number }[];
};


export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const router = useRouter();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [observations, setObservations] = useState<StudentObservation[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
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
    if (!studentId) {
        setIsLoading(false);
        return;
    };
    try {
      const storedStudents: Student[] = JSON.parse(localStorage.getItem('students') || '[]');
      const currentStudent = storedStudents.find(s => s.id === studentId);
      
      if (currentStudent) {
        setStudent(currentStudent);
        const storedGroups: Group[] = JSON.parse(localStorage.getItem('groups') || '[]');
        const studentGroups = storedGroups.filter(g => g.students.some(s => s.id === studentId));

        const gradesByGroup: { group: string, grade: number }[] = [];
        let totalGradeSum = 0;
        
        studentGroups.forEach(group => {
            const criteria: EvaluationCriteria[] = JSON.parse(localStorage.getItem(`criteria_${group.id}`) || '[]');
            const grades: Grades = JSON.parse(localStorage.getItem(`grades_${group.id}`) || '{}');
            const participations: ParticipationRecord = JSON.parse(localStorage.getItem(`participations_${group.id}`) || '{}');
            const finalGrade = calculateFinalGrade(studentId, criteria, grades, participations);
            gradesByGroup.push({ group: group.subject, grade: finalGrade });
            totalGradeSum += finalGrade;
        });

        let attendanceStats = { p: 0, a: 0, total: 0 };
        
        const globalAttendance: GlobalAttendanceRecord = JSON.parse(localStorage.getItem('globalAttendance') || '{}');
        const allDates = Object.keys(globalAttendance);
        
        allDates.forEach(date => {
            if (globalAttendance[date]?.[studentId] !== undefined) {
                attendanceStats.total++;
                if (globalAttendance[date][studentId]) attendanceStats.p++;
                else attendanceStats.a++;
            }
        });
        
        const observations: StudentObservation[] = JSON.parse(localStorage.getItem(`observations_${studentId}`) || '[]');
        setObservations(observations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        setStudentStats({
          averageGrade: studentGroups.length > 0 ? totalGradeSum / studentGroups.length : 0,
          attendance: attendanceStats,
          gradesByGroup,
        });
      }
    } catch (error) {
      console.error("Failed to load student data from localStorage", error);
      toast({ variant: 'destructive', title: 'Error al cargar datos', description: 'No se pudo cargar la información del estudiante.'})
    } finally {
        setIsLoading(false);
    }
  }, [studentId, calculateFinalGrade, toast]);
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando perfil...</span>
        </div>
    );
  }

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
                <Button variant="outline" onClick={() => router.back()}>
                   <EyeOff className="mr-2 h-4 w-4" /> Ocultar Perfil
                </Button>
                <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Formato Impresión</Button>
                <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Ver Informe Texto</Button>
             </div>
          </CardContent>
       </Card>
      
      <h2 className="text-xl font-bold text-center">Informe Individual del Estudiante</h2>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center gap-8">
                     <div className="flex-shrink-0 w-48 h-48">
                        <Image
                            alt="Avatar"
                            className="rounded-full aspect-square object-cover"
                            height={192}
                            src={student.photo}
                            data-ai-hint="student avatar"
                            width={192}
                        />
                     </div>
                     <div className="flex-grow space-y-6">
                        <div className="flex items-center gap-4">
                            <User className="h-8 w-8 text-primary"/>
                            <div>
                                <p className="text-sm text-muted-foreground">Nombre Completo:</p>
                                <p className="font-semibold text-lg">{student.name}</p>
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
                     </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen de Calificaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {studentStats?.gradesByGroup.map(item => (
                                <div key={item.group} className="flex justify-between items-center p-3 rounded-md border">
                                    <p>{item.group}</p>
                                    <Badge variant={item.grade >= 70 ? "default" : "destructive"} className="text-base">{item.grade.toFixed(1)}%</Badge>
                                </div>
                            ))}
                            {studentStats && studentStats.gradesByGroup.length > 0 && (
                                <div className="flex justify-between items-center p-3 rounded-md bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-700">
                                    <p className="font-bold text-green-800 dark:text-green-300">Promedio Semestral:</p>
                                    <Badge className="text-lg bg-green-600 hover:bg-green-600">{studentStats.averageGrade.toFixed(1)}%</Badge>
                                </div>
                            )}
                            {studentStats?.gradesByGroup.length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-4">No hay calificaciones registradas.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Historial de Asistencia</CardTitle>
                        <CardDescription>Resumen de todos los grupos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between p-2 border-b"><span>Total de Clases Registradas:</span> <span className="font-bold">{studentStats?.attendance.total || 0}</span></div>
                        <div className="flex justify-between p-2 rounded-md bg-green-100 dark:bg-green-900/50"><span>Presente:</span> <span className="font-bold">{studentStats?.attendance.p || 0}</span></div>
                        <div className="flex justify-between p-2 rounded-md bg-red-100 dark:bg-red-900/50"><span>Ausente:</span> <span className="font-bold">{studentStats?.attendance.a || 0}</span></div>
                        <div className="flex justify-between items-center p-3 rounded-md bg-blue-100 dark:bg-blue-900/50 mt-2">
                            <p className="font-bold text-blue-800 dark:text-blue-300">Tasa de Asistencia:</p>
                            <Badge className="text-lg bg-blue-600 hover:bg-blue-600">{attendanceRate.toFixed(1)}%</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
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
