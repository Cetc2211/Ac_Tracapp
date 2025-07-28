
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts"
import { Badge } from '@/components/ui/badge';
import { Student, Group, StudentObservation } from '@/lib/placeholder-data';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, UserCheck, UserX, AlertTriangle, BookOpen, Star, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

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
    [studentId:string]: boolean;
  }
}

type DailyAttendance = {
    [date: string]: { [studentId: string]: 'present' | 'absent' | 'late' };
}

type GroupStats = {
  id: string;
  subject: string;
  studentCount: number;
  averageGrade: number;
  attendanceRate: number;
  riskLevels: { low: number; medium: number; high: number; };
};

type ActiveGroupStats = {
  approvalRate: { approved: number; failed: number };
  attendanceRate: { present: number; absent: number; late: number };
  observationCount: number;
  canalizationCount: number;
  followUpCount: number;
  bestStudents: Student[];
  atRiskStudents: Student[];
  lowParticipationStudents: {student: Student, participationRate: number}[];
}

const PIE_CHART_COLORS = {
    low: "hsl(var(--chart-2))",
    medium: "hsl(var(--chart-4))",
    high: "hsl(var(--destructive))",
    approved: "hsl(var(--chart-2))",
    failed: "hsl(var(--destructive))",
    present: "hsl(var(--chart-2))",
    absent: "hsl(var(--destructive))",
    late: "hsl(var(--chart-4))",
};


