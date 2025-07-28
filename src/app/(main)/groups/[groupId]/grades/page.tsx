
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
import { cn } from '@/lib/utils';

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

type ParticipationData = {
    [studentId: string]: {
        participated: number;
        total: number;
    }
}

const criterionColors = [
  'bg-chart-1/10',
  'bg-chart-2/10',
  'bg-chart-3/10',
  'bg-chart-4/10',
  'bg-chart-5/10',
];

export default function GroupGradesPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<(typeof initialGroups)[0] | null>(null);
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriteria[]>([]);
  const [grades, setGrades] = useState<Grades>({});
  const [participationData, setParticipationData] = useState<ParticipationData>({});
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      // Load group
      const storedGroups = localStorage.getItem('groups');
      const allGroups = storedGroups ? JSON.parse(storedGroups) : initialGroups;
      const currentGroup = allGroups.find((g: any) => g.id === groupId);
      setGroup(currentGroup || null);

      // Load criteria
      const storedCriteria = localStorage.getItem(`criteria_${groupId}`);
      const localCriteria: EvaluationCriteria[] = storedCriteria ? JSON.parse(storedCriteria) : [];
      
      // Load grades
      const storedGrades = localStorage.getItem(`grades_${groupId}`);
      setGrades(storedGrades ? JSON.parse(storedGrades) : {});

      // Calculate participation only if a group and a participation criterion exist
      if (currentGroup?.students?.length) {
        const participationCriterion = localCriteria.find(c => c.name === 'Participación');
        if (participationCriterion) {
            const storedParticipations = localStorage.getItem(`participations_${groupId}`);
            const participations: ParticipationRecord = storedParticipations ? JSON.parse(storedParticipations) : {};
            const participationDates = Object.keys(participations);
            const totalClasses = participationDates.length;

            const newParticipationData: ParticipationData = {};
            for (const student of currentGroup.students) {
                const participatedClasses = participationDates.filter(date => participations[date]?.[student.id]).length;
                newParticipationData[student.id] = { participated: participatedClasses, total: totalClasses };
            }
            setParticipationData(newParticipationData);
            
            const updatedCriteria = localCriteria.map(c => 
                c.name === 'Participación' ? { ...c, expectedValue: totalClasses } : c
            );
            setEvaluationCriteria(updatedCriteria);
        } else {
             setEvaluationCriteria(localCriteria);
        }
      } else {
        setEvaluationCriteria(localCriteria);
      }
      
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      setGroup(null);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const saveGrades = () => {
    localStorage.setItem(`grades_${groupId}`, JSON.stringify(grades));
    toast({
      title: 'Calificaciones Guardadas',
      description: 'Las calificaciones han sido guardadas exitosamente.',
    });
  };

  const handleGradeChange = (studentId: string, criterionId: string, value: string) => {
    const numericValue = value === '' ? null : parseFloat(value);
    
     if (value !== '' && (isNaN(numericValue!) || numericValue! < 0 )) {
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
          delivered: numericValue,
        },
      },
    }));
  };
  
  const calculateFinalGrade = useCallback((studentId: string) => {
    if (!evaluationCriteria || evaluationCriteria.length === 0) return '0%';

    let finalGrade = 0;
    
    for (const criterion of evaluationCriteria) {
      let performanceRatio = 0;

      if(criterion.name === 'Participación') {
          const pData = participationData[studentId];
          if(pData && pData.total > 0) {
            performanceRatio = pData.participated / pData.total;
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
    return `${finalGrade.toFixed(0)}%`;
  }, [grades, evaluationCriteria, participationData]);
  
  const studentsInGroup = useMemo(() => {
      if (!group || !group.students) return [];
      return [...group.students].sort((a,b) => a.name.localeCompare(b.name));
  }, [group]);

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!group) {
    return notFound();
  }

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
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px] sticky left-0 bg-card z-10">Estudiante</TableHead>
                  {evaluationCriteria.map((c, index) => (
                    <TableHead key={c.id} className={cn("text-center min-w-[250px] align-top", criterionColors[index % criterionColors.length])}>
                      <div className='font-bold'>{c.name}</div>
                      <div className="font-normal text-muted-foreground">
                        ({c.weight}%, {c.name === 'Participación' ? `${c.expectedValue} clases` : `${c.expectedValue} esp.`})
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold sticky right-0 bg-card z-10">
                      Calificación Final
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsInGroup.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={evaluationCriteria.length + 2} className="text-center h-24">
                          No hay estudiantes en este grupo.
                      </TableCell>
                  </TableRow>
                )}
                {studentsInGroup.length > 0 && evaluationCriteria.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={2} className="text-center h-24">
                          No has definido criterios de evaluación. <Link href={`/groups/${groupId}/criteria`} className="text-primary underline">Defínelos aquí.</Link>
                      </TableCell>
                  </TableRow>
                )}
                {studentsInGroup.length > 0 && evaluationCriteria.length > 0 && studentsInGroup.map(student => (
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
                    {evaluationCriteria.map((criterion, index) => {
                      const isParticipation = criterion.name === 'Participación';
                      
                      let performanceRatio = 0;
                      if (isParticipation) {
                        const pData = participationData[student.id];
                        if (pData && pData.total > 0) {
                          performanceRatio = pData.participated / pData.total;
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

                      return (
                      <TableCell key={criterion.id} className={cn("text-center", criterionColors[index % criterionColors.length])}>
                        {isParticipation ? (
                          <div className="flex flex-col items-center justify-center p-1">
                              <Label className='text-xs'>Participaciones</Label>
                              <span className="font-bold">{participationData[student.id]?.participated ?? 0} de {participationData[student.id]?.total ?? 0}</span>
                              <Label className='text-xs mt-2'>Porcentaje Ganado</Label>
                               <span className="font-bold text-lg">
                                  {earnedPercentage.toFixed(0)}%
                              </span>
                          </div>
                        ) : (
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
                                    onChange={e => handleGradeChange(student.id, criterion.id, e.target.value)}
                                />
                            </div>
                            <div className='flex-1'>
                                <Label className='text-xs'>Porcentaje Ganado</Label>
                                <div className="h-8 flex items-center justify-center font-bold text-lg">
                                  {earnedPercentage.toFixed(0)}%
                                </div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      )
                    })}
                    <TableCell className="text-center font-bold text-lg sticky right-0 bg-card z-10">
                      {calculateFinalGrade(student.id)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



