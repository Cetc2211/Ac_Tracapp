
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
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
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';

export default function ParticipationsPage() {
  const { activeGroup, activePartial, participations, setParticipations, attendance } = useData();
  const { toast } = useToast();

  const isPartialClosed = activeGroup && activePartial ? activeGroup.closedPartials.includes(activePartial) : true;

  const studentsToDisplay = useMemo(() => {
    return activeGroup ? [...activeGroup.students].sort((a,b) => a.name.localeCompare(b.name)) : [];
  }, [activeGroup]);

  const participationDates = useMemo(() => {
    return Object.keys(participations).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
  }, [participations]);


  const handleRegisterToday = () => {
    if (!activeGroup) return;
    const today = format(new Date(), 'yyyy-MM-dd');

    setParticipations(prev => {
        const newParticipations = { ...prev };
        if (!newParticipations[today]) {
          newParticipations[today] = {};
        }
        return newParticipations;
    });
  };
  
  const handleParticipationChange = (studentId: string, date: string, hasParticipated: boolean) => {
    if (!activeGroup) return;

    if (hasParticipated) {
      const studentHasAttendance = attendance[date]?.[studentId] === true;
      if (!studentHasAttendance) {
        toast({
          variant: 'destructive',
          title: 'Incongruencia en el registro',
          description: 'El estudiante no tiene asistencia registrada para este día.',
        });
        return; 
      }
    }
    
    setParticipations(prev => {
      const newParticipations = { ...prev };
      if (!newParticipations[date]) {
        newParticipations[date] = {};
      }
      newParticipations[date][studentId] = hasParticipated;
      return newParticipations;
    })
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
             <Button asChild variant="outline" size="icon">
              <Link href={activeGroup ? `/groups/${activeGroup.id}` : '/groups'}>
                <ArrowLeft />
                <span className="sr-only">Regresar</span>
              </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold">Registro de Participaciones</h1>
                <p className="text-muted-foreground">
                    {activeGroup 
                        ? `Grupo: ${activeGroup.subject}` 
                        : 'Selecciona un grupo para registrar participaciones.'
                    }
                </p>
            </div>
        </div>
        {activeGroup && <Button onClick={handleRegisterToday} disabled={isPartialClosed}>Registrar Participaciones de Hoy</Button>}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] sticky left-0 bg-card z-10">Estudiante</TableHead>
                  {participationDates.map(date => (
                    <TableHead key={date} className="text-center">
                      {format(parseISO(date), 'dd MMM', { locale: es })}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsToDisplay.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 flex items-center gap-3">
                       <Image
                        src={student.photo}
                        alt={student.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      {student.name}
                    </TableCell>
                    {participationDates.map(date => (
                      <TableCell key={`${student.id}-${date}`} className="text-center">
                        <Checkbox 
                           checked={participations[date]?.[student.id] || false}
                           onCheckedChange={(checked) => handleParticipationChange(student.id, date, !!checked)}
                           disabled={isPartialClosed}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                 {studentsToDisplay.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={participationDates.length + 1} className="text-center h-24">
                           {activeGroup 
                           ? "Este grupo no tiene estudiantes." 
                           : "No hay un grupo activo. Por favor, selecciona uno en la sección de 'Grupos'."
                           }
                        </TableCell>
                    </TableRow>
                )}
                 {participationDates.length === 0 && studentsToDisplay.length > 0 && (
                    <TableRow>
                        <TableCell colSpan={1} className="text-center h-24">
                           Haz clic en "Registrar Participaciones de Hoy" para empezar.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
