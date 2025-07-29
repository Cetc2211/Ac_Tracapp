
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
import { Badge } from '@/components/ui/badge';
import { Student, Group, StudentObservation } from '@/lib/placeholder-data';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Mail, User, Contact, EyeOff, Printer, FileText, Loader2, Phone, Wand2, Download } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { generateStudentFeedback } from '@/ai/flows/student-feedback';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


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

export type StudentStats = {
  averageGrade: number;
  attendance: { p: number, a: number, total: number };
  gradesByGroup: { group: string, grade: number, criteriaDetails: { name: string, earned: number, weight: number }[] }[];
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
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [generatedFeedback, setGeneratedFeedback] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);


  const calculateFinalGradeDetails = useCallback((studentId: string, criteria: EvaluationCriteria[], grades: Grades, participations: ParticipationRecord): { finalGrade: number; criteriaDetails: { name: string, earned: number, weight: number }[] } => {
    if (!criteria || criteria.length === 0) return { finalGrade: 0, criteriaDetails: [] };
    
    let finalGrade = 0;
    const criteriaDetails: { name: string, earned: number, weight: number }[] = [];

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
      const earnedPercentage = performanceRatio * criterion.weight;
      finalGrade += earnedPercentage;
      criteriaDetails.push({ name: criterion.name, earned: earnedPercentage, weight: criterion.weight });
    }
    
    return { finalGrade: finalGrade > 100 ? 100 : finalGrade, criteriaDetails };
  }, []);


  useEffect(() => {
    if (!studentId) {
        setIsLoading(false);
        return;
    };
    try {
      setIsLoading(true);
      const storedStudents: Student[] = JSON.parse(localStorage.getItem('students') || '[]');
      const currentStudent = storedStudents.find(s => s.id === studentId);
      
      if (currentStudent) {
        setStudent(currentStudent);
        const storedGroups: Group[] = JSON.parse(localStorage.getItem('groups') || '[]');
        const studentGroups = storedGroups.filter(g => g.students.some(s => s.id === studentId));

        const gradesByGroup: StudentStats['gradesByGroup'] = [];
        let totalGradeSum = 0;
        
        studentGroups.forEach(group => {
            const criteria: EvaluationCriteria[] = JSON.parse(localStorage.getItem(`criteria_${group.id}`) || '[]');
            const grades: Grades = JSON.parse(localStorage.getItem(`grades_${group.id}`) || '{}');
            const participations: ParticipationRecord = JSON.parse(localStorage.getItem(`participations_${group.id}`) || '{}');
            const { finalGrade, criteriaDetails } = calculateFinalGradeDetails(studentId, criteria, grades, participations);
            gradesByGroup.push({ group: group.subject, grade: finalGrade, criteriaDetails });
            totalGradeSum += finalGrade;
        });

        const attendanceStats = { p: 0, a: 0, total: 0 };
        const globalAttendance: GlobalAttendanceRecord = JSON.parse(localStorage.getItem('globalAttendance') || '[]');
        
        Object.keys(globalAttendance).forEach(date => {
            if (globalAttendance[date]?.[studentId] !== undefined) {
                attendanceStats.total++;
                if (globalAttendance[date]?.[studentId] === true) {
                    attendanceStats.p++;
                } else {
                    attendanceStats.a++;
                }
            }
        });

        const observations: StudentObservation[] = JSON.parse(localStorage.getItem(`observations_${studentId}`) || '[]');
        setObservations(observations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        setStudentStats({
          averageGrade: studentGroups.length > 0 ? totalGradeSum / studentGroups.length : 0,
          attendance: attendanceStats,
          gradesByGroup,
        });
      } else {
        setStudent(null);
      }
    } catch (error) {
      console.error("Failed to load student data from localStorage", error);
      toast({ variant: 'destructive', title: 'Error al cargar datos', description: 'No se pudo cargar la información del estudiante.'})
    } finally {
        setIsLoading(false);
    }
  }, [studentId, calculateFinalGradeDetails, toast]);
  
   const handleGenerateFeedback = async () => {
    if (!student || !studentStats) {
        toast({ variant: 'destructive', title: 'Datos no disponibles', description: 'Las estadísticas del estudiante aún no están listas.' });
        return;
    };
    setIsGeneratingFeedback(true);
    setGeneratedFeedback('');
    try {
      const input = {
        studentName: student.name,
        gradesByGroup: studentStats.gradesByGroup.map(g => ({ group: g.group, grade: g.grade })),
        attendance: studentStats.attendance,
        observations: observations.map(o => ({ type: o.type, details: o.details })),
      };
      const result = await generateStudentFeedback(input);
      setGeneratedFeedback(result.feedback);
    } catch (error) {
      console.error("Error generating feedback:", error);
      toast({
        variant: 'destructive',
        title: 'Error de IA',
        description: 'No se pudo generar la retroalimentación. Inténtalo de nuevo.',
      });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleDownloadPdf = () => {
    const input = reportRef.current;
    if (input) {
      toast({ title: 'Generando PDF...', description: 'Esto puede tardar un momento.' });
      html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth - 20; // with margin
        let imgHeight = imgWidth / ratio;
        
        let heightLeft = imgHeight;
        let position = 10; // top margin
        
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= (pdfHeight - 20);
        }
        
        pdf.save(`informe_${student?.name.replace(/\s+/g, '_') || 'estudiante'}.pdf`);
      });
    }
  };


  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando perfil...</span>
        </div>
    );
  }

  if (!student) {
    notFound();
  }

  const attendanceRate = studentStats && studentStats.attendance.total > 0 
    ? (studentStats.attendance.p / studentStats.attendance.total) * 100
    : 0;

  
  return (
    <div className="flex flex-col gap-6">
       <Card className="bg-accent/50 print:hidden">
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
                <Button variant="outline" onClick={handleDownloadPdf}>
                  <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
             </div>
          </CardContent>
       </Card>
      
      <div ref={reportRef} className="flex flex-col gap-6 bg-background p-4 rounded-lg">
        <h2 className="text-xl font-bold text-center">Informe Individual del Estudiante</h2>
        <Card>
            <CardHeader>
                <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6 items-start">
                 <div className="md:col-span-1 flex justify-center">
                    <Image
                        alt="Avatar"
                        className="rounded-full aspect-square object-cover w-48 h-48"
                        height={192}
                        src={student.photo}
                        data-ai-hint="student avatar"
                        width={192}
                    />
                 </div>
                 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <User className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                            <div>
                                <p className="text-sm text-muted-foreground">Nombre Completo:</p>
                                <p className="font-semibold text-lg">{student.name}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3">
                            <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                            <div>
                                <p className="text-sm text-muted-foreground">Email:</p>
                                <p className="font-semibold">{student.email || 'No registrado'}</p>
                            </div>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <User className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                            <div>
                                <p className="text-sm text-muted-foreground">Tutor:</p>
                                <p className="font-semibold">{student.tutorName || 'No registrado'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                            <div>
                                <p className="text-sm text-muted-foreground">Teléfono Tutor:</p>
                                <p className="font-semibold">{student.tutorPhone || 'No registrado'}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3">
                            <Contact className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                            <div>
                                <p className="text-sm text-muted-foreground">ID de Estudiante:</p>
                                <p className="font-semibold">{student.id}</p>
                            </div>
                        </div>
                    </div>
                 </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen de Calificaciones</CardTitle>
                         <CardDescription>Desglose de calificaciones por materia y promedio semestral.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {studentStats?.gradesByGroup.map(item => (
                                <div key={item.group}>
                                    <div className="flex justify-between items-center p-3 rounded-t-md border bg-muted/50">
                                        <p className="font-semibold">{item.group}</p>
                                    </div>
                                    <div className='p-3 border-x border-b rounded-b-md text-sm space-y-2'>
                                        <div className='flex justify-between'>
                                            <span>Primer Parcial:</span>
                                            <span className='font-medium'>{item.grade.toFixed(1)}%</span>
                                        </div>
                                         <div className='flex justify-between'>
                                            <span>Segundo Parcial:</span>
                                            <span className='font-medium'>0.0%</span>
                                        </div>
                                         <div className='flex justify-between'>
                                            <span>Tercer Parcial:</span>
                                            <span className='font-medium'>0.0%</span>
                                        </div>
                                         <div className='flex justify-between pt-2 border-t mt-2'>
                                            <span className="font-bold">Promedio Semestral:</span>
                                            <Badge variant={item.grade >= 70 ? "default" : "destructive"} className="text-base">{item.grade.toFixed(1)}%</Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {studentStats?.gradesByGroup.length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-4">No hay calificaciones registradas.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
             <div>
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
                    <p className="text-sm text-center text-muted-foreground py-4">No hay observaciones registradas.</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Retroalimentación y Recomendaciones (IA)</CardTitle>
                <CardDescription>
                    Análisis del desempeño del estudiante y sugerencias generadas por inteligencia artificial.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {generatedFeedback ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-md border whitespace-pre-wrap text-sm">
                            {generatedFeedback}
                        </div>
                         <Button variant="secondary" size="sm" onClick={() => setGeneratedFeedback('')}>
                            Ocultar retroalimentación
                         </Button>
                    </div>
                ) : (
                    <div className="text-center p-4">
                        <p className="text-muted-foreground mb-4">
                            Haz clic en el botón para generar un análisis completo del desempeño y obtener recomendaciones.
                        </p>
                        <Button onClick={handleGenerateFeedback} disabled={isGeneratingFeedback || !studentStats}>
                            {isGeneratingFeedback ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Wand2 className="mr-2 h-4 w-4" />
                            )}
                            {isGeneratingFeedback ? 'Generando...' : 'Generar Retroalimentación'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
