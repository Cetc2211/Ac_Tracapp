
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, Loader2, Wand2, User, Mail, Phone, Check, X, AlertTriangle, ListChecks, MessageSquare, BadgeInfo, Edit, Save } from 'lucide-react';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { StudentObservation } from '@/lib/placeholder-data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '@/hooks/use-data';
import { generateAtRiskStudentRecommendation } from '@/ai/flows/at-risk-student-recommendation';
import type { AtRiskStudentOutput, AtRiskStudentInput } from '@/ai/flows/at-risk-student-recommendation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { EvaluationCriteria, Grades, Activity, ActivityRecord, ParticipationRecord } from '@/hooks/use-data';


type StudentReportData = {
    id: string;
    name: string;
    photo: string;
    email?: string;
    tutorName?: string;
    tutorPhone?: string;
    riskLevel: 'high' | 'medium';
    riskReason: string;
    finalGrade: number;
    attendance: {
        p: number;
        a: number;
        total: number;
    };
    criteriaDetails: { name: string; earned: number; weight: number; }[];
    observations: StudentObservation[];
};


const AtRiskStudentCard = ({ studentData }: { studentData: StudentReportData }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiResponse, setAiResponse] = useState<AtRiskStudentOutput | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedAnalysis, setEditedAnalysis] = useState('');
    const [editedRecommendations, setEditedRecommendations] = useState('');

    const handleDownloadPdf = () => {
        const input = reportRef.current;
        if (input) {
            toast({ title: 'Generando PDF...', description: 'Esto puede tardar un momento.' });
            html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const ratio = canvas.width / canvas.height;
                let imgWidth = pdfWidth - 20;
                let imgHeight = imgWidth / ratio;
                if (imgHeight > pdfHeight - 20) {
                    imgHeight = pdfHeight - 20;
                    imgWidth = imgHeight * ratio;
                }
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                pdf.save(`informe_riesgo_${studentData.name.replace(/\s+/g, '_')}.pdf`);
            });
        }
    };
    
    const handleGenerateRecommendation = async () => {
        setIsGenerating(true);
        setAiResponse(null);
        setIsEditing(false);
        try {
            const input: AtRiskStudentInput = {
                studentName: studentData.name,
                riskReason: studentData.riskReason,
                gradesByGroup: [{
                    group: 'Grupo Actual',
                    grade: studentData.finalGrade,
                    criteriaDetails: studentData.criteriaDetails
                }],
                attendance: studentData.attendance,
                observations: studentData.observations.map(o => ({type: o.type, details: o.details})),
            };
            const result = await generateAtRiskStudentRecommendation(input);
            setAiResponse(result);
        } catch(e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: 'Error de IA',
                description: 'No se pudo generar el análisis. Inténtalo de nuevo.'
            });
        } finally {
            setIsGenerating(false);
        }
    }
    
    const handleEdit = () => {
        if(aiResponse) {
            setEditedAnalysis(aiResponse.analysis);
            setEditedRecommendations(aiResponse.recommendations.join('\n'));
            setIsEditing(true);
        }
    }
    
    const handleSaveEdit = () => {
        if (aiResponse) {
            setAiResponse({
                analysis: editedAnalysis,
                recommendations: editedRecommendations.split('\n').filter(r => r.trim() !== '')
            });
            setIsEditing(false);
            toast({ title: 'Cambios guardados', description: 'El informe ha sido actualizado.'});
        }
    }

    const handleCancelEdit = () => {
        setIsEditing(false);
    }

    const attendanceRate = studentData.attendance.total > 0 ? (studentData.attendance.p / studentData.attendance.total) * 100 : 0;

    return (
        <Card className="overflow-hidden">
            <div ref={reportRef} className="bg-background">
                <CardHeader className="bg-muted/30">
                     <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                        <Image
                            src={studentData.photo}
                            alt={studentData.name}
                            width={100}
                            height={100}
                            className="rounded-full border-4"
                            style={{borderColor: studentData.riskLevel === 'high' ? 'hsl(var(--destructive))' : 'hsl(var(--chart-4))'}}
                        />
                        <div className="pt-2 flex-grow">
                            <CardTitle className="text-2xl">{studentData.name}</CardTitle>
                            <div className="flex flex-col items-start mt-1 space-y-1">
                                 <CardDescription className="flex items-center gap-2">
                                    {studentData.riskLevel === 'high' 
                                        ? <Badge variant="destructive">Riesgo Alto</Badge> 
                                        : <Badge className="bg-amber-500">Riesgo Medio</Badge>
                                    }
                                </CardDescription>
                                <span className="text-xs text-muted-foreground">{studentData.riskReason}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                <p className="flex items-center gap-2"><Mail className="h-4 w-4"/> {studentData.email || 'No registrado'}</p>
                                <p className="flex items-center gap-2"><User className="h-4 w-4"/> Tutor: {studentData.tutorName || 'No registrado'}</p>
                                <p className="flex items-center gap-2"><Phone className="h-4 w-4"/> Tel. Tutor: {studentData.tutorPhone || 'No registrado'}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       <div className="space-y-4">
                           <h4 className="font-semibold flex items-center gap-2"><ListChecks /> Desglose de Calificación</h4>
                           <div className="p-3 border rounded-md text-sm space-y-2">
                               {studentData.criteriaDetails.map(c => (
                                   <div key={c.name} className="flex justify-between items-center">
                                       <span>{c.name} <span className="text-xs text-muted-foreground">({c.weight}%)</span></span>
                                       <Badge variant="secondary">{c.earned.toFixed(1)}%</Badge>
                                   </div>
                               ))}
                                <Separator />
                                <div className="flex justify-between font-bold pt-1">
                                    <span>Calificación Final:</span>
                                    <span>{studentData.finalGrade.toFixed(1)}%</span>
                                </div>
                           </div>
                       </div>
                       <div className="space-y-4">
                           <h4 className="font-semibold flex items-center gap-2"><AlertTriangle /> Asistencia</h4>
                            <div className="p-3 border rounded-md text-sm space-y-2">
                                <div className="flex justify-between"><span>Presente:</span><span className="font-bold flex items-center gap-1 text-green-600"><Check/>{studentData.attendance.p}</span></div>
                                <div className="flex justify-between"><span>Ausente:</span><span className="font-bold flex items-center gap-1 text-red-600"><X/>{studentData.attendance.a}</span></div>
                                <Separator />
                                <div className="flex justify-between font-bold pt-1">
                                    <span>Tasa de Asistencia:</span>
                                    <span>{attendanceRate.toFixed(1)}%</span>
                                </div>
                            </div>
                       </div>
                    </div>
                     <div className="mt-6 space-y-4">
                        <h4 className="font-semibold flex items-center gap-2"><MessageSquare /> Observaciones en Bitácora</h4>
                        {studentData.observations.length > 0 ? (
                             <div className="p-3 border rounded-md text-sm space-y-3 max-h-40 overflow-y-auto">
                                {studentData.observations.map(obs => (
                                    <div key={obs.id} className="border-l-2 pl-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-bold">{obs.type}</span>
                                            <span className="text-muted-foreground">{format(new Date(obs.date), "dd MMM yyyy", { locale: es })}</span>
                                        </div>
                                        <p className="text-xs mt-1">{obs.details}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 border rounded-md text-sm text-center text-muted-foreground">
                                No hay observaciones registradas.
                            </div>
                        )}
                     </div>

                    {aiResponse && (
                        <div className="mt-6 space-y-4">
                             <h4 className="font-semibold flex items-center gap-2 text-primary"><BadgeInfo />Análisis y Recomendaciones</h4>
                              <div className="p-3 border-l-4 border-primary bg-primary/10 rounded-r-md text-sm space-y-4">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="edited-analysis" className="font-bold">Análisis de la Situación:</Label>
                                            <Textarea id="edited-analysis" value={editedAnalysis} onChange={(e) => setEditedAnalysis(e.target.value)} rows={4} />
                                        </div>
                                        <div>
                                            <Label htmlFor="edited-recommendations" className="font-bold">Plan de Acción Recomendado:</Label>
                                            <Textarea id="edited-recommendations" value={editedRecommendations} onChange={(e) => setEditedRecommendations(e.target.value)} rows={5} placeholder="Una recomendación por línea"/>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h5 className="font-bold">Análisis de la Situación:</h5>
                                            <p className="mt-1 whitespace-pre-wrap">{aiResponse.analysis}</p>
                                        </div>
                                        <div>
                                            <h5 className="font-bold">Plan de Acción Recomendado:</h5>
                                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                                {aiResponse.recommendations.map((rec, i) => (
                                                    <li key={i}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </div>

            <CardFooter className="bg-muted/50 p-3 flex justify-end gap-2">
                 <Button onClick={handleGenerateRecommendation} disabled={isGenerating || isEditing}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                    {isGenerating ? 'Analizando...' : 'Generar Análisis'}
                </Button>
                {aiResponse && (
                    isEditing ? (
                        <>
                            <Button onClick={handleSaveEdit}><Save className="mr-2 h-4 w-4" /> Guardar</Button>
                            <Button variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                        </>
                    ) : (
                        <Button variant="secondary" onClick={handleEdit}><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                    )
                )}
                <Button variant="outline" onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4"/> PDF
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function AtRiskReportPage() {
  const { 
      activeGroup,
      activePartial,
      atRiskStudents, 
      calculateFinalGrade, 
      allObservations, 
      allCriteria, 
      allGrades,
      allParticipations,
      allActivities,
      allActivityRecords,
      allAttendances
  } = useData();
  const [reportData, setReportData] = useState<StudentReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getStudentDetails = useCallback((studentId: string, partial: string, groupId: string) => {
        if (!activeGroup) return null;
        
        const criteria = allCriteria[`criteria_${groupId}_${partial}`] || [];
        const grades = allGrades[groupId]?.[partial] || {};
        const participations = allParticipations[groupId]?.[partial] || {};
        const activities = allActivities[groupId]?.[partial] || [];
        const activityRecords = allActivityRecords[groupId]?.[partial] || {};
        const attendance = allAttendances[groupId]?.[partial] || {};
        
        const studentObservations = allObservations[studentId] || [];

        const finalGrade = calculateFinalGrade(studentId, partial, groupId);

        const criteriaDetails: StudentReportData['criteriaDetails'] = criteria.map(criterion => {
             let performanceRatio = 0;
            if (criterion.name === 'Actividades') {
                const totalActivities = activities.length;
                if(totalActivities > 0) {
                    const deliveredActivities = Object.values(activityRecords[studentId] || {}).filter(Boolean).length;
                    performanceRatio = deliveredActivities / totalActivities;
                }
            } else if (criterion.name === 'Portafolio' && criterion.isAutomated) {
                const totalActivities = activities.length;
                if (totalActivities > 0) {
                    const delivered = grades[studentId]?.[criterion.id]?.delivered ?? 0;
                    performanceRatio = delivered / totalActivities;
                }
            } else if (criterion.name === 'Participación') {
                const totalClasses = Object.keys(attendance).length;
                if(totalClasses > 0) {
                    const studentParticipations = Object.values(participations).filter(p => p[studentId]).length;
                    performanceRatio = studentParticipations / totalClasses;
                }
            } else {
                const delivered = (grades[studentId]?.[criterion.id]?.delivered ?? 0);
                const expected = criterion.expectedValue;
                performanceRatio = expected > 0 ? (delivered / expected) : 0;
            }
            const earned = performanceRatio * criterion.weight;
            return { name: criterion.name, earned, weight: criterion.weight };
        });

        const attendanceStats = { p: 0, a: 0, total: 0 };
        Object.keys(attendance).forEach(date => {
            if (attendance[date]?.[studentId] !== undefined) {
                attendanceStats.total++;
                if (attendance[date][studentId]) attendanceStats.p++; else attendanceStats.a++;
            }
        });
        
        return { finalGrade, attendance: attendanceStats, criteriaDetails, observations: studentObservations };

  }, [activeGroup, allObservations, calculateFinalGrade, allCriteria, allGrades, allParticipations, allActivities, allActivityRecords, allAttendances]);


  useEffect(() => {
    if (atRiskStudents.length > 0 && activeGroup && activePartial) {
      const data = atRiskStudents
        .map(student => {
            const details = getStudentDetails(student.id, activePartial, activeGroup.id);
            if (!details) return null;
            
            return {
                id: student.id,
                name: student.name,
                photo: student.photo,
                email: student.email,
                tutorName: student.tutorName,
                tutorPhone: student.tutorPhone,
                riskLevel: student.calculatedRisk.level,
                riskReason: student.calculatedRisk.reason,
                finalGrade: details.finalGrade,
                attendance: details.attendance,
                criteriaDetails: details.criteriaDetails,
                observations: details.observations,
            };
        })
        .filter((item): item is StudentReportData => item !== null);
      
      setReportData(data);
    }
    setIsLoading(false);
  }, [atRiskStudents, activeGroup, activePartial, getStudentDetails]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Cargando informe...</span></div>;
  }
  
  if (!activeGroup) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold mt-4">No hay un grupo activo</h2>
            <p className="text-muted-foreground mt-2">Por favor, selecciona un grupo para ver este informe.</p>
            <Button asChild className="mt-4"><Link href="/groups">Seleccionar Grupo</Link></Button>
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              <Link href={`/reports/${activeGroup.id}`}>
                <ArrowLeft />
                <span className="sr-only">Volver a Informes</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Informe de Estudiantes en Riesgo</h1>
              <p className="text-muted-foreground">
                  Análisis detallado para el grupo "{activeGroup.subject}".
              </p>
            </div>
         </div>
      </div>
      
       {reportData.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {reportData.map(student => (
                 <AccordionItem value={student.id} key={student.id}>
                    <AccordionTrigger className="p-4 bg-card rounded-lg hover:bg-muted/50 data-[state=open]:rounded-b-none">
                        <div className="flex items-center gap-4">
                            <Image src={student.photo} alt={student.name} width={40} height={40} className="rounded-full" />
                            <div className="text-left">
                                <p className="font-bold">{student.name}</p>
                                <p className="text-sm text-muted-foreground">{student.riskReason}</p>
                            </div>
                        </div>
                         {student.riskLevel === 'high' 
                            ? <Badge variant="destructive">Alto</Badge> 
                            : <Badge className="bg-amber-500">Medio</Badge>
                        }
                    </AccordionTrigger>
                    <AccordionContent className="border-x border-b rounded-b-lg p-0">
                       <AtRiskStudentCard studentData={student} />
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        ) : (
            <Card>
                <CardContent className="p-12 text-center">
                     <Check className="h-16 w-16 mx-auto text-green-500 bg-green-100 rounded-full p-2" />
                     <h2 className="text-2xl font-bold mt-4">¡Todo en orden!</h2>
                     <p className="text-muted-foreground mt-2">No se han identificado estudiantes en riesgo en este grupo.</p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
