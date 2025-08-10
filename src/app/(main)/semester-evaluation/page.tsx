
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
import { useData, loadFromLocalStorage } from '@/hooks/use-data';
import { useMemo } from 'react';
import type { PartialId, EvaluationCriteria, Grades, ParticipationRecord, Activity, ActivityRecord } from '@/hooks/use-data';
import Image from 'next/image';
import Link from 'next/link';
import { Presentation, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SemesterEvaluationPage() {
    const { activeGroup, calculateFinalGrade } = useData();

    const semesterGrades = useMemo(() => {
        if (!activeGroup) return [];

        const partials: PartialId[] = ['p1', 'p2', 'p3'];

        return activeGroup.students.map(student => {
            const partialGrades: { [key in PartialId]?: number } = {};
            let gradeSum = 0;
            let partialsWithGrades = 0;

            partials.forEach(partialId => {
                const keySuffix = `${activeGroup.id}_${partialId}`;
                const criteria = loadFromLocalStorage<EvaluationCriteria[]>(`criteria_${keySuffix}`, []);

                if (criteria.length > 0) {
                    const grades = loadFromLocalStorage<Grades>(`grades_${keySuffix}`, {});
                    const participations = loadFromLocalStorage<ParticipationRecord>(`participations_${keySuffix}`, {});
                    const activities = loadFromLocalStorage<Activity[]>(`activities_${keySuffix}`, []);
                    const activityRecords = loadFromLocalStorage<ActivityRecord>(`activityRecords_${keySuffix}`, {});
                    const finalGrade = calculateFinalGrade(student.id, partialId, criteria, grades, participations, activities, activityRecords);
                    
                    partialGrades[partialId] = finalGrade;
                    gradeSum += finalGrade;
                    partialsWithGrades++;
                }
            });

            const semesterAverage = partialsWithGrades > 0 ? gradeSum / partialsWithGrades : 0;
            
            return {
                student,
                p1: partialGrades.p1,
                p2: partialGrades.p2,
                p3: partialGrades.p3,
                average: semesterAverage
            };
        }).sort((a,b) => a.student.name.localeCompare(b.student.name));

    }, [activeGroup, calculateFinalGrade]);

    if (!activeGroup) {
        return (
            <Card>
                <CardHeader className="text-center">
                     <Presentation className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle>Evaluación Semestral</CardTitle>
                    <CardDescription>
                       Para ver esta sección, por favor <Link href="/groups" className="text-primary underline">selecciona un grupo</Link> primero.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    if (semesterGrades.length === 0 && activeGroup.students.length > 0) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Calculando calificaciones...</span></div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold">Evaluación Semestral</h1>
                <p className="text-muted-foreground">
                    Resumen de calificaciones de los tres parciales y promedio final para el grupo: {activeGroup.subject}
                </p>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Estudiante</TableHead>
                                <TableHead className="text-center bg-partial-1-bg text-partial-1-foreground-alt">Primer Parcial</TableHead>
                                <TableHead className="text-center bg-partial-2-bg text-partial-2-foreground-alt">Segundo Parcial</TableHead>
                                <TableHead className="text-center bg-partial-3-bg text-partial-3-foreground-alt">Tercer Parcial</TableHead>
                                <TableHead className="text-center font-bold">Promedio Semestral</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {semesterGrades.map(({ student, p1, p2, p3, average }) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <Image src={student.photo} alt={student.name} width={40} height={40} className="rounded-full"/>
                                        {student.name}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
                                        {p1 !== undefined ? `${p1.toFixed(1)}%` : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
                                        {p2 !== undefined ? `${p2.toFixed(1)}%` : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
                                        {p3 !== undefined ? `${p3.toFixed(1)}%` : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={cn("text-base", average >= 70 ? 'bg-primary' : 'bg-destructive')}>{average.toFixed(1)}%</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {activeGroup.students.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        Este grupo no tiene estudiantes.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
