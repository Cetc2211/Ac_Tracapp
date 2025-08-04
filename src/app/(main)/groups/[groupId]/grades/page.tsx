
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
import type { EvaluationCriteria, Grades, StudentObservation } from '@/hooks/use-data';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { getPartialLabel } from '@/lib/utils';

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
    activePartial,
    criteria, 
    grades, 
    participations, 
    activities, 
    activityRecords,
    allObservations, 
    setGrades,
    calculateFinalGrade
  } = useData();

  const { toast } = useToast();

  const handleSaveGrades = () => {
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
    
    const newGrades = JSON.parse(JSON.stringify(grades));

    if (!newGrades[studentId]) {
      newGrades[studentId] = {};
    }
    if (!newGrades[studentId][criterionId]) {
      newGrades[studentId][criterionId] = { delivered: null };
    }
    newGrades[studentId][criterionId].delivered = numericValue;
    
    setGrades(newGrades);
  };
  
  const finalGrades = useMemo(() => {
    const calculatedGrades: {[studentId: string]: number} = {};
    if (activeGroup) {
      for (const student of activeGroup.students) {
         const studentObservations = allObservations[student.id] || [];
        calculatedGrades[student.id] = calculateFinalGrade(student.id, criteria, grades, participations, activities, activityRecords, studentObservations);
      }
    }
    return calculatedGrades;
  }, [activeGroup, criteria, grades, participations, activities, activityRecords, calculateFinalGrade, allObservations]);

  const studentsInGroup = useMemo(() => {
      if (!activeGroup || !activeGroup.students) return [];
      return [...activeGroup.students].sort((a,b) => a.name.localeCompare(b.name));
  }, [activeGroup]);

  if (!activeGroup) {
    return notFound();
  }

  const partialLabel = getPartialLabel(activePartial);

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
                Grupo "{activeGroup.subject}" - {partialLabel}.
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
                          c.name === 'Portafolio' && !c.isAutomated ? `${c.expectedValue} esp.`
                          : c.name === 'Actividades' || (c.name === 'Portafolio' && c.isAutomated) ? `${activities.length} acts.`
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
                  const studentObservations = allObservations[student.id] || [];
                  const merits = studentObservations.filter(o => o.type === 'Mérito').length;
                  const demerits = studentObservations.filter(o => o.type === 'Demérito').length;
                  
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
                      const isAutomated = criterion.isAutomated;
                      let earnedPercentage = 0;
                      let performanceDetail = '';

                      if (isAutomated) {
                          let performanceRatio = 0;
                          if (criterion.name === 'Actividades' || (criterion.name === 'Portafolio' && criterion.isAutomated)) {
                              const totalActivities = activities.length;
                              if (totalActivities > 0) {
                                  const studentRecords = activityRecords[student.id] || {};
                                  const deliveredActivities = Object.values(studentRecords).filter(Boolean).length;
                                  performanceRatio = deliveredActivities / totalActivities;
                                  performanceDetail = `${deliveredActivities} de ${totalActivities}`;
                              } else {
                                  performanceDetail = `0 de 0`;
                              }
                          } else if (criterion.name === 'Participación') {
                            const participationDates = Object.keys(participations);
                            if (participationDates.length > 0) {
                              const participatedClasses = participationDates.filter(date => participations[date]?.[student.id]).length;
                              performanceRatio = participatedClasses / participationDates.length;
                              performanceDetail = `${participatedClasses} de ${participationDates.length}`;
                            } else {
                                performanceDetail = `0 de 0`;
                            }
                          }
                           earnedPercentage = performanceRatio * criterion.weight;
                      } else {
                        const gradeDetail = grades[student.id]?.[criterion.id];
                        const delivered = gradeDetail?.delivered ?? 0;
                        const expected = criterion.expectedValue;
                        if(expected > 0) {
                          earnedPercentage = (delivered / expected) * criterion.weight;
                        }
                      }

                      return (
                      <TableCell key={criterion.id} className={cn("text-center", criterionColors[index % criterionColors.length])}>
                        {isAutomated ? (
                          <div className="flex flex-col items-center justify-center p-1">
                              <Label className='text-xs'>
                                {criterion.name === 'Participación' ? 'Participaciones' : 'Entregas'}
                              </Label>
                              <span className="font-bold">
                                {performanceDetail}
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
                      <div className="flex items-center justify-center gap-2">
                        <span>{`${(finalGrades[student.id] || 0).toFixed(0)}%`}</span>
                        <div className="flex flex-col gap-1">
                          {merits > 0 && <Badge className="bg-green-600 text-white text-xs h-4 w-6 justify-center p-0">+{merits}</Badge>}
                          {demerits > 0 && <Badge variant="destructive" className="text-xs h-4 w-6 justify-center p-0">-{demerits}</Badge>}
                        </div>
                      </div>
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
