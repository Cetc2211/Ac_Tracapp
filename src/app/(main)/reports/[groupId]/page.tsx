
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { ArrowLeft, Printer } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Group, Student } from '@/lib/placeholder-data';
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

type StudentReportData = {
  student: Student;
  finalGrade: string;
  attendance: number;
  absences: number;
  participations: number;
};

export default function GroupReportPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [reportData, setReportData] = useState<StudentReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [institutionName, setInstitutionName] = useState('Academic Tracker');
  const [institutionLogo, setInstitutionLogo] = useState('');

  const calculateFinalGrade = useCallback((studentId: string, criteria: EvaluationCriteria[], grades: Grades, participations: ParticipationRecord) => {
    if (!criteria || criteria.length === 0) return '0%';
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
    return `${finalGrade.toFixed(0)}%`;
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

        const totalClassesWithParticipation = Object.keys(participations).length;
        const allAttendanceDates = Object.keys(attendance);

        const studentData = currentGroup.students.map(student => {
          const finalGrade = calculateFinalGrade(student.id, criteria, grades, participations);

          let attendanceCount = 0;
          let absenceCount = 0;
          allAttendanceDates.forEach(date => {
            if (attendance[date]?.[student.id] === true) {
              attendanceCount++;
            } else if (attendance[date]?.[student.id] === false) {
              absenceCount++;
            }
          });
          
          let participationCount = 0;
          if (totalClassesWithParticipation > 0) {
            participationCount = Object.values(participations).filter(day => day[student.id]).length;
          }

          return {
            student,
            finalGrade,
            attendance: attendanceCount,
            absences: absenceCount,
            participations: participationCount,
          };
        }).sort((a, b) => a.student.name.localeCompare(b.student.name));
        
        setReportData(studentData);
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

  if (!group) {
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
              <h1 className="text-3xl font-bold">Informe del Grupo</h1>
              <p className="text-muted-foreground">
                  Resumen de calificaciones y asistencia para "{group.subject}".
              </p>
            </div>
         </div>
         <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4"/>
            Imprimir Informe
         </Button>
      </div>

      <Card id="report-content">
        <CardHeader className="border-b">
           <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold">{institutionName}</h1>
                    <p className="text-lg">Informe de Rendimiento del Grupo</p>
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
           <div className="pt-4 flex justify-between text-sm">
                <div>
                    <span className="font-bold">Asignatura: </span>
                    <span>{group.subject}</span>
                </div>
                <div>
                    <span className="font-bold">Fecha del Informe: </span>
                    <span>{format(new Date(), 'PPP', {locale: es})}</span>
                </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Estudiante</TableHead>
                  <TableHead className="text-center">Calificación Final</TableHead>
                  <TableHead className="text-center">Asistencias</TableHead>
                  <TableHead className="text-center">Inasistencias</TableHead>
                  <TableHead className="text-center">Participaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map(data => (
                  <TableRow key={data.student.id}>
                    <TableCell className="font-medium flex items-center gap-3">
                       <Image
                        src={data.student.photo}
                        alt={data.student.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      {data.student.name}
                    </TableCell>
                    <TableCell className="text-center font-bold text-lg">{data.finalGrade}</TableCell>
                    <TableCell className="text-center">{data.attendance}</TableCell>
                    <TableCell className="text-center">{data.absences}</TableCell>
                    <TableCell className="text-center">{data.participations}</TableCell>
                  </TableRow>
                ))}
                {reportData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No hay estudiantes en este grupo para generar un informe.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
        <CardHeader className="border-t mt-4">
             <div className="text-xs text-muted-foreground text-center">
                Fin del informe.
            </div>
        </CardHeader>
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
