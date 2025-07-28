
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
import { Student, Group } from '@/lib/placeholder-data';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';


type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
};

type GradeDetail = {
  delivered: number | null;
  average: number | null;
};

type Grades = {
  [studentId: string]: {
    [criterionId: string]: GradeDetail;
  };
};

type DailyAttendance = {
    [date: string]: { [studentId: string]: boolean };
}

type GroupStats = {
  id: string;
  subject: string;
  studentCount: number;
  averageGrade: number;
  attendanceRate: number;
  riskLevels: { low: number; medium: number; high: number; };
};

const PIE_CHART_COLORS = {
    low: "hsl(var(--chart-2))",
    medium: "hsl(var(--chart-4))",
    high: "hsl(var(--destructive))",
};


export default function StatisticsPage() {
    const [stats, setStats] = useState<GroupStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const calculateFinalGrade = useCallback((studentId: string, criteria: EvaluationCriteria[], grades: Grades) => {
        if (!criteria || criteria.length === 0 || !grades || !grades[studentId]) return 0;
        let finalGrade = 0;
        const studentGrades = grades[studentId];
        for (const criterion of criteria) {
            const gradeDetail = studentGrades[criterion.id];
            if (gradeDetail) {
                 const performanceRatio = (gradeDetail.delivered ?? 0) / (criterion.expectedValue || 1);
                 finalGrade += performanceRatio * criterion.weight;
            }
        }
        return finalGrade > 100 ? 100 : finalGrade;
    }, []);

    const getStudentRiskLevel = useCallback((studentId: string, finalGrade: number, attendance: DailyAttendance) => {
        const totalDays = Object.keys(attendance).length;
        let absences = 0;
        if (totalDays > 0) {
            for (const date in attendance) {
                if (attendance[date][studentId] !== true) {
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
            const storedGroups = localStorage.getItem('groups');
            const allGroups: Group[] = storedGroups ? JSON.parse(storedGroups) : [];
            const globalAttendance: DailyAttendance = JSON.parse(localStorage.getItem('globalAttendance') || '{}');

            const calculatedStats = allGroups.map(group => {
                const criteria: EvaluationCriteria[] = JSON.parse(localStorage.getItem(`criteria_${group.id}`) || '[]');
                const grades: Grades = JSON.parse(localStorage.getItem(`grades_${group.id}`) || '{}');
                
                const groupGrades = group.students.map(s => calculateFinalGrade(s.id, criteria, grades));
                const averageGrade = groupGrades.length > 0 ? groupGrades.reduce((a, b) => a + b, 0) / groupGrades.length : 0;

                let totalAttendances = 0;
                let presentAttendances = 0;
                const riskLevels = { low: 0, medium: 0, high: 0 };
                
                group.students.forEach(student => {
                    const studentFinalGrade = calculateFinalGrade(student.id, criteria, grades);
                    const risk = getStudentRiskLevel(student.id, studentFinalGrade, globalAttendance);
                    riskLevels[risk]++;
                    
                    Object.values(globalAttendance).forEach(dailyRecord => {
                        if (dailyRecord.hasOwnProperty(student.id)) {
                            totalAttendances++;
                            if (dailyRecord[student.id] === true) {
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
        } catch (e) {
            console.error("Failed to calculate statistics", e);
        } finally {
            setIsLoading(false);
        }
    }, [calculateFinalGrade, getStudentRiskLevel]);

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
    
    if (stats.length === 0) {
        return (
             <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                  <div className="bg-muted rounded-full p-4">
                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <CardTitle>No hay datos suficientes</CardTitle>
                  <CardDescription>
                    No hay grupos creados para generar estadísticas. <Link href="/groups" className="text-primary underline">Crea un grupo</Link> para empezar.
                  </CardDescription>
              </CardContent>
          </Card>
        )
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
  );
}
