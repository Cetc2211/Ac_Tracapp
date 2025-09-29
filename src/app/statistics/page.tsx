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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts"
import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/hooks/use-data';
import type { Student, PartialId, CalculatedRisk, AttendanceRecord, ParticipationRecord, EvaluationCriteria } from '@/lib/placeholder-data';
import { getPartialLabel } from '@/lib/utils';


type GroupStats = {
  id: string;
  subject: string;
  studentCount: number;
  averageGrade: number;
  attendanceRate: number;
  riskLevels: { low: number; medium: number; high: number; };
};

type ActiveGroupStats = {
  approvalRate: { approved: number; failed: number; };
  attendanceTotals: { present: number; absent: number; };
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
    const { 
        isLoading,
        groups,
        activeGroup,
        calculateFinalGrade,
        getStudentRiskLevel,
        partialData,
        activePartialId,
        setActivePartialId,
    } = useData();
    const { attendance, participations } = partialData;

    const activeGroupStats = useMemo(() => {
        if (!activeGroup) return null;

        let approved = 0, failed = 0;
        let present = 0, absent = 0;
        const studentGrades: {student: Student, grade: number}[] = [];
        const riskDistribution: Record<'low' | 'medium' | 'high', number> = { low: 0, medium: 0, high: 0 };
        const participationDistribution = [
            { name: '0-20%', students: 0 }, { name: '21-40%', students: 0 }, { name: '41-60%', students: 0 }, { name: '61-80%', students: 0 }, { name: '81-100%', students: 0 }
        ];

        for(const student of activeGroup.students) {
            const finalGrade = calculateFinalGrade(student.id);
            studentGrades.push({student, grade: finalGrade});
            if(finalGrade >= 60) approved++; else failed++;
            
            const risk = getStudentRiskLevel(finalGrade, attendance, student.id);
            riskDistribution[risk.level]++;

            const totalParticipationClasses = Object.keys(participations).length;
            if(totalParticipationClasses > 0) {
                const studentParticipations = Object.values(participations).filter(day => day[student.id]).length;
                const participationRate = (studentParticipations / totalParticipationClasses) * 100;
                if (participationRate <= 20) participationDistribution[0].students++;
                else if (participationRate <= 40) participationDistribution[1].students++;
                else if (participationRate <= 60) participationDistribution[2].students++;
                else if (participationRate <= 80) participationDistribution[3].students++;
                else participationDistribution[4].students++;
            } else if(activeGroup.students.length > 0) {
                 participationDistribution[4].students = activeGroup.students.length;
            }
        }
        
        Object.values(attendance).forEach(dailyRecord => {
            for (const studentId of activeGroup.students.map(s => s.id)) {
                if (Object.prototype.hasOwnProperty.call(dailyRecord, studentId)) {
                    if (dailyRecord[studentId]) present++; else absent++;
                }
            }
        });

        studentGrades.sort((a,b) => b.grade - a.grade);

        return {
            approvalRate: { approved, failed },
            attendanceTotals: { present, absent },
            riskDistribution,
            topStudents: studentGrades.slice(0,5).map(s => ({name: s.student.name, grade: parseFloat(s.grade.toFixed(1))})),
            participationDistribution,
        };
    }, [activeGroup, activePartialId, calculateFinalGrade, getStudentRiskLevel, partialData, attendance, participations]);

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
       <Tabs defaultValue={activePartialId} onValueChange={(value) => setActivePartialId(value as PartialId)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="p1">Primer Parcial</TabsTrigger>
            <TabsTrigger value="p2">Segundo Parcial</TabsTrigger>
            <TabsTrigger value="p3">Tercer Parcial</TabsTrigger>
        </TabsList>
       </Tabs>

      <Tabs defaultValue="activeGroup">
        <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="activeGroup" disabled={!activeGroupStats}>Grupo Activo: {activeGroup?.subject || ''}</TabsTrigger>
        </TabsList>
        <TabsContent value="activeGroup" className="mt-6">
             {activeGroupStats ? (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Riesgo del Grupo ({getPartialLabel(activePartialId)})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[250px] w-full">
                                     <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
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
                                <CardTitle>Índice de Aprobación ({getPartialLabel(activePartialId)})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[250px] w-full">
                                     <PieChart>
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
                                <CardTitle>Índice de Asistencia ({getPartialLabel(activePartialId)})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <ChartContainer config={{}} className="min-h-[250px] w-full">
                                     <PieChart>
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

                    <div className="grid gap-6 md:grid-cols-2">
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Mejores Calificaciones ({getPartialLabel(activePartialId)})</CardTitle>
                                <CardDescription>Calificación final de los 5 estudiantes con mejor desempeño.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <ChartContainer config={{}} className="min-h-[300px] w-full">
                                    <BarChart data={activeGroupStats.topStudents} accessibilityLayer>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis dataKey="grade" domain={[0,100]} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="grade" name="Calificación" fill="hsl(var(--chart-2))" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Distribución de Participación en Clase ({getPartialLabel(activePartialId)})</CardTitle>
                                <CardDescription>Número de estudiantes por rango de porcentaje de participación.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[300px] w-full">
                                    <BarChart data={activeGroupStats.participationDistribution} accessibilityLayer>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis dataKey="students" allowDecimals={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="students" name="Estudiantes" fill="hsl(var(--primary))" radius={4} />
                                    </BarChart>
                                </ChartContainer>
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
