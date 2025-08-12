
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
import { useState, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData, loadFromLocalStorage } from '@/hooks/use-data';
import { Badge } from '@/components/ui/badge';
import { getPartialLabel } from '@/lib/utils';
import type { PartialId, StudentObservation } from '@/hooks/use-data';
import { StudentObservationLogDialog } from '@/components/student-observation-log-dialog';
import { WhatsAppDialog } from '@/components/whatsapp-dialog';
import { generateStudentFeedback } from '@/ai/flows/student-feedback';
import type { StudentFeedbackInput, StudentFeedbackOutput } from '@/ai/flows/student-feedback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
      activePartialId,
      setActivePartialId
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

  const activeStats: StudentStats | null = useMemo(() => {
    if (!student || !studentGroups.length) return null;
    
    const primaryGroupId = studentGroups[0].id;
    const gradeDetails = calculateDetailedFinalGrade(student.id, primaryGroupId, activePartialId);
    
    const keySuffix = `${primaryGroupId}_${activePartialId}`;
    const attendanceForPartial = loadFromLocalStorage(`attendance_${keySuffix}`, {});
    
    let p = 0, a = 0, total = 0;
    Object.keys(attendanceForPartial).forEach(date => {
        if (attendanceForPartial[date]?.[studentId] !== undefined) {
            total++;
            if (attendanceForPartial[date][studentId]) p++; else a++;
        }
    });

    return {
        ...gradeDetails,
        partialId: activePartialId,
        attendance: { p, a, total, rate: total > 0 ? (p / total) * 100 : 100 }
    };
  }, [student, studentGroups, calculateDetailedFinalGrade, activePartialId, studentId]);


  const studentObservations = useMemo(() => {
    return (allObservations[studentId] || []).filter(obs => obs.partialId === activePartialId);
  }, [allObservations, studentId, activePartialId]);


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
      if (!student || !activeStats) return;
      setIsGeneratingFeedback(true);
      setGeneratedFeedback(null);
      try {
          const inputData: StudentFeedbackInput = {
              studentName: student.name,
              gradesByGroup: [{
                  group: studentGroups[0].subject,
                  grade: activeStats.finalGrade,
              }],
              attendance: activeStats.attendance,
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
                         <div className="mt-4 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsLogOpen(true)}><MessageSquare className="mr-2"/>Ver Bitácora</Button>
                            <Button variant="secondary" size="sm" onClick={() => setIsWhatsAppOpen(true)}>Contactar Tutor</Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="mt-6">
                 <Tabs defaultValue={activePartialId} onValueChange={(value) => setActivePartialId(value as PartialId)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="p1">Primer Parcial</TabsTrigger>
                        <TabsTrigger value="p2">Segundo Parcial</TabsTrigger>
                        <TabsTrigger value="p3">Tercer Parcial</TabsTrigger>
                    </TabsList>
                    <TabsContent value={activePartialId} className="mt-4">
                        {activeStats && activeStats.criteriaDetails.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Rendimiento Académico</CardTitle>
                                        <CardDescription>Calificación: <Badge className={activeStats.finalGrade >= 60 ? 'bg-green-500' : 'bg-destructive'}>{activeStats.finalGrade.toFixed(1)}%</Badge></CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <h4 className="font-semibold mb-2 text-sm">Desglose de Criterios:</h4>
                                        <div className="space-y-1 text-sm">
                                            {activeStats.criteriaDetails.map(c => (
                                                <div key={c.name} className="flex justify-between">
                                                    <span>{c.name} <span className="text-xs text-muted-foreground">({c.weight}%)</span></span>
                                                    <span className="font-medium">{c.earned.toFixed(1)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader>
                                        <CardTitle>Asistencia y Observaciones</CardTitle>
                                         <CardDescription>Tasa de asistencia del {activeStats.attendance.rate.toFixed(1)}%</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <h4 className="font-semibold mb-2 text-sm">Observaciones en Bitácora:</h4>
                                        {studentObservations.length > 0 ? (
                                            <div className="space-y-2 text-sm">
                                                {studentObservations.map(obs => (
                                                     <div key={obs.id} className="p-2 bg-muted/50 rounded-md">
                                                        <p><span className="font-semibold">{obs.type}:</span> {obs.details}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No hay observaciones para este parcial.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                             <Card>
                                <CardContent className="p-12 text-center">
                                    <h3 className="text-lg font-semibold">Sin datos</h3>
                                    <p className="text-muted-foreground mt-1">No hay información de calificaciones registrada para este estudiante en el {getPartialLabel(activePartialId)}.</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
             <Card className="mt-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Feedback y Recomendaciones con IA</CardTitle>
                            <CardDescription>Genera un resumen personalizado del rendimiento del estudiante en el parcial activo.</CardDescription>
                        </div>
                        <Button onClick={handleGenerateFeedback} disabled={isGeneratingFeedback || !activeStats}>
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

    