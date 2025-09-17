'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
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
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';


export default function AttendancePage() {
  const { activeGroup, partialData, setAttendance, takeAttendanceForDate } = useData();
  const { attendance } = partialData;
  const { toast } = useToast();
  
  // Nuevo estado para la fecha seleccionada en el calendario
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Usa useMemo para optimizar el orden de los estudiantes
  const studentsToDisplay = useMemo(() => {
    return activeGroup ? [...activeGroup.students].sort((a, b) => a.name.localeCompare(b.name)) : [];
  }, [activeGroup]);
  
  // Obtiene las fechas de asistencia y las ordena de más reciente a más antigua
  const attendanceDates = useMemo(() => {
    if (!attendance) return [];
    return Object.keys(attendance).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
  }, [attendance]);

  // Manejador para registrar asistencia para la fecha seleccionada
  const handleRegisterDate = async () => {
    if (!activeGroup || !date) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Por favor, selecciona una fecha y un grupo.',
        });
        return;
    }
    
    // Formatea la fecha seleccionada al formato YYYY-MM-DD
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Llama a la función del "cerebro" para registrar la asistencia
    await takeAttendanceForDate(activeGroup.id, formattedDate);
    
    toast({
        title: 'Asistencia registrada',
        description: `Se ha registrado la asistencia para el día ${formattedDate}.`,
    });
  };

  // Manejador para cambiar el estado de asistencia de un estudiante
  const handleAttendanceChange = (studentId: string, date: string, isPresent: boolean) => {
    setAttendance(prev => {
      const newAttendance = { ...prev };
      if (!newAttendance[date]) {
          newAttendance[date] = {};
      }
      newAttendance[date][studentId] = isPresent;
      return newAttendance;
    });
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
            <h1 className="text-3xl font-bold">Registro de Asistencia</h1>
            <p className="text-muted-foreground">
              {activeGroup 
                ? `Grupo: ${activeGroup.subject}` 
                : 'Selecciona un grupo para registrar asistencias.'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            {activeGroup && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={'outline'}
                            className={cn(
                                'w-[280px] justify-start text-left font-normal',
                                !date && 'text-muted-foreground',
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            )}
            {activeGroup && (
                <Button onClick={handleRegisterDate}>Registrar Asistencia</Button>
            )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] sticky left-0 bg-card z-10">Estudiante</TableHead>
                  {attendanceDates.map(date => (
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
                    {attendanceDates.map(date => (
                      <TableCell key={`${student.id}-${date}`} className="text-center">
                        <Checkbox 
                           checked={attendance[date]?.[student.id] || false}
                           onCheckedChange={(checked) => handleAttendanceChange(student.id, date, !!checked)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                 {studentsToDisplay.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={attendanceDates.length + 1} className="text-center h-24">
                           {activeGroup 
                           ? "Este grupo no tiene estudiantes." 
                           : "No hay un grupo activo. Por favor, selecciona uno en la sección de 'Grupos'."
                           }
                        </TableCell>
                    </TableRow>
                )}
                 {attendanceDates.length === 0 && studentsToDisplay.length > 0 && (
                    <TableRow>
                        <TableCell colSpan={1} className="text-center h-24">
                           Selecciona una fecha para registrar la primera asistencia.
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
