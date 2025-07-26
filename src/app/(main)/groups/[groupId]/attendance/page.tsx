
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
import { groups as initialGroups } from '@/lib/placeholder-data';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type AttendanceStatus = 'present' | 'absent' | 'late';

type AttendanceRecord = {
  [studentId: string]: AttendanceStatus;
};

type DailyAttendance = {
    [date: string]: AttendanceRecord;
}

export default function GroupAttendancePage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<(typeof initialGroups)[0] | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<DailyAttendance>({});
  const { toast } = useToast();
  
  const dateKey = format(date, 'yyyy-MM-dd');

  useEffect(() => {
    try {
      const storedGroups = localStorage.getItem('groups');
      const allGroups = storedGroups ? JSON.parse(storedGroups) : initialGroups;
      const currentGroup = allGroups.find((g: any) => g.id === groupId);
      setGroup(currentGroup || null);

      const storedAttendance = localStorage.getItem(`attendance_${groupId}`);
      if (storedAttendance) {
        setAttendance(JSON.parse(storedAttendance));
      }
    } catch (error) {
      console.error('Failed to parse data from localStorage', error);
      setGroup(null);
    }
  }, [groupId]);

  const saveAttendance = () => {
    localStorage.setItem(`attendance_${groupId}`, JSON.stringify(attendance));
    toast({
      title: 'Asistencia Guardada',
      description: `La asistencia para el ${format(date, 'PPP', { locale: es })} ha sido guardada.`,
    });
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => {
        const newAttendance = { ...prev };
        if (!newAttendance[dateKey]) {
            newAttendance[dateKey] = {};
        }
        newAttendance[dateKey][studentId] = status;
        return newAttendance;
    });
  };

  const currentDayAttendance = attendance[dateKey] || {};

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
            <h1 className="text-3xl font-bold">Tomar Asistencia</h1>
            <p className="text-muted-foreground">
              Registra la asistencia para "{group.subject}".
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[280px] justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
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
                onSelect={(newDate) => setDate(newDate || new Date())}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={saveAttendance}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Asistencia
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Estudiante</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsInGroup.map(student => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium flex items-center gap-3">
                    <Image
                      src={student.photo}
                      alt={student.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    {student.name}
                  </TableCell>
                  <TableCell className="text-center">
                    <RadioGroup
                      value={currentDayAttendance[student.id] || 'present'}
                      onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}
                      className="flex justify-center gap-8"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="present" id={`${student.id}-present`} />
                        <Label htmlFor={`${student.id}-present`}>Presente</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                        <Label htmlFor={`${student.id}-absent`}>Ausente</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="late" id={`${student.id}-late`} />
                        <Label htmlFor={`${student.id}-late`}>Retardo</Label>
                      </div>
                    </RadioGroup>
                  </TableCell>
                </TableRow>
              ))}
              {studentsInGroup.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center h-24">
                    No hay estudiantes en este grupo.
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
