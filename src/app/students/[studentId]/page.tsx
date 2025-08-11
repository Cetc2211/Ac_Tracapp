
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
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, User, Mail, Phone, BookCopy, BarChart3, MessageSquare, Briefcase, TrendingUp, TrendingDown, Wand2, Loader2 } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '@/hooks/use-data';
import { Badge } from '@/components/ui/badge';
import { getPartialLabel } from '@/lib/utils';
import type { PartialId, StudentObservation } from '@/hooks/use-data';
import { StudentObservationLogDialog } from '@/components/student-observation-log-dialog';
import { WhatsAppDialog } from '@/components/whatsapp-dialog';
import { generateStudentFeedback } from '@/ai/flows/student-feedback';
import type { StudentFeedbackInput, StudentFeedbackOutput } from '@/ai/flows/student-feedback';

type StudentStats = ReturnType<typeof useData>['calculateDetailedFinalGrade'] & {
    partialId: PartialId;
    attendance: { p: number; a: number; total: number; rate: number };
};

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  
  const { 
      allStudents,
      groups,
      calculateDetailedFinalGrade,
      allObservations,
  } = useData();

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [generatedFeedback, setGeneratedFeedback] = useState<StudentFeedbackOutput | null>(null);
  
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const student = useMemo(() => allStudents.find(s => s.id === studentId), [allStudents, studentId]);
  
  const studentGroups = useMemo(() => {
    return groups.filter(g => g.students.some(s => s.id === studentId));
  }, [groups, studentId]);

  const studentStatsByPartial: StudentStats[] = useMemo(() => {
    if (!student) return [];
    
    const partials: PartialId[] = ['p1', 'p2', 'p3'];
    const stats: StudentStats[] = [];

    studentGroups.forEach(group => {
        partials.forEach(partialId => {
            const gradeDetails = calculateDetailedFinalGrade(student.id, group.id, partialId);
            const keySuffix = `${group.id}_${partialId}`;
            const attendance = useData.getState().partialData.attendance;
            
            let p = 0, a = 0, total = 0;
            Object.keys(attendance).forEach(date => {
                if (attendance[date]?.[student.id] !== undefined) {
                    total++;
                    if (attendance[date][student.id]) p++; else a++;
                }
            });

            stats.push({
                ...gradeDetails,
                partialId: partialId,
                attendance: { p, a, total, rate: total > 0 ? (p / total) * 100 : 100 }
            });
        });
    });
    // For simplicity, we are assuming a student is in one group. If in multiple, this would need adjustment.
    // This logic can be expanded based on requirements.
    // For now, let's just use the first group's data for all partials.
    const relevantStats: StudentStats[] = [];
    if(studentGroups.length > 0) {
        const primaryGroupId = studentGroups[0].id;
        partials.forEach(pId => {
             const gradeDetails = calculateDetailedFinalGrade(student.id, primaryGroupId, pId);
             if(gradeDetails.criteriaDetails.length > 0) { // Only show partials with data
                const keySuffix = `${primaryGroupId}_${pId}`;
                const attendance = useData.getState().partialData.attendance;
                let p=0, a=0, total=0;
                Object.keys(attendance).forEach(date => {
                    if (attendance[date]?.[student.id] !== undefined) {
                        total++;
                        if (attendance[date][student.id]) p++; else a++;
                    }
                });
                relevantStats.push({ ...gradeDetails, partialId: pId, attendance: {p,a,total, rate: total > 0 ? (p / total) * 100 : 100} });
             }
        });
    }

    return relevantStats;

  }, [student, studentGroups, calculateDetailedFinalGrade]);

  const studentObservations = useMemo(() => {
    return allObservations[studentId] || [];
  }, [allObservations, studentId]);


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
        
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`informe_${student?.name.replace(/\s+/g, '_') || 'estudiante'}.pdf`);
      });
    }
  };

  const handleGenerateFeedback = async () => {
      if (!student) return;
      setIsGeneratingFeedback(true);
      setGeneratedFeedback(null);
      try {
          const inputData: StudentFeedbackInput = {
              studentName: student.name,
              gradesByGroup: studentGroups.map(g => ({
                  group: g.subject,
                  grade: calculateDetailedFinalGrade(student.id, g.id, 'p1').finalGrade, // Example, could be improved
              })),
              attendance: studentStatsByPartial[0]?.attendance || { p: 0, a: 0, total: 0 },
              observations: studentObservations.map(obs => ({ type: obs.type, details: obs.details }))
          };

          const feedback = await generateStudentFeedback(inputData);
          setGeneratedFeedback(feedback);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error de IA', description: 'No se pudo generar el feedback.' });
      } finally {
          setIsGeneratingFeedback(false);
      }
  };


  if (!student) {
    return notFound();
  }

  return (
    <>
      <StudentObservationLogDialog student={student} open={isLogOpen} onOpenChange={setIsLogOpen} />
      <WhatsAppDialog studentName={student.name} open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen} />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="icon">
              <Link href="/dashboard">
                  <ArrowLeft />
                  <span className="sr-only">Volver</span>
              </Link>
              </Button>
              <div>
              <h1 className="text-3xl font-bold">Perfil del Estudiante</h1>
              <p className="text-muted-foreground">
                  Información detallada de {student.name}.
              </p>
              </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4"/> PDF
            </Button>
          </div>
        </div>

        <div ref={reportRef} className="p-2">
            <Card>
                <CardHeader className="flex flex-col md:flex-row gap-6 items-start">
                    <Image
                        src={student.photo}
                        alt={student.name}
                        width={128}
                        height={128}
                        className="rounded-full border-4 border-primary"
                        data-ai-hint="student photo"
                    />
                    <div className="w-full">
                        <CardTitle className="text-3xl">{student.name}</CardTitle>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {student.email || 'No registrado'}</p>
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {student.phone || 'No registrado'}</p>
                            <p className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Tutor: {student.tutorName || 'No registrado'}</p>
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Tel. Tutor: {student.tutorPhone || 'No registrado'}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                             <h3 className="text-lg font-semibold flex items-center gap-2"><BookCopy/> Cursos Activos</h3>
                            {studentGroups.map(g => (
                                <div key={g.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                        <p className="font-bold">{g.subject}</p>
                                        <p className="text-sm text-muted-foreground">{g.facilitator}</p>
                                    </div>
                                    <Badge variant="secondary">{g.groupName}</Badge>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 space-y-4">
                             <h3 className="text-lg font-semibold flex items-center gap-2"><BarChart3/> Resumen de Asistencia General</h3>
                             <div className="p-3 bg-muted rounded-lg space-y-2">
                                {/* This calculation is simplified, can be made more robust */}
                                <p>Tasa de Asistencia: <span className="font-bold">{studentStatsByPartial[0]?.attendance.rate.toFixed(1) ?? '100'}%</span></p>
                                <p>Total Clases: <span className="font-bold">{studentStatsByPartial[0]?.attendance.total ?? '0'}</span></p>
                             </div>
                        </div>
                    </div>
                </CardContent>
                 <CardFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsLogOpen(true)}><MessageSquare className="mr-2"/>Ver Bitácora</Button>
                    <Button variant="secondary" onClick={() => setIsWhatsAppOpen(true)}>Contactar Tutor</Button>
                </CardFooter>
            </Card>

            <div className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Rendimiento por Parcial</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studentStatsByPartial.map(stats => (
                        <Card key={stats.partialId}>
                            <CardHeader>
                                <CardTitle>{getPartialLabel(stats.partialId)}</CardTitle>
                                <CardDescription>Calificación: <Badge className={stats.finalGrade >= 60 ? 'bg-green-500' : 'bg-destructive'}>{stats.finalGrade.toFixed(1)}%</Badge></CardDescription>
                            </CardHeader>
                            <CardContent>
                                <h4 className="font-semibold mb-2 text-sm">Desglose de Criterios:</h4>
                                <div className="space-y-1 text-sm">
                                    {stats.criteriaDetails.map(c => (
                                        <div key={c.name} className="flex justify-between">
                                            <span>{c.name} <span className="text-xs text-muted-foreground">({c.weight}%)</span></span>
                                            <span className="font-medium">{c.earned.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
             <Card className="mt-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Feedback y Recomendaciones con IA</CardTitle>
                            <CardDescription>Genera un resumen personalizado del rendimiento del estudiante.</CardDescription>
                        </div>
                        <Button onClick={handleGenerateFeedback} disabled={isGeneratingFeedback}>
                            {isGeneratingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                            {isGeneratingFeedback ? "Generando..." : "Generar Feedback"}
                        </Button>
                    </div>
                </CardHeader>
                {generatedFeedback && (
                    <CardContent>
                        <div className="p-4 border-l-4 border-primary bg-primary/10 rounded-r-md space-y-4">
                            <div>
                                <h4 className="font-bold">Feedback General:</h4>
                                <p className="text-sm">{generatedFeedback.feedback}</p>
                            </div>
                            <div>
                                <h4 className="font-bold">Recomendaciones:</h4>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    {generatedFeedback.recommendations.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
      </div>
    </>
  );
}
