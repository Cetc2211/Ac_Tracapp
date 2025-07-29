

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Printer, CheckCircle, XCircle, TrendingUp, BarChart, Users, Eye } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Group, Student, StudentObservation } from '@/lib/placeholder-data';
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
};

type Grades = {
  [studentId: string]: {
    [criterionId: string]: GradeDetail;
  };
};

type ParticipationRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

type GlobalAttendanceRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

type ReportSummary = {
    totalStudents: number;
    approvedCount: number;
    failedCount: number;
    groupAverage: number;
    attendanceRate: number;
    participationRate: number;
    studentsWithObservations: number;
    canalizedCount: number;
    followUpCount: number;
    improvedCount: number;
    stillInObservationCount: number;
}

export default function GroupReportPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [institutionName, setInstitutionName] = useState('Academic Tracker');
  const [institutionLogo, setInstitutionLogo] = useState('');

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
    if (!groupId) return;
    setIsLoading(true);
    try {
      const storedGroups: Group[] = JSON.parse(localStorage.getItem('groups') || '[]');
      const currentGroup = storedGroups.find(g => g.id === groupId);
      setGroup(currentGroup || null);

      if (currentGroup) {
        const criteria: EvaluationCriteria[] = JSON.parse(localStorage.getItem(`criteria_${groupId}`) || '[]');
        const grades: Grades = JSON.parse(localStorage.getItem(`grades_${groupId}`) || '{}');
        const participations: ParticipationRecord = JSON.parse(localStorage.getItem(`participations_${groupId}`) || '{}');
        const attendance: GlobalAttendanceRecord = JSON.parse(localStorage.getItem('globalAttendance') || '{}');

        // Calculations
        let approved = 0;
        let studentsWithObservations = 0;
        let canalizedStudents = 0;
        let followUpStudents = 0;
        let improvedStudents = 0;
        let stillInObservationStudents = 0;
        let totalGroupGrade = 0;
        let totalPossibleAttendance = 0;
        let totalPresent = 0;
        let totalParticipations = 0;
        let totalParticipationOpportunities = 0;

        currentGroup.students.forEach(student => {
          const finalGrade = calculateFinalGrade(student.id, criteria, grades, participations);
          totalGroupGrade += finalGrade;
          if (finalGrade >= 70) approved++;
          
          const studentObservations: StudentObservation[] = JSON.parse(localStorage.getItem(`observations_${student.id}`) || '[]');
          if(studentObservations.length > 0) {
              studentsWithObservations++;
              if(studentObservations.some(o => o.requiresCanalization)) canalizedStudents++;
              if(studentObservations.some(o => o.requiresFollowUp)) {
                  followUpStudents++;
                  const followUpCases = studentObservations.filter(o => o.requiresFollowUp);
                  if (followUpCases.some(c => c.isClosed)) {
                      improvedStudents++;
                  } else {
                      stillInObservationStudents++;
                  }
              }
          }
          
          Object.keys(attendance).forEach(date => {
              if (attendance[date]?.[student.id] !== undefined) {
                  totalPossibleAttendance++;
                  if(attendance[date][student.id]) totalPresent++;
              }
          });
          
          Object.keys(participations).forEach(date => {
              if (Object.prototype.hasOwnProperty.call(participations[date], student.id)) {
                  totalParticipationOpportunities++;
                  if (participations[date]?.[student.id]) totalParticipations++;
              }
          })
        });
        
        const studentCount = currentGroup.students.length;
        setSummary({
            totalStudents: studentCount,
            approvedCount: approved,
            failedCount: studentCount - approved,
            groupAverage: studentCount > 0 ? totalGroupGrade / studentCount : 0,
            attendanceRate: totalPossibleAttendance > 0 ? (totalPresent / totalPossibleAttendance) * 100 : 0,
            participationRate: totalParticipationOpportunities > 0 ? (totalParticipations / totalParticipationOpportunities) * 100 : 0,
            studentsWithObservations: studentsWithObservations,
            canalizedCount: canalizedStudents,
            followUpCount: followUpStudents,
            improvedCount: improvedStudents,
            stillInObservationCount: stillInObservationStudents,
        });
      }
      
      const appSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
      setInstitutionName(appSettings.institutionName || 'Academic Tracker');
      setInstitutionLogo(appSettings.logo || '');

    } catch (e) {
      console.error("Failed to generate report data", e);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, calculateFinalGrade]);

  const handlePrint = () => {
    window.print();
  };
  
  if (isLoading) {
    return <div>Generando informe...</div>;
  }

  if (!group || !summary) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between print:hidden">
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
                  Resumen global de "{group.subject}".
              </p>
            </div>
         </div>
         <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4"/>
            Imprimir Informe
         </Button>
      </div>

      <Card id="report-content" className="p-4 sm:p-6 md:p-8 print:shadow-none print:border-none">
        <header className="border-b pb-6 mb-6">
           <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold">{institutionName}</h1>
                    <p className="text-lg text-muted-foreground">Informe de Rendimiento Académico Grupal</p>
                </div>
                 {institutionLogo && (
                    <Image
                        src={institutionLogo}
                        alt="Logo de la Institución"
                        width={80}
                        height={80}
                        className="object-contain"
                    />
                 )}
           </div>
           <div className="pt-4 flex justify-between text-sm text-muted-foreground">
                <div>
                    <span className="font-semibold text-foreground">Asignatura: </span>
                    <span>{group.subject}</span>
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
                Por medio del presente, se muestran los resultados generales obtenidos durante el semestre actual para el grupo 
                de <span className="font-bold text-foreground">{group.subject}</span>, que cuenta con un total de 
                <span className="font-bold text-foreground"> {summary.totalStudents} estudiante(s)</span>.
            </p>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6 print:grid-cols-3">
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

            {summary.studentsWithObservations > 0 && (
              <p className="text-muted-foreground leading-relaxed mt-4">
                En cuanto al seguimiento, se han registrado observaciones en la bitácora para <span className="font-bold text-foreground">{summary.studentsWithObservations} estudiante(s)</span>.
                {summary.canalizedCount > 0 && ` De estos, ${summary.canalizedCount} fueron canalizados para atención especial.`}
                {summary.followUpCount > 0 && ` Se ha marcado que ${summary.followUpCount} estudiante(s) requieren seguimiento docente.`}
                {summary.followUpCount > 0 && (
                  <>
                    {` De ellos, ${summary.improvedCount} han mostrado mejoría y ${summary.stillInObservationCount} continúan en observación.`}
                  </>
                )}
              </p>
            )}
            {summary.studentsWithObservations === 0 && (
                 <p className="text-muted-foreground leading-relaxed mt-4">
                    No se han registrado observaciones, canalizaciones o seguimientos para ningún estudiante de este grupo durante el periodo.
                </p>
            )}
        </section>

        <footer className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
            <p>Fin del informe.</p>
        </footer>
      </Card>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content, #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

    
