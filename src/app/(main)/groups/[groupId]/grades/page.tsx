
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
import { groups as initialGroups, Student } from '@/lib/placeholder-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
};

type Grades = {
  [studentId: string]: {
    [criterionId: string]: number | null;
  };
};

export default function GroupGradesPage({
  params,
}: {
  params: { groupId: string };
}) {
  const [group, setGroup] = useState<(typeof initialGroups)[0] | null>(null);
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriteria[]>([]);
  const [grades, setGrades] = useState<Grades>({});
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedGroups = localStorage.getItem('groups');
      const allGroups = storedGroups ? JSON.parse(storedGroups) : initialGroups;
      const currentGroup = allGroups.find((g: any) => g.id === params.groupId);
      setGroup(currentGroup || null);

      const storedCriteria = localStorage.getItem(`criteria_${params.groupId}`);
      if (storedCriteria) {
        setEvaluationCriteria(JSON.parse(storedCriteria));
      }

      const storedGrades = localStorage.getItem(`grades_${params.groupId}`);
      if (storedGrades) {
        setGrades(JSON.parse(storedGrades));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      setGroup(null);
    }
  }, [params.groupId]);

  const saveGrades = () => {
    localStorage.setItem(`grades_${params.groupId}`, JSON.stringify(grades));
    toast({
      title: 'Calificaciones Guardadas',
      description: 'Las calificaciones han sido guardadas exitosamente.',
    });
  };

  const handleGradeChange = (studentId: string, criterionId: string, value: string) => {
    const numericValue = value === '' ? null : parseFloat(value);
    
    // Allow empty or valid numbers between 0 and 10
    if (value !== '' && (isNaN(numericValue!) || numericValue! < 0 || numericValue! > 10)) {
        toast({
            variant: "destructive",
            title: "Valor inválido",
            description: "La calificación debe ser un número entre 0 y 10."
        })
        return;
    }

    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [criterionId]: numericValue,
      },
    }));
  };
  
  const calculateFinalGrade = useCallback((studentId: string) => {
    if (evaluationCriteria.length === 0) return 0;

    const totalWeight = evaluationCriteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight === 0) return 0;

    const finalGrade = evaluationCriteria.reduce((sum, criterion) => {
      const grade = grades[studentId]?.[criterion.id] ?? 0;
      return sum + (grade * (criterion.weight / 100));
    }, 0);
    
    // Normalize if total weight is not 100, though UI should prevent > 100
    const normalizedGrade = (finalGrade / totalWeight) * 100 * (totalWeight / 100)
    return parseFloat(normalizedGrade.toFixed(2));

  }, [grades, evaluationCriteria]);

  if (!group) {
    return notFound();
  }
  
  const studentsInGroup = group.students;


  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
            <Link href={`/groups/${params.groupId}`}>
                <ArrowLeft />
                <span className="sr-only">Volver al Grupo</span>
            </Link>
            </Button>
            <div>
            <h1 className="text-3xl font-bold">Registrar Calificaciones</h1>
            <p className="text-muted-foreground">
                Asigna las notas para el grupo "{group.subject}".
            </p>
            </div>
         </div>
         <Button onClick={saveGrades}>
            <Save className="mr-2 h-4 w-4"/>
            Guardar Calificaciones
         </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px] sticky left-0 bg-card z-10">Estudiante</TableHead>
                {evaluationCriteria.map(c => (
                  <TableHead key={c.id} className="text-center">
                    {c.name} <span className="text-muted-foreground font-normal">({c.weight}%)</span>
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold sticky right-0 bg-card z-10">
                    Calificación Final
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsInGroup.map(student => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium sticky left-0 bg-card z-10 flex items-center gap-2">
                    <Image 
                      src={student.photo}
                      alt={student.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    {student.name}
                  </TableCell>
                  {evaluationCriteria.map(criterion => (
                    <TableCell key={criterion.id} className="text-center">
                      <Input 
                        type="number"
                        className="max-w-[100px] mx-auto text-center"
                        placeholder="-"
                        min={0}
                        max={10}
                        step="0.1"
                        value={grades[student.id]?.[criterion.id] ?? ''}
                        onChange={e => handleGradeChange(student.id, criterion.id, e.target.value)}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-lg sticky right-0 bg-card z-10">
                    {calculateFinalGrade(student.id)}
                  </TableCell>
                </TableRow>
              ))}
              {studentsInGroup.length === 0 && (
                <TableRow>
                    <TableCell colSpan={evaluationCriteria.length + 2} className="text-center h-24">
                        No hay estudiantes en este grupo.
                    </TableCell>
                </TableRow>
              )}
               {evaluationCriteria.length === 0 && studentsInGroup.length > 0 && (
                 <TableRow>
                    <TableCell colSpan={2} className="text-center h-24">
                        No has definido criterios de evaluación. <Link href={`/groups/${params.groupId}`} className="text-primary underline">Defínelos aquí.</Link>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
