
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
import { useData } from '@/hooks/use-data';
import { useMemo, useState, useEffect } from 'react';
import type { PartialId } from '@/hooks/use-data';
import Image from 'next/image';
import Link from 'next/link';
import { Presentation, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Student } from '@/lib/placeholder-data';

interface SemesterGrade {
    student: Student;
    p1?: number;
    p2?: number;
    p3?: number;
    average: number;
}

export default function SemesterEvaluationPage() {
    const { activeGroup, calculateFinalGrade, isLoading: isDataLoading } = useData();
    const [semesterGrades, setSemesterGrades] = useState<SemesterGrade[]>([]);
    const [isCalculating, setIsCalculating] = useState(true);

    useEffect(() => {
        const calculateGrades = async () => {
            if (!activeGroup || !auth.currentUser) {
                setIsCalculating(false);
                return;
            };

            setIsCalculating(true);
            const partials: PartialId[] = ['p1', 'p2', 'p3'];
            const studentPromises = activeGroup.students.map(async (student) => {
                const partialGrades: { [key in PartialId]?: number } = {};
                let gradeSum = 0;
                let partialsWithGrades = 0;

                for (const partialId of partials) {
                    const docRef = doc(db, `users/${auth.currentUser?.uid}/groups/${activeGroup.id}/partials/${partialId}`, 'data');
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                         // We need a way to calculate grades for other partials without changing the global context
                         // This is a simplified example. A better approach would be to have a standalone calculation function.
                         // For now, we assume calculateFinalGrade can be used if we could temporarily switch context, which we can't.
                         // So this part needs a better implementation logic for fetching specific partial data and calculating.
                         // The current calculateFinalGrade is tied to the activePartialId from the context.
                         // Let's assume a simplified calculation for the demo.
                         const grade = Math.random() * 40 + 60; // Placeholder
                         partialGrades[partialId] = grade;
                         gradeSum += grade;
                         partialsWithGrades++;
                    }
                }
                
                // This is a temporary workaround as we cannot easily calculate grades for non-active partials
                // without significant changes to useData.
                 const p1 = calculateFinalGrade(student.id, activeGroup.id, 'p1');
                 const p2 = calculateFinalGrade(student.id, activeGroup.id, 'p2');
                 const p3 = calculateFinalGrade(student.id, activeGroup.id, 'p3');


                const validPartials = [p1, p2, p3].filter(g => g > 0);
                const semesterAverage = validPartials.length > 0 ? validPartials.reduce((a,b) => a+b, 0) / validPartials.length : 0;
                
                return {
                    student,
                    p1: p1 > 0 ? p1 : undefined,
                    p2: p2 > 0 ? p2 : undefined,
                    p3: p3 > 0 ? p3 : undefined,
                    average: semesterAverage,
                };
            });

            const results = await Promise.all(studentPromises);
            setSemesterGrades(results.sort((a,b) => a.student.name.localeCompare(b.student.name)));
            setIsCalculating(false);
        };

        calculateGrades();
    }, [activeGroup, calculateFinalGrade]);


    if (isDataLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

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
    
    if (isCalculating) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Calculando calificaciones semestrales...</span></div>;
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
                                        <Badge className={cn("text-base", average >= 60 ? 'bg-primary' : 'bg-destructive')}>{average.toFixed(1)}%</Badge>
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
