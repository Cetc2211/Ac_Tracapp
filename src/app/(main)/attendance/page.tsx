
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { Student, Group } from '@/lib/placeholder-data';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AttendanceRecord = {
  [date: string]: {
    [studentId: string]: boolean; 
  };
};

export default function AttendancePage() {
  const [studentsToDisplay, setStudentsToDisplay] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [activeGroupName, setActiveGroupName] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activePartial, setActivePartial] = useState<string | null>(null);
  const router = useRouter();


  useEffect(() => {
    try {
      const storedActiveGroupId = localStorage.getItem('activeGroupId');
      if (!storedActiveGroupId) {
          setStudentsToDisplay([]);
          return;
      };

      const groupName = localStorage.getItem('activeGroupName');
      const partial = localStorage.getItem(`activePartial_${storedActiveGroupId}`) || '1';

      setActiveGroupName(groupName);
      setActiveGroupId(storedActiveGroupId);
      setActivePartial(partial);

      let relevantStudents: Student[] = [];
      const allGroupsJson = localStorage.getItem('groups');
      const allGroups: Group[] = allGroupsJson ? JSON.parse(allGroupsJson) : [];
      
      const activeGroup = allGroups.find(g => g.id === storedActiveGroupId);
      relevantStudents = activeGroup ? activeGroup.students : [];
      setStudentsToDisplay(relevantStudents);
      
      const storedAttendance = localStorage.getItem(`attendance_${storedActiveGroupId}_${partial}`);
      if (storedAttendance) {
        const parsedAttendance = JSON.parse(storedAttendance);
        setAttendance(parsedAttendance);
        const dates = Object.keys(parsedAttendance).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        setAttendanceDates(dates);
      } else {
        setAttendance({});
        setAttendanceDates([]);
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    }
  }, []);
  
  const sortedStudents = useMemo(() => {
    return [...studentsToDisplay].sort((a, b) => a.name.localeCompare(b.name));
  }, [studentsToDisplay]);

  const handleRegisterToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (!attendanceDates.includes(today)) {
      const newDates = [today, ...attendanceDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      setAttendanceDates(newDates);

      // Initialize today's attendance if not present
      setAttendance(prev => {
        const newAttendance = { ...prev };
        if (!newAttendance[today]) {
          newAttendance[today] = {};
           // Set all students to present by default
          studentsToDisplay.forEach(student => {
            newAttendance[today][student.id] = true;
          });
        }
        return newAttendance;
      });
    }
  };
  
  const handleAttendanceChange = (studentId: string, date: string, isPresent: boolean) => {
    if (!activeGroupId || !activePartial) return;
    const newAttendance = { ...attendance };
    if (!newAttendance[date]) {
      newAttendance[date] = {};
    }
    newAttendance[date][studentId] = isPresent;
    setAttendance(newAttendance);
    localStorage.setItem(`attendance_${activeGroupId}_${activePartial}`, JSON.stringify(newAttendance));
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
             <Button asChild variant="outline" size="icon">
              <Link href={activeGroupId ? `/groups/${activeGroupId}` : '/groups'}>
                <ArrowLeft />
                <span className="sr-only">Regresar</span>
              </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold">Registro de Asistencia</h1>
                <p className="text-muted-foreground">
                    {activeGroupName 
                        ? `Mostrando asistencia para el grupo: ${activeGroupName}` 
                        : 'Marca la asistencia de los estudiantes para una fecha específica.'
                    }
                </p>
            </div>
        </div>
        {activeGroupId && <Button onClick={handleRegisterToday}>Registrar Asistencia de Hoy</Button>}
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
                {sortedStudents.map(student => (
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
                            No hay estudiantes para mostrar. Por favor, selecciona un grupo primero.
                        </TableCell>
                    </TableRow>
                )}
                 {attendanceDates.length === 0 && studentsToDisplay.length > 0 && (
                    <TableRow>
                        <TableCell colSpan={1} className="text-center h-24">
                           Haz clic en "Registrar Asistencia de Hoy" para empezar.
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
