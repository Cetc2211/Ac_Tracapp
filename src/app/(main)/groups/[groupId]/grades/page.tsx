
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
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

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

export default function GroupGradesPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<(typeof initialGroups)[0] | null>(null);
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriteria[]>([]);
  const [grades, setGrades] = useState<Grades>({});
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedGroups = localStorage.getItem('groups');
      const allGroups = storedGroups ? JSON.parse(storedGroups) : initialGroups;
      const currentGroup = allGroups.find((g: any) => g.id === groupId);
      setGroup(currentGroup || null);

      const storedCriteria = localStorage.getItem(`criteria_${groupId}`);
      if (storedCriteria) {
        setEvaluationCriteria(JSON.parse(storedCriteria));
      }

      const storedGrades = localStorage.getItem(`grades_${groupId}`);
      if (storedGrades) {
        setGrades(JSON.parse(storedGrades));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      setGroup(null);
    }
  }, [groupId]);

  const saveGrades = () => {
    localStorage.setItem(`grades_${groupId}`, JSON.stringify(grades));
    toast({
      title: 'Calificaciones Guardadas',
      description: 'Las calificaciones han sido guardadas exitosamente.',
    });
  };

  const handleGradeChange = (studentId: string, criterionId: string, field: 'delivered' | 'average', value: string) => {
    const numericValue = value === '' ? null : parseFloat(value);
    
    if (field === 'average' && value !== '' && (isNaN(numericValue!) || numericValue! < 0 || numericValue! > 10)) {
        toast({
            variant: "destructive",
            title: "Valor inválido",
            description: "El promedio debe ser un número entre 0 y 10."
        })
        return;
    }
     if (field === 'delivered' && value !== '' && (isNaN(numericValue!) || numericValue! < 0 )) {
        toast({
            variant: "destructive",
            title: "Valor inválido",
            description: "El número de entregados debe ser positivo."
        })
        return;
    }


    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [criterionId]: {
          ...prev[studentId]?.[criterionId],
          [field]: numericValue,
        },
      },
    }));
  };
  
  const calculateFinalGrade = useCallback((studentId: string) => {
    if (evaluationCriteria.length === 0) return 0;

    let finalGrade = 0;
    
    for (const criterion of evaluationCriteria) {
      const gradeDetail = grades[studentId]?.[criterion.id];
      const delivered = gradeDetail?.delivered ?? 0;
      const average = gradeDetail?.average ?? 0;
      const expected = criterion.expectedValue;

      if(expected > 0) {
        const criterionScore = (delivered / expected) * average;
        finalGrade += criterionScore * (criterion.weight / 100);
      }
    }

    return parseFloat(finalGrade.toFixed(2));
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
            <Link href={`/groups/${groupId}`}>
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
                <TableHead className="w-[250px] sticky left-0 bg-card z-10">Estudiante</TableHead>
                {evaluationCriteria.map(c => (
                  <TableHead key={c.id} className="text-center min-w-[250px]">
                    <div className='font-bold'>{c.name}</div>
                    <div className="font-normal text-muted-foreground">
                      ({c.weight}%, {c.expectedValue} esp.)
                    </div>
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
                      <div className="flex gap-2 items-center justify-center">
                        <div className='flex-1'>
                            <Label htmlFor={`delivered-${student.id}-${criterion.id}`} className='text-xs'>Entregado/Logrado</Label>
                            <Input 
                                id={`delivered-${student.id}-${criterion.id}`}
                                type="number"
                                className="h-8 text-center"
                                placeholder="Ent."
                                min={0}
                                max={criterion.expectedValue}
                                value={grades[student.id]?.[criterion.id]?.delivered ?? ''}
                                onChange={e => handleGradeChange(student.id, criterion.id, 'delivered', e.target.value)}
                            />
                        </div>
                        <div className='flex-1'>
                             <Label htmlFor={`average-${student.id}-${criterion.id}`} className='text-xs'>Promedio</Label>
                            <Input 
                                id={`average-${student.id}-${criterion.id}`}
                                type="number"
                                className="h-8 text-center"
                                placeholder="Prom."
                                min={0}
                                max={10}
                                step="0.1"
                                value={grades[student.id]?.[criterion.id]?.average ?? ''}
                                onChange={e => handleGradeChange(student.id, criterion.id, 'average', e.target.value)}
                            />
                        </div>
                      </div>
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
                        No has definido criterios de evaluación. <Link href={`/groups/${groupId}/criteria`} className="text-primary underline">Defínelos aquí.</Link>
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
