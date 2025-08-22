
'use client';

import * as React from 'react';
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
import { ArrowLeft, Download, User, Mail, Phone, Wand2, Loader2, MessageSquare, BookText, Edit, Save } from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '@/hooks/use-data';
import { Badge } from '@/components/ui/badge';
import { getPartialLabel } from '@/lib/utils';
import type { PartialId, StudentObservation, Student, PartialData } from '@/hooks/use-data';
import { StudentObservationLogDialog } from '@/components/student-observation-log-dialog';
import { WhatsAppDialog } from '@/components/whatsapp-dialog';
import { generateStudentFeedback } from '@/ai/flows/student-feedback';
import type { StudentFeedbackInput, StudentFeedbackOutput } from '@/ai/flows/student-feedback';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type StudentStats = ReturnType<typeof useData>['calculateDetailedFinalGrade'] & {
  partialId: PartialId;
  attendance: { p: number; a: number; total: number; rate: number };
  observations: StudentObservation[];
};

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const {
    allStudents,
    groups,
    calculateDetailedFinalGrade,
    allObservations,
    isLoading: isDataLoading,
    fetchPartialData,
  } = useData();

  const [studentStatsByPartial, setStudentStatsByPartial] = useState<StudentStats[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [generatedFeedback, setGeneratedFeedback] = useState<StudentFeedbackOutput | null>(null);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState<{ feedback: string; recommendations: string }>({
    feedback: '',
    recommendations: '',
  });

  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const student = useMemo(() => allStudents.find((s) => s.id === studentId), [allStudents, studentId]);
  const studentGroups = useMemo(() => groups.filter((g) => g.students.some((s) => s.id === studentId)), [groups, studentId]);

  useEffect(() => {
    const calculateStats = async () => {
        if (isDataLoading) return;
        
        if (!student || studentGroups.length === 0) {
          setIsPageLoading(false);
          return;
        }
        
        setIsPageLoading(true);
        const stats: StudentStats[] = [];
        const partials: PartialId[] = ['p1', 'p2', 'p3'];

        try {
            const primaryGroupId = studentGroups[0].id;
            
            for (const pId of partials) {
                const partialData = await fetchPartialData(primaryGroupId, pId);
                
                if (partialData && partialData.criteria && partialData.criteria.length > 0) {
                    const gradeDetails = calculateDetailedFinalGrade(student.id, partialData);

                    let p = 0, a = 0, total = 0;
                    const safeAttendance = partialData.attendance || {};
                    Object.keys(safeAttendance).forEach((date) => {
                        if (safeAttendance[date]?.[studentId] !== undefined) {
                            total++;
                            if (safeAttendance[date][studentId]) p++; else a++;
                        }
                    });

                    const partialObservations = (allObservations[studentId] || []).filter((obs) => obs.partialId === pId);
                    
                    stats.push({
                        ...gradeDetails,
                        partialId: pId,
                        attendance: { p, a, total, rate: total > 0 ? (p / total) * 100 : 100 },
                        observations: partialObservations,
                    });
                }
            }
            setStudentStatsByPartial(stats);
        } catch (e) {
            console.error('Error calculating stats:', e);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron calcular las estadísticas.' });
        } finally {
            setIsPageLoading(false);
        }
    };
    
    calculateStats();

  }, [isDataLoading, student, studentGroups, studentId, fetchPartialData, calculateDetailedFinalGrade, allObservations, toast]);


  const semesterAverage = useMemo(() => {
    if (studentStatsByPartial.length === 0) return 0;
    const partialsWithGrades = studentStatsByPartial.filter((s) => s.criteriaDetails.length > 0);
    if (partialsWithGrades.length === 0) return 0;
    const total = partialsWithGrades.reduce((sum, stats) => sum + stats.finalGrade, 0);
    return total / partialsWithGrades.length;
  }, [studentStatsByPartial]);

  const handleDownloadPdf = async () => {
    const reportElement = reportRef.current;
    if (!reportElement) return;

    const idsToHide = ['interactive-buttons-header', 'interactive-buttons-card', 'feedback-buttons-container'];
    const elementsToHide: HTMLElement[] = idsToHide
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    const originalDisplays = new Map<HTMLElement, string>();

    toast({ title: 'Generando PDF...', description: 'Esto puede tardar un momento.' });

    elementsToHide.forEach((el) => {
      originalDisplays.set(el, el.style.display);
      el.style.display = 'none';
    });

    try {
      const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
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
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error al generar PDF',
        description: 'No se pudo crear el archivo. Inténtalo de nuevo.',
      });
    } finally {
      elementsToHide.forEach((el) => {
        el.style.display = originalDisplays.get(el) || '';
      });
    }
  };

  const handleGenerateFeedback = async () => {
    if (!student) return;

    const partialsWithData = studentStatsByPartial
      .filter((s) => s.criteriaDetails.length > 0)
      .sort((a, b) => parseInt(b.partialId.slice(1)) - parseInt(a.partialId.slice(1)));

    const dataToUse = partialsWithData.length > 0 ? partialsWithData[0] : null;

    if (!dataToUse) {
      toast({
        variant: 'destructive',
        title: 'Sin datos',
        description: 'No hay datos de ningún parcial para generar feedback.',
      });
      return;
    }

    toast({ title: `Generando feedback...`, description: `Usando datos de: ${getPartialLabel(dataToUse.partialId)}` });
    setIsGeneratingFeedback(true);
    setGeneratedFeedback(null);
    try {
      const inputData: StudentFeedbackInput = {
        studentName: student.name,
        gradesByGroup: [
          {
            group: studentGroups.find((g) => g.students.some((s) => s.id === studentId))?.subject || 'Clase',
            grade: dataToUse.finalGrade,
          },
        ],
        attendance: dataToUse.attendance,
        observations: dataToUse.observations.map((obs) => ({ type: obs.type, details: obs.details })),
      };

      const feedback = await generateStudentFeedback(inputData);
      setGeneratedFeedback(feedback);
    } catch (error) {
      console.error('Error generating feedback:', error);
      toast({ variant: 'destructive', title: 'Error de IA', description: 'No se pudo generar el feedback.' });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleEditFeedback = () => {
    if (generatedFeedback) {
      setEditedFeedback({
        feedback: generatedFeedback.feedback,
        recommendations: generatedFeedback.recommendations.join('\n'),
      });
      setIsEditingFeedback(true);
    }
  };

  const handleSaveFeedback = () => {
    if (generatedFeedback) {
      setGeneratedFeedback({
        feedback: editedFeedback.feedback,
        recommendations: editedFeedback.recommendations.split('\n').filter((r) => r.trim() !== ''),
      });
      setIsEditingFeedback(false);
      toast({ title: 'Feedback actualizado' });
    }
  };

  if (isDataLoading || isPageLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando datos del estudiante...</span>
      </div>
    );
  }
  
  if (!student) {
      return notFound();
  }

  const allSemesterObservations = Object.values(allObservations)
    .flat()
    .filter((obs) => obs.studentId === studentId);
  const facilitatorName = studentGroups[0]?.facilitator || 'Docente';
  const hasAnyDataForFeedback = studentStatsByPartial.some((s) => s.criteriaDetails.length > 0);

  return (
    <>
      <StudentObservationLogDialog student={student} open={isLogOpen} onOpenChange={setIsLogOpen} />
      <WhatsAppDialog studentName={student.name} open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen} />

      <div className="flex flex-col gap-6">
        <div id="interactive-buttons-header" className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              <Link href="/dashboard">
                <ArrowLeft />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Perfil del Estudiante</h1>
              <p className="text-muted-foreground">Información detallada de {student.name}.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" /> PDF
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
                <p className="text-lg text-muted-foreground font-semibold">
                  Asignatura: {studentGroups[0]?.subject || 'No asignada'}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> {student.email || 'No registrado'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> {student.phone || 'No registrado'}
                  </p>
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Tutor: {student.tutorName || 'No registrado'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> Tel. Tutor: {student.tutorPhone || 'No registrado'}
                  </p>
                </div>
                <div id="interactive-buttons-card" className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsLogOpen(true)}>
                    <MessageSquare className="mr-2" /> Ver Bitácora
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setIsWhatsAppOpen(true)}>
                    Enviar informe vía WhatsApp
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {studentStatsByPartial.length > 0 ? (
                studentStatsByPartial.map(
                  (stats) => (
                      <Card key={stats.partialId}>
                        <CardHeader>
                          <CardTitle>{getPartialLabel(stats.partialId)}</CardTitle>
                          <CardDescription>
                            Calificación Final:{' '}
                            <Badge className={stats.finalGrade >= 60 ? 'bg-green-500' : 'bg-destructive'}>
                              {stats.finalGrade.toFixed(1)}%
                            </Badge>{' '}
                            | Asistencia: <Badge variant="secondary">{stats.attendance.rate.toFixed(1)}%</Badge>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <h4 className="font-semibold mb-2 text-sm">Desglose de Criterios:</h4>
                          <div className="space-y-1 text-sm p-3 bg-muted/30 rounded-md">
                            {stats.criteriaDetails.map((c) => (
                              <div key={c.name} className="flex justify-between">
                                <span>
                                  {c.name} <span className="text-xs text-muted-foreground">({c.weight}%)</span>
                                </span>
                                <span className="font-medium">{c.earned.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                )
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <h3 className="text-lg font-semibold">Sin datos de rendimiento</h3>
                    <p className="text-muted-foreground mt-1">
                      No hay información de calificaciones registrada para este estudiante en ningún parcial.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookText className="h-5 w-5" /> Bitácora del Semestre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allSemesterObservations.length > 0 ? (
                    <div className="space-y-3 text-sm max-h-64 overflow-y-auto pr-2">
                      {allSemesterObservations.map((obs) => (
                        <div key={obs.id} className="p-2 bg-muted/50 rounded-md">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold">{obs.type}</p>
                            <Badge variant="outline" className="text-xs">
                              {getPartialLabel(obs.partialId)}
                            </Badge>
                          </div>
                          <p className="text-xs mt-1">{obs.details}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay observaciones.</p>
                  )}
                </CardContent>
              </Card>
              {studentStatsByPartial.length > 0 && (
                <Card>
                    <CardHeader>
                    <CardTitle className="text-base text-center">Calificación Final Semestral</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                    <p
                        className="text-5xl font-bold"
                        style={{ color: semesterAverage >= 60 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))' }}
                    >
                        {semesterAverage.toFixed(1)}%
                    </p>
                    </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recomendaciones y retroalimentación</CardTitle>
                  <CardDescription>Resumen personalizado del rendimiento del estudiante.</CardDescription>
                </div>
                <div id="feedback-buttons-container" className="flex gap-2">
                  <Button
                    onClick={handleGenerateFeedback}
                    disabled={isGeneratingFeedback || isEditingFeedback || !hasAnyDataForFeedback}
                  >
                    {isGeneratingFeedback ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    {isGeneratingFeedback ? 'Generando...' : 'Generar Feedback'}
                  </Button>
                  {generatedFeedback && !isEditingFeedback && (
                    <Button variant="secondary" onClick={handleEditFeedback}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {generatedFeedback ? (
              <CardContent>
                {isEditingFeedback ? (
                  <div className="p-4 border rounded-md space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="editedFeedback" className="font-bold">
                        Feedback General:
                      </Label>
                      <Textarea
                        id="editedFeedback"
                        value={editedFeedback.feedback}
                        onChange={(e) => setEditedFeedback((prev) => ({ ...prev, feedback: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editedRecommendations" className="font-bold">
                        Recomendaciones:
                      </Label>
                      <Textarea
                        id="editedRecommendations"
                        value={editedFeedback.recommendations}
                        onChange={(e) => setEditedFeedback((prev) => ({ ...prev, recommendations: e.target.value }))}
                        rows={5}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditingFeedback(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveFeedback}>
                        <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                      </Button>
                    </div>
                  </div>
                ) : (
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
                )}
              </CardContent>
            ) : (
              !hasAnyDataForFeedback && (
                <CardContent>
                  <div className="text-center text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
                    <p>No hay datos de calificaciones para generar un feedback automatizado.</p>
                  </div>
                </CardContent>
              )
            )}
            <CardFooter>
              <div className="w-full mt-12 pt-12 text-center text-sm">
                <div className="inline-block">
                  <div className="border-t border-foreground w-48 mx-auto"></div>
                  <p className="font-semibold">{facilitatorName}</p>
                  <p className="text-muted-foreground">Firma del Docente</p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
