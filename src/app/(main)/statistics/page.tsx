
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Tooltip, Legend } from "recharts"
import { Badge } from '@/components/ui/badge';
import { Student, Group, StudentObservation } from '@/lib/placeholder-data';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  attendanceTotals: { present: number; absent: number; late: number };
  observationStats: { observations: number, canalizations: number, followUps: number };
  riskDistribution: { low: number, medium: number, high: number };
  topStudents: { name: string, grade: number }[];
  participationDistribution: { name: string, students: number }[];
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
                    const riskDistribution = { low: 0, medium: 0, high: 0 };
                    const participationDistribution = [
                        { name: '0-20%', students: 0 }, { name: '21-40%', students: 0 }, { name: '41-60%', students: 0 }, { name: '61-80%', students: 0 }, { name: '81-100%', students: 0 }
                    ];

                    for(const student of activeGroup.students) {
                        const finalGrade = calculateFinalGrade(student.id, criteria, grades, participations);
                        studentGrades.push({student, grade: finalGrade});
                        if(finalGrade >= 70) approved++; else failed++;
                        
                        const risk = getStudentRiskLevel(finalGrade, attendance, student.id);
                        riskDistribution[risk]++;

                        const studentObservations: StudentObservation[] = JSON.parse(localStorage.getItem(`observations_${student.id}`) || '[]');
                        observationCount += studentObservations.length;
                        canalizationCount += studentObservations.filter(o => o.requiresCanalization).length;
                        followUpCount += studentObservations.filter(o => o.requiresFollowUp).length;

                        const totalParticipationClasses = Object.keys(participations).length;
                        if(totalParticipationClasses > 0) {
                            const studentParticipations = Object.values(participations).filter(day => day[student.id]).length;
                            const participationRate = (studentParticipations / totalParticipationClasses) * 100;
                            if (participationRate <= 20) participationDistribution[0].students++;
                            else if (participationRate <= 40) participationDistribution[1].students++;
                            else if (participationRate <= 60) participationDistribution[2].students++;
                            else if (participationRate <= 80) participationDistribution[3].students++;
                            else participationDistribution[4].students++;
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

                    setActiveGroupStats({
                        approvalRate: { approved, failed },
                        attendanceTotals: { present, absent, late },
                        observationStats: { observations: observationCount, canalizations: canalizationCount, followUps: followUpCount },
                        riskDistribution,
                        topStudents: studentGrades.slice(0,5).map(s => ({name: s.student.name, grade: parseFloat(s.grade.toFixed(1))})),
                        participationDistribution,
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
            { name: 'Asistencias', value: activeGroupStats.attendanceTotals.present, fill: PIE_CHART_COLORS.present },
            { name: 'Inasistencias', value: activeGroupStats.attendanceTotals.absent, fill: PIE_CHART_COLORS.absent },
            { name: 'Retardos', value: activeGroupStats.attendanceTotals.late, fill: PIE_CHART_COLORS.late },
        ].filter(item => item.value > 0);
    }, [activeGroupStats]);
    
    const riskData = useMemo(() => {
        if (!activeGroupStats) return [];
        return [
             { name: 'Riesgo Bajo', value: activeGroupStats.riskDistribution.low, fill: PIE_CHART_COLORS.low },
            { name: 'Riesgo Medio', value: activeGroupStats.riskDistribution.medium, fill: PIE_CHART_COLORS.medium },
            { name: 'Riesgo Alto', value: activeGroupStats.riskDistribution.high, fill: PIE_CHART_COLORS.high },
        ].filter(item => item.value > 0);
    }, [activeGroupStats]);
    
    const observationData = useMemo(() => {
         if (!activeGroupStats) return [];
         return [
            { name: 'Observaciones', total: activeGroupStats.observationStats.observations, fill: 'hsl(var(--chart-1))' },
            { name: 'Canalizaciones', total: activeGroupStats.observationStats.canalizations, fill: 'hsl(var(--chart-2))' },
            { name: 'Seguimientos', total: activeGroupStats.observationStats.followUps, fill: 'hsl(var(--chart-3))' },
         ]
    }, [activeGroupStats]);


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
            <TabsTrigger value="activeGroup" disabled={!activeGroupStats}>Grupo Activo: {activeGroupName || ''}</TabsTrigger>
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
                     <Card>
                        <CardHeader>
                        <CardTitle>Rendimiento por Grupo</CardTitle>
                        <CardDescription>Comparativa de la calificación promedio final y la tasa de asistencia entre grupos.</CardDescription>
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
                                        tickFormatter={(value) => `${value}%`}
                                    />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="averageGrade" name="Promedio Gral." fill="hsl(var(--chart-2))" radius={4} />
                                    <Bar dataKey="attendanceRate" name="Asistencia" fill="hsl(var(--chart-4))" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                        <CardTitle>Distribución de Riesgo por Grupo</CardTitle>
                        <CardDescription>Comparativa del número de estudiantes en cada nivel de riesgo por grupo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ChartContainer config={{}} className="min-h-[300px] w-full">
                                <BarChart data={stats} layout="vertical" stackOffset="expand">
                                    <CartesianGrid horizontal={false} />
                                    <YAxis 
                                        type="category"
                                        dataKey="subject"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        tickFormatter={(value) => value.slice(0,15)}
                                    />
                                    <XAxis type="number" hide={true} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="riskLevels.low" name="Bajo" stackId="a" fill={PIE_CHART_COLORS.low} radius={[4, 0, 0, 4]}/>
                                    <Bar dataKey="riskLevels.medium" name="Medio" stackId="a" fill={PIE_CHART_COLORS.medium} />
                                    <Bar dataKey="riskLevels.high" name="Alto" stackId="a" fill={PIE_CHART_COLORS.high} radius={[0, 4, 4, 0]} />
                                </BarChart>
                           </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
        </TabsContent>
        <TabsContent value="activeGroup" className="mt-6">
             {activeGroupStats ? (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Riesgo del Grupo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[250px] w-full">
                                     <PieChart>
                                        <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                        <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={5}>
                                            {riskData.map((entry) => ( <Cell key={entry.name} fill={entry.fill} /> ))}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Índice de Aprobación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[250px] w-full">
                                     <PieChart>
                                        <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
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
                                     <PieChart>
                                        <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                        <Pie data={attendanceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={5}>
                                            {attendanceData.map((entry) => ( <Cell key={entry.name} fill={entry.fill} /> ))}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                             <CardHeader>
                                <CardTitle>Observaciones y Seguimiento</CardTitle>
                                <CardDescription>Recuento de intervenciones registradas para el grupo.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[300px] w-full">
                                    <BarChart data={observationData} accessibilityLayer layout="vertical">
                                        <CartesianGrid horizontal={false} />
                                        <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} />
                                        <XAxis dataKey="total" type="number" />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="total" name="Total" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Mejores Calificaciones</CardTitle>
                                <CardDescription>Calificación final de los 5 estudiantes con mejor desempeño.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <ChartContainer config={{}} className="min-h-[300px] w-full">
                                    <BarChart data={activeGroupStats.topStudents} accessibilityLayer>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis dataKey="grade" domain={[0,100]} />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="grade" name="Calificación" fill="hsl(var(--chart-2))" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                     <Card>
                        <CardHeader>
                            <CardTitle>Distribución de Participación en Clase</CardTitle>
                            <CardDescription>Número de estudiantes por rango de porcentaje de participación.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={{}} className="min-h-[300px] w-full">
                                <BarChart data={activeGroupStats.participationDistribution} accessibilityLayer>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                    <YAxis dataKey="students" allowDecimals={false} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="students" name="Estudiantes" fill="hsl(var(--primary))" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
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

