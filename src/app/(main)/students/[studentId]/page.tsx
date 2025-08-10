
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
import { Mail, User, Contact, ArrowLeft, Download, FileText, Loader2, Phone, Wand2, ListChecks } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { generateStudentFeedback } from '@/ai/flows/student-feedback';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { WhatsAppDialog } from '@/components/whatsapp-dialog';
import { useData, loadFromLocalStorage } from '@/hooks/use-data';
import { Separator } from '@/components/ui/separator';
import type { EvaluationCriteria, Grades, ParticipationRecord, StudentStats, Activity, ActivityRecord, AttendanceRecord } from '@/hooks/use-data';


const WhatsAppIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);


export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const router = useRouter();
  
  const { students, groups, allObservations, calculateFinalGrade } = useData();
  const student = students.find(s => s.id === studentId);

  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [observations, setObservations] = useState<StudentObservation[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [generatedFeedback, setGeneratedFeedback] = useState<{ feedback: string, recommendations: string[] } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);


  useEffect(() => {
    if (!student) {
        setIsLoading(false);
        return;
    };
    
    try {
        setIsLoading(true);
        const studentGroups = groups.filter(g => g.students.some(s => s.id === studentId));
        
        const gradesByGroup: StudentStats['gradesByGroup'] = [];
        let totalGradeSum = 0;
        const studentObservations: StudentObservation[] = allObservations[studentId] || [];
        
        studentGroups.forEach(group => {
            const criteria = loadFromLocalStorage<EvaluationCriteria[]>(`criteria_${group.id}`, []);
            const grades = loadFromLocalStorage<Grades>(`grades_${group.id}`, {});
            const participations = loadFromLocalStorage<ParticipationRecord>(`participations_${group.id}`, {});
            const activities = loadFromLocalStorage<Activity[]>(`activities_${group.id}`, []);
            const activityRecords = loadFromLocalStorage<ActivityRecord>(`activityRecords_${group.id}`, {});
            
            const finalGrade = calculateFinalGrade(studentId, criteria, grades, participations, activities, activityRecords, studentObservations);

            const criteriaDetails = criteria.map(c => {
                let performanceRatio = 0;
                if (c.name === 'Portafolio' || c.name === 'Actividades') {
                    const totalActivities = activities.length || 0;
                    if(totalActivities > 0) performanceRatio = (Object.values(activityRecords[studentId] || {}).filter(Boolean).length) / totalActivities;
                } else if (c.name === 'Participación') {
                    const totalClasses = Object.keys(participations).length || 0;
                    if(totalClasses > 0) performanceRatio = (Object.values(participations).filter(p => p[studentId]).length) / totalClasses;
                } else {
                    const delivered = grades[studentId]?.[c.id]?.delivered ?? 0;
                    if(c.expectedValue > 0) performanceRatio = delivered / c.expectedValue;
                }
                return { name: c.name, earned: performanceRatio * c.weight, weight: c.weight };
            });

            gradesByGroup.push({ group: group.subject, grade: finalGrade, criteriaDetails });
            totalGradeSum += finalGrade;
        });

        const attendanceStats = { p: 0, a: 0, total: 0 };
        studentGroups.forEach(group => {
            const groupAttendance = loadFromLocalStorage<AttendanceRecord>(`attendance_${group.id}`, {});
            for(const date in groupAttendance){
                if(groupAttendance[date][studentId] !== undefined){
                    attendanceStats.total++;
                    if(groupAttendance[date][studentId]) attendanceStats.p++; else attendanceStats.a++;
                }
            }
        });
        
        setObservations(studentObservations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        setStudentStats({
          averageGrade: studentGroups.length > 0 ? totalGradeSum / studentGroups.length : 0,
          attendance: attendanceStats,
          gradesByGroup,
        });
    } catch (error) {
      console.error("Failed to load student data", error);
      toast({ variant: 'destructive', title: 'Error al cargar datos', description: 'No se pudo cargar la información del estudiante.'})
    } finally {
        setIsLoading(false);
    }
  }, [student, groups, allObservations, studentId, toast, calculateFinalGrade]);
  
   const handleGenerateFeedback = async () => {
    if (!student || !studentStats) {
        toast({ variant: 'destructive', title: 'Datos no disponibles', description: 'Las estadísticas del estudiante aún no están listas.' });
        return;
    };
    setIsGeneratingFeedback(true);
    setGeneratedFeedback(null);
    try {
      const input = {
        studentName: student.name,
        gradesByGroup: studentStats.gradesByGroup.map(g => ({ group: g.group, grade: g.grade })),
        attendance: studentStats.attendance,
        observations: observations.map(o => ({ type: o.type, details: o.details })),
      };
      const result = await generateStudentFeedback(input);
      setGeneratedFeedback(result);
      toast({
        title: 'Retroalimentación Generada',
        description: 'Las recomendaciones se han copiado al informe del estudiante.',
      });
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
        const pdf = new jsPDF('p', 'mm', 'a4'); // A4 size page of PDF
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth - 20; // 10mm margin on each side
        let imgHeight = imgWidth / ratio;
        
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20; // 10mm margin top and bottom
            imgWidth = imgHeight * ratio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`informe_${student?.name.replace(/\s+/g, '_') || 'estudiante'}.pdf`);
      });
    }
  };

  const handleSendWhatsApp = (target: 'student' | 'tutor') => {
    if (!student) return;

    let phone: string | null | undefined = null;

    if (target === 'tutor') {
      phone = student.tutorPhone;
    } else if (target === 'student') {
      phone = student.phone;
    } 

    if (!phone) {
        toast({ variant: 'destructive', title: 'Número no disponible', description: `No hay un número de teléfono registrado.` });
        return;
    }
    
    const message = encodeURIComponent(`Hola, le comparto el informe académico de ${student.name}.`);
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${message}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
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
    <>
    <WhatsAppDialog
        open={isWhatsAppDialogOpen}
        onOpenChange={setIsWhatsAppDialogOpen}
        studentName={student.name}
    />
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
                   <ArrowLeft className="mr-2 h-4 w-4" /> Regresar
                </Button>
                <Button variant="outline" onClick={handleDownloadPdf}>
                  <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <WhatsAppIcon />
                            <span className="ml-2">Enviar por WhatsApp</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {student.tutorPhone && (
                            <DropdownMenuItem onClick={() => handleSendWhatsApp('tutor')}>
                                Enviar al Tutor ({student.tutorName})
                            </DropdownMenuItem>
                        )}
                        {student.phone && (
                            <DropdownMenuItem onClick={() => handleSendWhatsApp('student')}>
                                Enviar al Estudiante
                            </DropdownMenuItem>
                        )}
                         <DropdownMenuSeparator />
                         <DropdownMenuItem onSelect={() => setIsWhatsAppDialogOpen(true)}>
                            Enviar a otro teléfono
                         </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </CardContent>
       </Card>
      
      <div ref={reportRef} className="flex flex-col gap-6 bg-background p-4 rounded-lg">
        <h2 className="text-xl font-bold text-center">Informe Individual de Desempeño</h2>
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
                                        {item.criteriaDetails.map(c => (
                                           <div key={c.name} className="flex justify-between items-center">
                                               <span>{c.name} <span className="text-xs text-muted-foreground">({c.weight}%)</span></span>
                                               <Badge variant="secondary">{c.earned.toFixed(1)}%</Badge>
                                           </div>
                                        ))}
                                         <Separator />
                                         <div className='flex justify-between pt-2 mt-2 font-bold'>
                                            <span>Calificación del Parcial:</span>
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
                        <CardTitle>Historial de Asistencia Global</CardTitle>
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

        {generatedFeedback && (
            <Card>
                <CardHeader>
                    <CardTitle>Retroalimentación y Plan de Acción</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-md border space-y-4">
                        <div>
                            <h4 className="font-bold">Análisis General:</h4>
                            <p className="text-sm whitespace-pre-wrap">{generatedFeedback.feedback}</p>
                        </div>
                        <Separator/>
                        <div>
                             <h4 className="font-bold flex items-center gap-2"><ListChecks /> Recomendaciones:</h4>
                             <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                {generatedFeedback.recommendations.map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}
        <CardFooter className="mt-8 pt-6 text-center text-xs text-muted-foreground">
             <div className="mt-12 pt-12 w-full">
                <div className="inline-block">
                    <div className="border-t border-foreground w-48 mx-auto"></div>
                    <p className="mt-2 font-semibold">Nombre del Docente</p>
                    <p>Firma del Docente</p>
                </div>
            </div>
        </CardFooter>
      </div>

       <Card className="print:hidden">
            <CardHeader>
                <CardTitle>Generador de Retroalimentación (IA)</CardTitle>
                <CardDescription>
                    Analiza el desempeño del estudiante y genera sugerencias. La retroalimentación se añadirá al informe.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center p-4">
                    <Button onClick={handleGenerateFeedback} disabled={isGeneratingFeedback || !studentStats}>
                        {isGeneratingFeedback ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        {isGeneratingFeedback ? 'Generando...' : 'Generar y Copiar al Informe'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
    </>
  );

    
