
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
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useData } from '@/hooks/use-data';
import type { EvaluationCriteria, Grades } from '@/hooks/use-data';

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
  const { 
    activeGroup, 
    criteria, 
    grades, 
    participations, 
    activities, 
    activityRecords, 
    setGrades,
    calculateFinalGrade
  } = useData();

  const { toast } = useToast();

  const handleSaveGrades = () => {
    setGrades(grades);
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

    setGrades({
      ...grades,
      [studentId]: {
        ...grades[studentId],
        [criterionId]: {
          ...grades[studentId]?.[criterionId],
          delivered: numericValue,
        },
      },
    });
  };
  
  const finalGrades = useMemo(() => {
    const calculatedGrades: {[studentId: string]: number} = {};
    if (activeGroup) {
      for (const student of activeGroup.students) {
        calculatedGrades[student.id] = calculateFinalGrade(student.id, criteria, grades, participations, activities, activityRecords);
      }
    }
    return calculatedGrades;
  }, [activeGroup, criteria, grades, participations, activities, activityRecords, calculateFinalGrade]);

  const studentsInGroup = useMemo(() => {
      if (!activeGroup || !activeGroup.students) return [];
      return [...activeGroup.students].sort((a,b) => a.name.localeCompare(b.name));
  }, [activeGroup]);

  if (!activeGroup) {
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
                Asigna las notas para el grupo "{activeGroup.subject}".
            </p>
            </div>
         </div>
         <Button onClick={handleSaveGrades}>
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
                  {criteria.map((c, index) => (
                    <TableHead key={c.id} className={cn("text-center min-w-[250px] align-top", criterionColors[index % criterionColors.length])}>
                      <div className='font-bold'>{c.name}</div>
                       <div className="font-normal text-muted-foreground">
                        ({c.weight}%, {
                          (c.name === 'Actividades' || c.name === 'Portafolio') ? `${activities.length} acts.`
                          : c.name === 'Participación' ? `${Object.keys(participations).length} clases`
                          : `${c.expectedValue} esp.`
                        })
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
                      <TableCell colSpan={criteria.length + 2} className="text-center h-24">
                          No hay estudiantes en este grupo.
                      </TableCell>
                  </TableRow>
                )}
                {studentsInGroup.length > 0 && criteria.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={2} className="text-center h-24">
                          No has definido criterios de evaluación para este parcial. <Link href={`/groups/${groupId}/criteria`} className="text-primary underline">Defínelos aquí.</Link>
                      </TableCell>
                  </TableRow>
                )}
                {studentsInGroup.length > 0 && criteria.length > 0 && studentsInGroup.map(student => {
                  
                  return (
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
                    {criteria.map((criterion, index) => {
                      const isParticipation = criterion.name === 'Participación';
                      const isAutomatedActivity = criterion.name === 'Actividades' || criterion.name === 'Portafolio';
                      let earnedPercentage = 0;
                      let performanceRatio = 0;

                      if (isAutomatedActivity) {
                          const totalActivities = activities.length;
                          if (totalActivities > 0) {
                              const studentRecords = activityRecords[student.id] || {};
                              const deliveredActivities = Object.values(studentRecords).filter(Boolean).length;
                              performanceRatio = deliveredActivities / totalActivities;
                          }
                      } else if (isParticipation) {
                        const participationDates = Object.keys(participations);
                        if (participationDates.length > 0) {
                          const participatedClasses = participationDates.filter(date => participations[date]?.[student.id]).length;
                          performanceRatio = participatedClasses / participationDates.length;
                        }
                      } else {
                        const gradeDetail = grades[student.id]?.[criterion.id];
                        const delivered = gradeDetail?.delivered ?? 0;
                        const expected = criterion.expectedValue;
                        if(expected > 0) {
                          performanceRatio = delivered / expected;
                        }
                      }
                      
                      earnedPercentage = performanceRatio * criterion.weight;

                      return (
                      <TableCell key={criterion.id} className={cn("text-center", criterionColors[index % criterionColors.length])}>
                        {isParticipation || isAutomatedActivity ? (
                          <div className="flex flex-col items-center justify-center p-1">
                              <Label className='text-xs'>
                                {isAutomatedActivity ? 'Actividades Entregadas' : 'Participaciones'}
                              </Label>
                              <span className="font-bold">
                                {isAutomatedActivity ? `${Object.values(activityRecords[student.id] || {}).filter(Boolean).length} de ${activities.length}` : ''}
                                {isParticipation ? `${Object.values(participations).filter(p => p[student.id]).length} de ${Object.keys(participations).length}` : ''}
                              </span>
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
                      {`${(finalGrades[student.id] || 0).toFixed(0)}%`}
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
