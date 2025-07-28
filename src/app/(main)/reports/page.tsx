

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
import {
  FileText,
  Users,
  Download,
  Percent,
  TrendingUp,
  CheckCircle,
  BarChart,
  Eye,
  BookOpenCheck,
  User,
  Printer,
} from 'lucide-react';
import { Group, Student, StudentObservation } from '@/lib/placeholder-data';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';


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

type QuickStats = {
    studentCount: number;
    groupAverage: number;
    attendanceRate: number;
    approvedCount: number;
    totalAttendanceRecords: number;
    criteriaCount: number;
}


export default function ReportsPage() {
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
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
    try {
      setIsLoading(true);
      const activeGroupId = localStorage.getItem('activeGroupId');
      if (!activeGroupId) {
          setIsLoading(false);
          return;
      }

      const allGroups: Group[] = JSON.parse(localStorage.getItem('groups') || '[]');
      const group = allGroups.find(g => g.id === activeGroupId);
      setActiveGroup(group || null);

      if (group) {
        setSelectedStudent(group.students.sort((a,b) => a.name.localeCompare(b.name))[0] || null);

        const criteria: EvaluationCriteria[] = JSON.parse(localStorage.getItem(`criteria_${group.id}`) || '[]');
        const grades: Grades = JSON.parse(localStorage.getItem(`grades_${group.id}`) || '{}');
        const participations: ParticipationRecord = JSON.parse(localStorage.getItem(`participations_${group.id}`) || '{}');
        const attendance: GlobalAttendanceRecord = JSON.parse(localStorage.getItem('globalAttendance') || '{}');
        
        const allAttendanceDates = Object.keys(attendance);
        let totalAttendanceRecords = 0;
        let presentCount = 0;
        
        allAttendanceDates.forEach(date => {
            Object.keys(attendance[date]).forEach(studentId => {
                if(group.students.some(s => s.id === studentId)) {
                    totalAttendanceRecords++;
                    if(attendance[date][studentId] === true) {
                        presentCount++;
                    }
                }
            })
        });

        const attendanceRate = totalAttendanceRecords > 0 ? (presentCount / totalAttendanceRecords) * 100 : 100;

        let approvedCount = 0;
        const groupGrades = group.students.map(student => {
            const finalGrade = calculateFinalGrade(student.id, criteria, grades, participations);
            if (finalGrade >= 70) approvedCount++;
            return finalGrade;
        });

        const groupAverage = groupGrades.length > 0 ? groupGrades.reduce((a, b) => a + b, 0) / groupGrades.length : 0;
        
        setQuickStats({
            studentCount: group.students.length,
            groupAverage: parseFloat(groupAverage.toFixed(1)),
            attendanceRate: parseFloat(attendanceRate.toFixed(1)),
            approvedCount,
            totalAttendanceRecords: presentCount,
            criteriaCount: criteria.length,
        });
      }

    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateFinalGrade]);

  const handleDownloadCsv = () => {
    if (!activeGroup) return;

    const criteria: EvaluationCriteria[] = JSON.parse(localStorage.getItem(`criteria_${activeGroup.id}`) || '[]');
    const grades: Grades = JSON.parse(localStorage.getItem(`grades_${activeGroup.id}`) || '{}');
    const participations: ParticipationRecord = JSON.parse(localStorage.getItem(`participations_${activeGroup.id}`) || '{}');

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["ID Estudiante", "Nombre", ...criteria.map(c => `${c.name} (${c.weight}%)`), "Calificacion Final"];
    csvContent += headers.join(",") + "\r\n";

    activeGroup.students.forEach(student => {
        const row = [student.id, student.name];
        const finalGrade = calculateFinalGrade(student.id, criteria, grades, participations);
        
        criteria.forEach(criterion => {
            let performanceRatio = 0;
            if(criterion.name === 'Participación') {
                 const participationDates = Object.keys(participations);
                if (participationDates.length > 0) {
                    const studentParticipations = Object.values(participations).filter(p => p[student.id]).length;
                    performanceRatio = studentParticipations / participationDates.length;
                }
            } else {
                const gradeDetail = grades[student.id]?.[criterion.id];
                const delivered = gradeDetail?.delivered ?? 0;
                const expected = criterion.expectedValue;
                if(expected > 0) {
                    performanceRatio = delivered / expected;
                }
            }
            const earnedPercentage = performanceRatio * criterion.weight;
            row.push(earnedPercentage.toFixed(2));
        });
        
        row.push(finalGrade.toFixed(2));
        csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `calificaciones_${activeGroup.subject.replace(/\\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleStudentChange = (studentId: string) => {
      const student = activeGroup?.students.find(s => s.id === studentId);
      setSelectedStudent(student || null);
  }

  if (isLoading) {
      return <div>Cargando...</div>;
  }
  
  if (!activeGroup) {
      return (
        <div className="flex flex-col gap-6">
            <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                    <div className="bg-muted rounded-full p-4">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle>No hay un grupo activo</CardTitle>
                    <CardDescription>
                        Para ver esta sección, por favor <Link href="/groups" className="text-primary underline">selecciona un grupo</Link> primero.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Reportes e Informes</h1>
        <p className="text-muted-foreground">
          Genera reportes académicos personalizados para tu grupo activo.
        </p>
      </div>

       <Card className="bg-muted/30">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-primary flex items-center gap-2"><BookOpenCheck /> Grupo Activo</p>
                <CardTitle className="text-2xl mt-1">{activeGroup.subject}</CardTitle>
                <CardDescription>{quickStats?.studentCount} estudiantes • {quickStats?.criteriaCount} criterios de evaluación</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total de registros de asistencia:</p>
                <p className="text-3xl font-bold text-primary">{quickStats?.totalAttendanceRecords}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText /> Reporte de Calificaciones</CardTitle>
                  <CardDescription>Calificaciones detalladas por estudiante y parcial</CardDescription>
              </CardHeader>
              <CardFooter>
                  <Button className="w-full">
                      <Eye className="mr-2 h-4 w-4" /> Vista Previa y Descarga
                  </Button>
              </CardFooter>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart /> Reporte de Asistencia</CardTitle>
                  <CardDescription>Estadísticas de asistencia por estudiante</CardDescription>
              </CardHeader>
              <CardFooter>
                   <Button className="w-full">
                      <Eye className="mr-2 h-4 w-4" /> Vista Previa y Descarga
                  </Button>
              </CardFooter>
          </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Reporte Académico Completo</CardTitle>
                    <CardDescription>Reporte integral con calificaciones, asistencia y estadísticas</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button className="w-full" asChild>
                        <Link href={`/reports/${activeGroup.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> Vista Previa y Descarga
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Download /> Exportar Calificaciones (CSV)</CardTitle>
                    <CardDescription>Datos de calificaciones en formato CSV para Excel</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button variant="secondary" className="w-full" onClick={handleDownloadCsv}>
                        <Download className="mr-2 h-4 w-4" /> Descargar CSV
                    </Button>
                </CardFooter>
            </Card>
        </div>
         <Card>
            <CardHeader>
                <CardTitle>Estadísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="flex flex-col items-center gap-1">
                    <p className="text-3xl font-bold text-green-600">{quickStats?.studentCount}</p>
                    <p className="text-sm text-muted-foreground">Estudiantes</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-3xl font-bold text-blue-600">{quickStats?.groupAverage}</p>
                    <p className="text-sm text-muted-foreground">Promedio del Grupo</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-3xl font-bold text-yellow-500">{quickStats?.attendanceRate}%</p>
                    <p className="text-sm text-muted-foreground">Asistencia</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-3xl font-bold text-purple-600">{quickStats?.approvedCount}</p>
                    <p className="text-sm text-muted-foreground">Aprobados (≥70)</p>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User /> Informes Individuales de Estudiantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                  <Label>Seleccionar Estudiante:</Label>
                   <Select onValueChange={handleStudentChange} defaultValue={selectedStudent?.id}>
                      <SelectTrigger>
                          <SelectValue placeholder="Seleccionar Estudiante..." />
                      </SelectTrigger>
                      <SelectContent>
                          {activeGroup.students.sort((a,b) => a.name.localeCompare(b.name)).map(student => (
                              <SelectItem key={student.id} value={student.id}>
                                  {student.name} ({student.email})
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                {selectedStudent && (
                    <div className="p-4 rounded-md bg-muted/50 border border-muted-foreground/20">
                        <h4 className="font-semibold">{selectedStudent.name}</h4>
                        <p className="text-sm text-muted-foreground">
                            Informe completo con perfil del estudiante, calificaciones detalladas, asistencia y fechas específicas
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                             <Button asChild size="sm" variant="secondary">
                                <Link href={`/students/${selectedStudent.id}`}>
                                    <Eye className="mr-2 h-4 w-4" /> Ver Informe Visual
                                </Link>
                            </Button>
                             <Button size="sm" variant="secondary">
                                <Printer className="mr-2 h-4 w-4" /> Formato Impresión
                            </Button>
                             <Button size="sm" variant="secondary">
                                <FileText className="mr-2 h-4 w-4" /> Ver Informe Texto
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

    