export default function StatisticsPage() {
    const [stats, setStats] = useState<GroupStats[]>([]);
    const [activeGroupStats, setActiveGroupStats] = useState<ActiveGroupStats | null>(null);
    const [activeGroupName, setActiveGroupName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const calculateFinalGrade = useCallback((studentId: string, criteria: EvaluationCriteria[], grades: Grades, participations: ParticipationRecord) => {
        if (!criteria || criteria.length === 0) return 0;
        let finalGrade = 0;
        
        for (const criterion of criteria) {
            let performanceRatio = 0;

            if(criterion.name === 'Participación') {
                const pData = Object.values(participations).map(daily => daily[studentId]).filter(Boolean);
                const totalClassesWithParticipation = Object.keys(participations).length;
                if(totalClassesWithParticipation > 0) {
                    performanceRatio = pData.length / totalClassesWithParticipation;
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

    const getStudentRiskLevel = useCallback((finalGrade: number, attendance: DailyAttendance, studentId: string) => {
        const totalDays = Object.keys(attendance).length;
        let absences = 0;
        if (totalDays > 0) {
            for (const date in attendance) {
                if (attendance[date]?.[studentId] === 'absent') {
                    absences++;
                }
            }
        }
        const absencePercentage = totalDays > 0 ? (absences / totalDays) * 100 : 0;
        if (finalGrade < 70 || absencePercentage > 20) return 'high';
        if (finalGrade < 80 || absencePercentage > 10) return 'medium';
        return 'low';
    }, []);

    useEffect(() => {
        try {
            setIsLoading(true);
            const storedGroups: Group[] = JSON.parse(localStorage.getItem('groups') || '[]');
            const activeGroupId = localStorage.getItem('activeGroupId');

            // General Stats Calculation
            const calculatedStats = storedGroups.map(group => {
                const criteria: EvaluationCriteria[] = JSON.parse(localStorage.getItem(`criteria_${group.id}`) || '[]');
                const grades: Grades = JSON.parse(localStorage.getItem(`grades_${group.id}`) || '{}');
                const attendance: DailyAttendance = JSON.parse(localStorage.getItem(`attendance_${group.id}`) || '{}');
                const participations: ParticipationRecord = JSON.parse(localStorage.getItem(`participations_${group.id}`) || '{}');

                const groupGrades = group.students.map(s => calculateFinalGrade(s.id, criteria, grades, participations));
                const averageGrade = groupGrades.length > 0 ? groupGrades.reduce((a, b) => a + b, 0) / groupGrades.length : 0;

                let totalAttendances = 0;
                let presentAttendances = 0;
                const riskLevels = { low: 0, medium: 0, high: 0 };
                
                group.students.forEach(student => {
                    const studentFinalGrade = calculateFinalGrade(student.id, criteria, grades, participations);
                    const risk = getStudentRiskLevel(studentFinalGrade, attendance, student.id);
                    riskLevels[risk]++;
                    
                    Object.values(attendance).forEach(dailyRecord => {
                        if (dailyRecord.hasOwnProperty(student.id)) {
                            totalAttendances++;
                            if (dailyRecord[student.id] === 'present') {
                                presentAttendances++;
                            }
                        }
                    });
                });

                const attendanceRate = totalAttendances > 0 ? (presentAttendances / totalAttendances) * 100 : 100;

                return {
                    id: group.id,
                    subject: group.subject,
                    studentCount: group.students.length,
                    averageGrade: parseFloat(averageGrade.toFixed(1)),
                    attendanceRate: parseFloat(attendanceRate.toFixed(1)),
                    riskLevels
                };
            });
            setStats(calculatedStats);

            // Active Group Stats Calculation
            if(activeGroupId) {
                const activeGroup = storedGroups.find(g => g.id === activeGroupId);
                if (activeGroup) {
                    setActiveGroupName(activeGroup.subject);
                    const criteria: EvaluationCriteria[] = JSON.parse(localStorage.getItem(`criteria_${activeGroup.id}`) || '[]');
                    const grades: Grades = JSON.parse(localStorage.getItem(`grades_${activeGroup.id}`) || '{}');
                    const attendance: DailyAttendance = JSON.parse(localStorage.getItem(`attendance_${activeGroup.id}`) || '{}');
                    const participations: ParticipationRecord = JSON.parse(localStorage.getItem(`participations_${activeGroup.id}`) || '{}');
                    
                    let approved = 0, failed = 0;
                    let present = 0, absent = 0, late = 0;
                    let observationCount = 0, canalizationCount = 0, followUpCount = 0;
                    const studentGrades: {student: Student, grade: number}[] = [];
                    const atRiskStudents: Student[] = [];
                    const lowParticipationStudents: {student: Student, participationRate: number}[] = [];

                    for(const student of activeGroup.students) {
                        const finalGrade = calculateFinalGrade(student.id, criteria, grades, participations);
                        studentGrades.push({student, grade: finalGrade});
                        if(finalGrade >= 70) approved++; else failed++;
                        
                        const risk = getStudentRiskLevel(finalGrade, attendance, student.id);
                        if (risk === 'high' || risk === 'medium') {
                            atRiskStudents.push(student);
                        }

                        const studentObservations: StudentObservation[] = JSON.parse(localStorage.getItem(`observations_${student.id}`) || '[]');
                        observationCount += studentObservations.length;
                        canalizationCount += studentObservations.filter(o => o.requiresCanalization).length;
                        followUpCount += studentObservations.filter(o => o.requiresFollowUp).length;

                        const totalParticipationClasses = Object.keys(participations).length;
                        if(totalParticipationClasses > 0) {
                            const studentParticipations = Object.values(participations).filter(day => day[student.id]).length;
                            const participationRate = (studentParticipations / totalParticipationClasses) * 100;
                            if(participationRate < 50) { // Threshold for low participation
                                lowParticipationStudents.push({student, participationRate});
                            }
                        }
                    }

                     Object.values(attendance).forEach(dailyRecord => {
                        Object.values(dailyRecord).forEach(status => {
                            if(status === 'present') present++;
                            else if(status === 'absent') absent++;
                            else if(status === 'late') late++;
                        })
                    });

                    studentGrades.sort((a,b) => b.grade - a.grade);
                    lowParticipationStudents.sort((a,b) => a.participationRate - b.participationRate);

                    setActiveGroupStats({
                        approvalRate: { approved, failed },
                        attendanceRate: { present, absent, late },
                        observationCount,
                        canalizationCount,
                        followUpCount,
                        bestStudents: studentGrades.slice(0,3).map(s => s.student),
                        atRiskStudents,
                        lowParticipationStudents,
                    });
                }
            } else {
                 setActiveGroupStats(null);
                 setActiveGroupName(null);
            }

        } catch (e) {
            console.error("Failed to calculate statistics", e);
        } finally {
            setIsLoading(false);
        }
    }, [calculateFinalGrade, getStudentRiskLevel]);

    const approvalData = useMemo(() => {
        if (!activeGroupStats) return [];
        return [
            { name: 'Aprobados', value: activeGroupStats.approvalRate.approved, fill: PIE_CHART_COLORS.approved },
            { name: 'Reprobados', value: activeGroupStats.approvalRate.failed, fill: PIE_CHART_COLORS.failed },
        ].filter(item => item.value > 0);
    }, [activeGroupStats]);

    const attendanceData = useMemo(() => {
        if (!activeGroupStats) return [];
        return [
            { name: 'Asistencias', value: activeGroupStats.attendanceRate.present, fill: PIE_CHART_COLORS.present },
            { name: 'Inasistencias', value: activeGroupStats.attendanceRate.absent, fill: PIE_CHART_COLORS.absent },
            { name: 'Retardos', value: activeGroupStats.attendanceRate.late, fill: PIE_CHART_COLORS.late },
        ].filter(item => item.value > 0);
    }, [activeGroupStats]);

    const overallRiskData = useMemo(() => {
        const totalRisk = { low: 0, medium: 0, high: 0 };
        stats.forEach(stat => {
            totalRisk.low += stat.riskLevels.low;
            totalRisk.medium += stat.riskLevels.medium;
            totalRisk.high += stat.riskLevels.high;
        });
        return [
            { name: 'Riesgo Bajo', value: totalRisk.low, fill: PIE_CHART_COLORS.low },
            { name: 'Riesgo Medio', value: totalRisk.medium, fill: PIE_CHART_COLORS.medium },
            { name: 'Riesgo Alto', value: totalRisk.high, fill: PIE_CHART_COLORS.high },
        ].filter(item => item.value > 0);
    }, [stats]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Calculando estadísticas...</span>
            </div>
        );
    }
    
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground">
            Analiza el rendimiento de tus grupos y estudiantes.
          </p>
        </div>
      </div>
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Visión General</TabsTrigger>
            <TabsTrigger value="activeGroup" disabled={!activeGroupStats}>Grupo Activo</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
            {stats.length === 0 ? (
                 <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                        <CardTitle>No hay datos suficientes</CardTitle>
                        <CardDescription>
                            No hay grupos creados para generar estadísticas. <Link href="/groups" className="text-primary underline">Crea un grupo</Link> para empezar.
                        </CardDescription>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                            <CardTitle>Rendimiento por Grupo</CardTitle>
                            <CardDescription>Comparativa de la calificación promedio final entre grupos.</CardDescription>
                            </CardHeader>
                            <CardContent>
                            <ChartContainer config={{}} className="min-h-[300px] w-full">
                                    <BarChart data={stats} accessibilityLayer>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="subject"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                            tickFormatter={(value) => value.slice(0, 10)}
                                        />
                                        <YAxis 
                                            domain={[0, 100]}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="averageGrade" fill="hsl(var(--primary))" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                            <CardTitle>Distribución de Riesgo General</CardTitle>
                            <CardDescription>Clasificación de todos los estudiantes por nivel de riesgo.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[300px] w-full">
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                        <Pie data={overallRiskData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                            {overallRiskData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen Estadístico de Grupos</CardTitle>
                            <CardDescription>Tabla comparativa con los indicadores clave de cada grupo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Grupo</TableHead>
                                        <TableHead className="text-center"># Estudiantes</TableHead>
                                        <TableHead className="text-center">Promedio Gral.</TableHead>
                                        <TableHead className="text-center">% Asistencia</TableHead>
                                        <TableHead className="text-center">Estudiantes en Riesgo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.map(stat => (
                                        <TableRow key={stat.id}>
                                            <TableCell className="font-medium">{stat.subject}</TableCell>
                                            <TableCell className="text-center">{stat.studentCount}</TableCell>
                                            <TableCell className="text-center">{stat.averageGrade}%</TableCell>
                                            <TableCell className="text-center">{stat.attendanceRate}%</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={stat.riskLevels.high > 0 ? "destructive" : "secondary"}>
                                                    {stat.riskLevels.high}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </TabsContent>
        <TabsContent value="activeGroup" className="mt-6">
             {activeGroupStats ? (
                <div className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Informe Estadístico del Grupo: {activeGroupName}</CardTitle>
                            <CardDescription>Un resumen detallado de los indicadores clave para este grupo.</CardDescription>
                        </CardHeader>
                    </Card>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                         <Card>
                            <CardHeader>
                                <CardTitle>Índice de Aprobación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[250px] w-full">
                                     <PieChart accessibilityLayer>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                        <Pie data={approvalData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={5}>
                                            {approvalData.map((entry) => ( <Cell key={entry.name} fill={entry.fill} /> ))}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Índice de Asistencia</CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <ChartContainer config={{}} className="min-h-[250px] w-full">
                                     <PieChart accessibilityLayer>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                        <Pie data={attendanceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={5}>
                                            {attendanceData.map((entry) => ( <Cell key={entry.name} fill={entry.fill} /> ))}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Observaciones</CardTitle>
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold">{activeGroupStats.observationCount}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Canalizados</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold">{activeGroupStats.canalizationCount}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Requieren Seguimiento</CardTitle>
                                <UserX className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold">{activeGroupStats.followUpCount}</div></CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                         <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Star/>Mejores Promedios</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                {activeGroupStats.bestStudents.map(s => (
                                    <li key={s.id} className="flex items-center gap-3">
                                        <Image src={s.photo} alt={s.name} width={32} height={32} className="rounded-full" />
                                        <span className="font-medium text-sm">{s.name}</span>
                                    </li>
                                ))}
                                </ul>
                           </CardContent>
                         </Card>
                          <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="text-destructive" />Estudiantes en Riesgo</CardTitle></CardHeader>
                            <CardContent>
                               <ul className="space-y-3">
                                {activeGroupStats.atRiskStudents.map(s => (
                                    <li key={s.id} className="flex items-center gap-3">
                                        <Image src={s.photo} alt={s.name} width={32} height={32} className="rounded-full" />
                                        <span className="font-medium text-sm">{s.name}</span>
                                    </li>
                                ))}
                                {activeGroupStats.atRiskStudents.length === 0 && <p className="text-sm text-muted-foreground text-center">No hay estudiantes en riesgo.</p>}
                                </ul>
                            </CardContent>
                         </Card>
                          <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingDown/>Baja Participación</CardTitle></CardHeader>
                            <CardContent>
                               <ul className="space-y-3">
                                {activeGroupStats.lowParticipationStudents.map(s => (
                                    <li key={s.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Image src={s.student.photo} alt={s.student.name} width={32} height={32} className="rounded-full" />
                                          <span className="font-medium text-sm">{s.student.name}</span>
                                        </div>
                                        <Badge variant="secondary">{s.participationRate.toFixed(0)}%</Badge>
                                    </li>
                                ))}
                                 {activeGroupStats.lowParticipationStudents.length === 0 && <p className="text-sm text-muted-foreground text-center">Todos los estudiantes tienen buena participación.</p>}
                                </ul>
                            </CardContent>
                         </Card>
                    </div>


                </div>
             ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                        <CardTitle>No hay un grupo activo</CardTitle>
                        <CardDescription>
                            Para ver las estadísticas detalladas, por favor <Link href="/groups" className="text-primary underline">selecciona un grupo</Link> primero.
                        </CardDescription>
                    </CardContent>
                </Card>
             )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
