
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
  Loader2,
} from 'lucide-react';
import { Student } from '@/lib/placeholder-data';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useData } from '@/hooks/use-data';
import type { Activity, EvaluationCriteria, Grades, ParticipationRecord } from '@/hooks/use-data';


export default function ReportsPage() {
  const { 
    activeGroup, 
    criteria, 
    grades, 
    participations, 
    attendance, 
    activities, 
    activityRecords, 
    calculateFinalGrade 
  } = useData();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const quickStats = useMemo(() => {
    if (!activeGroup) return null;

    const studentCount = activeGroup.students.length;
    
    let presentCount = 0;
    let totalAttendancePossible = 0;
    
    activeGroup.students.forEach(student => {
        Object.keys(attendance).forEach(date => {
            if (attendance[date]?.[student.id] !== undefined) {
                totalAttendancePossible++;
                if(attendance[date][student.id]) presentCount++;
            }
        });
    });

    const attendanceRate = totalAttendancePossible > 0 ? (presentCount / totalAttendancePossible) * 100 : 100;

    let approvedCount = 0;
    const groupGrades = activeGroup.students.map(student => {
        const finalGrade = calculateFinalGrade(student.id, criteria, grades, participations, activities, activityRecords);
        if (finalGrade >= 70) approvedCount++;
        return finalGrade;
    });

    const groupAverage = groupGrades.length > 0 ? groupGrades.reduce((a, b) => a + b, 0) / groupGrades.length : 0;
    
    return {
        studentCount: studentCount,
        groupAverage: parseFloat(groupAverage.toFixed(1)),
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        approvedCount,
        totalAttendanceRecords: presentCount,
        criteriaCount: criteria.length,
    };
  }, [activeGroup, attendance, criteria, grades, participations, activities, activityRecords, calculateFinalGrade]);


  const handleDownloadCsv = () => {
    if (!activeGroup) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["ID Estudiante", "Nombre", ...criteria.map(c => `${c.name} (${c.weight}%)`), "Calificacion Final"];
    csvContent += headers.join(",") + "\r\n";

    activeGroup.students.forEach(student => {
        const row = [student.id, student.name];
        const finalGrade = calculateFinalGrade(student.id, criteria, grades, participations, activities, activityRecords);
        
        criteria.forEach(criterion => {
            let performanceRatio = 0;
            if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
                const totalActivities = activities.length;
                if (totalActivities > 0) {
                    const studentRecords = activityRecords[student.id] || {};
                    const deliveredActivities = Object.values(studentRecords).filter(Boolean).length;
                    performanceRatio = deliveredActivities / totalActivities;
                }
            } else if(criterion.name === 'Participación') {
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
    link.setAttribute("download", `calificaciones_${activeGroup.subject.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleStudentChange = (studentId: string) => {
      const student = activeGroup?.students.find(s => s.id === studentId);
      setSelectedStudent(student || null);
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
                <p className="text-sm text-muted-foreground">Total de asistencias del grupo:</p>
                <p className="text-3xl font-bold text-primary">{quickStats?.totalAttendanceRecords}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Reporte Académico Completo</CardTitle>
                    <CardDescription>Reporte integral con calificaciones, asistencia y estadísticas del grupo.</CardDescription>
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
                    <CardDescription>Descarga los datos de calificaciones en formato CSV para usar en Excel u otras herramientas.</CardDescription>
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
                                  {student.name}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                {selectedStudent && (
                    <div className="p-4 rounded-md bg-muted/50 border border-muted-foreground/20">
                        <h4 className="font-semibold">{selectedStudent.name}</h4>
                        <p className="text-sm text-muted-foreground">
                            Informe completo con perfil del estudiante, calificaciones detalladas, asistencia y fechas específicas.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                             <Button asChild>
                                <Link href={`/students/${selectedStudent.id}`}>
                                    <FileText className="mr-2 h-4 w-4" /> Generar Informe
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

