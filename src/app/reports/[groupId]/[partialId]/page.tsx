
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
import { ArrowLeft, Download, CheckCircle, XCircle, TrendingUp, BarChart, Users, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData, loadFromLocalStorage } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/skeleton';
import type { EvaluationCriteria, Grades, ParticipationRecord, Activity, ActivityRecord, AttendanceRecord, PartialId } from '@/hooks/use-data';
import { getPartialLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react';


type ReportSummary = {
    totalStudents: number;
    approvedCount: number;
    failedCount: number;
    groupAverage: number;
    attendanceRate: number;
    participationRate: number;
    highRiskCount: number;
    mediumRiskCount: number;
}

export default function GroupReportPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const partialId = params.partialId as PartialId;
  
  const { 
      groups,
      settings,
      getStudentRiskLevel,
  } = useData();
  
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const group = useMemo(() => groups.find(g => g.id === groupId), [groups, groupId]);

  useEffect(() => {
    if (!group || !partialId) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const studentCount = group.students.length;
      if (studentCount === 0) {
          setSummary({
              totalStudents: 0,
              approvedCount: 0,
              failedCount: 0,
              groupAverage: 0,
              attendanceRate: 100,
              participationRate: 100,
              highRiskCount: 0,
              mediumRiskCount: 0,
          });
          setIsLoading(false);
          return;
      }
      
      const keySuffix = `${group.id}_${partialId}`;
      const criteria = loadFromLocalStorage<EvaluationCriteria[]>(`criteria_${keySuffix}`, []);
      const grades = loadFromLocalStorage<Grades>(`grades_${keySuffix}`, {});
      const participations = loadFromLocalStorage<ParticipationRecord>(`participations_${keySuffix}`, {});
      const activities = loadFromLocalStorage<Activity[]>(`activities_${keySuffix}`, []);
      const activityRecords = loadFromLocalStorage<ActivityRecord>(`activityRecords_${keySuffix}`, {});
      const attendance = loadFromLocalStorage<AttendanceRecord>(`attendance_${keySuffix}`, {});

      let approved = 0;
      let totalGroupGrade = 0;
      let totalPossibleAttendance = 0;
      let totalPresent = 0;
      
      const studentGrades = group.students.map(student => {
        let finalGrade = 0;
        if (criteria.length > 0) {
            for (const c of criteria) {
                let performanceRatio = 0;
                 if (c.name === 'Actividades' || c.name === 'Portafolio') {
                    const total = activities.length;
                    if(total > 0) {
                        const delivered = Object.values(activityRecords[student.id] || {}).filter(Boolean).length;
                        performanceRatio = delivered / total;
                    }
                } else if (c.name === 'Participación') {
                    const participationDates = Object.keys(participations);
                    const studentParticipationOpportunities = participationDates.filter(date => Object.prototype.hasOwnProperty.call(participations[date], student.id)).length;
                    if (studentParticipationOpportunities > 0) {
                        const studentParticipations = Object.values(participations).filter(p => p[student.id]).length;
                        performanceRatio = studentParticipations / studentParticipationOpportunities;
                    }
                } else {
                    const deliveredValue = grades[student.id]?.[c.id]?.delivered ?? 0;
                    if(c.expectedValue > 0) {
                       performanceRatio = deliveredValue / c.expectedValue;
                    }
                }
                finalGrade += performanceRatio * c.weight;
            }
        }
        return Math.max(0, Math.min(100, finalGrade));
      });

      const highRiskStudents = new Set<string>();
      const mediumRiskStudents = new Set<string>();

      group.students.forEach((student, index) => {
        const finalGrade = studentGrades[index];
        totalGroupGrade += finalGrade;
        if (finalGrade >= 70) approved++;

        const risk = getStudentRiskLevel(finalGrade, attendance, student.id);
        if (risk.level === 'high') highRiskStudents.add(student.id);
        else if (risk.level === 'medium') mediumRiskStudents.add(student.id);
      });
      
      let totalParticipations = 0;
      let totalParticipationOpportunities = 0;
      const participationDates = Object.keys(participations);
      if (participationDates.length > 0 && studentCount > 0) {
          totalParticipations = group.students.reduce((sum, student) => {
              return sum + participationDates.reduce((studentSum, date) => {
                  return studentSum + (participations[date]?.[student.id] ? 1 : 0);
              }, 0);
          }, 0);
           totalParticipationOpportunities = group.students.reduce((sum, student) => {
                return sum + participationDates.filter(date => Object.prototype.hasOwnProperty.call(participations[date], student.id)).length;
            }, 0);
      }
      
      Object.keys(attendance).forEach(date => {
          group.students.forEach(student => {
              if (attendance[date]?.[student.id] !== undefined) {
                  totalPossibleAttendance++;
                  if (attendance[date][student.id]) totalPresent++;
              }
          });
      });
      
      setSummary({
          totalStudents: studentCount,
          approvedCount: approved,
          failedCount: studentCount - approved,
          groupAverage: studentCount > 0 ? totalGroupGrade / studentCount : 0,
          attendanceRate: totalPossibleAttendance > 0 ? (totalPresent / totalPossibleAttendance) * 100 : 100,
          participationRate: totalParticipationOpportunities > 0 ? (totalParticipations / totalParticipationOpportunities) * 100 : 100,
          highRiskCount: highRiskStudents.size,
          mediumRiskCount: mediumRiskStudents.size,
      });

    } catch (e) {
      console.error("Failed to generate report data", e);
    } finally {
      setIsLoading(false);
    }
  }, [group, partialId, groups, getStudentRiskLevel]);

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
        pdf.save(`informe_grupal_${group?.subject.replace(/\s+/g, '_') || 'reporte'}.pdf`);
      });
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Generando informe...</span></div>;
  }

  if (!group || !summary) {
    return notFound();
  }

  const partials: PartialId[] = ['p1', 'p2', 'p3'];

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              <Link href="/reports">
                <ArrowLeft />
                <span className="sr-only">Volver a Informes</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Informe General del Grupo</h1>
              <p className="text-muted-foreground">
                  Resumen global de "{group.subject}"
              </p>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        {getPartialLabel(partialId)}
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {partials.map(p => (
                        <Link href={`/reports/${groupId}/${p}`} key={p}>
                            <DropdownMenuItem disabled={p === partialId}>
                                {getPartialLabel(p)}
                            </DropdownMenuItem>
                        </Link>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
         </div>
         <Button onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4"/>
            Descargar Informe
         </Button>
      </div>

      <Card ref={reportRef} id="report-content" className="p-4 sm:p-6 md:p-8">
        <header className="border-b pb-6 mb-6">
           <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold">{settings.institutionName}</h1>
                    <p className="text-lg text-muted-foreground">Informe de Rendimiento Académico Grupal</p>
                </div>
                 {isClient && settings.logo ? (
                    <Image
                        src={settings.logo}
                        alt="Logo de la Institución"
                        width={80}
                        height={80}
                        className="object-contain"
                    />
                 ): <Skeleton className="w-[80px] h-[80px]" /> }
           </div>
           <div className="pt-4 flex justify-between text-sm text-muted-foreground">
                <div>
                    <span className="font-semibold text-foreground">Asignatura: </span>
                    <span>{group.subject}</span>
                </div>
                 <div>
                    <span className="font-semibold text-foreground">Parcial: </span>
                    <span>{getPartialLabel(partialId)}</span>
                </div>
                <div>
                    <span className="font-semibold text-foreground">Fecha del Informe: </span>
                    <span>{format(new Date(), 'PPP', {locale: es})}</span>
                </div>
           </div>
        </header>

        <section>
            <h2 className="text-xl font-semibold mb-4">Resumen General del Grupo</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
                Por medio del presente, se muestran los resultados generales obtenidos durante el parcial actual para el grupo 
                de <span className="font-bold text-foreground">{group.subject}</span>, que cuenta con un total de 
                <span className="font-bold text-foreground"> {summary.totalStudents} estudiante(s)</span>.
            </p>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
                <Card className="text-center">
                    <CardHeader><CardTitle className="text-base">Aprobación</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{summary.approvedCount} <span className="text-base font-normal text-muted-foreground">de {summary.totalStudents}</span></p>
                         <p className="text-sm text-green-600 flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4"/> Aprobados</p>
                         <p className="text-sm text-red-600 flex items-center justify-center gap-1"><XCircle className="h-4 w-4"/> Reprobados: {summary.failedCount}</p>
                    </CardContent>
                </Card>
                 <Card className="text-center">
                    <CardHeader><CardTitle className="text-base">Promedio General</CardTitle></CardHeader>
                    <CardContent>
                         <p className="text-3xl font-bold">{summary.groupAverage.toFixed(1)} <span className="text-base font-normal text-muted-foreground">/ 100</span></p>
                         <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><TrendingUp className="h-4 w-4"/> Calificación media del grupo</p>
                    </CardContent>
                </Card>
                 <Card className="text-center">
                    <CardHeader><CardTitle className="text-base">Asistencia y Participación</CardTitle></CardHeader>
                     <CardContent>
                         <p className="text-3xl font-bold">{summary.attendanceRate.toFixed(1)}%</p>
                         <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><BarChart className="h-4 w-4"/> Tasa de Asistencia General</p>
                         <p className="text-xl font-bold mt-2">{summary.participationRate.toFixed(1)}%</p>
                         <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><BarChart className="h-4 w-4"/> Tasa de Participación</p>
                    </CardContent>
                </Card>
             </div>
             
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                {(summary.highRiskCount > 0 || summary.mediumRiskCount > 0) && (
                    <p>
                        Se ha identificado que <span className="font-bold text-destructive">{summary.highRiskCount} estudiante(s)</span> se encuentran en <span className="font-bold text-destructive">riesgo alto</span> y 
                        <span className="font-bold text-amber-600"> {summary.mediumRiskCount} estudiante(s)</span> en <span className="font-bold text-amber-600">riesgo medio</span>, basado en su rendimiento y asistencia.
                    </p>
                )}

                <p>
                    No se han registrado observaciones, canalizaciones o seguimientos para ningún estudiante de este grupo durante el periodo.
                </p>

            </div>

        </section>

        <footer className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
            <div className="mt-12 pt-12">
                <div className="inline-block">
                    <div className="border-t border-foreground w-48 mx-auto"></div>
                    <p className="mt-2 font-semibold">Nombre del Docente</p>
                    <p>Firma del Docente</p>
                </div>
            </div>
            <p className="mt-8">Fin del informe.</p>
        </footer>
      </Card>
    </div>
  );
}

    