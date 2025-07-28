
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

type GlobalAttendanceRecord = {
  [date: string]: {
    [studentId: string]: boolean; 
  };
};

export default function AttendancePage() {
  const [studentsToDisplay, setStudentsToDisplay] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<GlobalAttendanceRecord>({});
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [activeGroupName, setActiveGroupName] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const router = useRouter();


  useEffect(() => {
    try {
      const storedActiveGroupId = localStorage.getItem('activeGroupId');
      const groupName = localStorage.getItem('activeGroupName');
      setActiveGroupName(groupName);
      setActiveGroupId(storedActiveGroupId);

      let relevantStudents: Student[] = [];
      const allGroupsJson = localStorage.getItem('groups');
      const allGroups: Group[] = allGroupsJson ? JSON.parse(allGroupsJson) : [];

      if (storedActiveGroupId) {
        const activeGroup = allGroups.find(g => g.id === storedActiveGroupId);
        relevantStudents = activeGroup ? activeGroup.students : [];
      } else {
         const allStudentsJson = localStorage.getItem('students');
         if(allStudentsJson){
            relevantStudents = JSON.parse(allStudentsJson);
         } else {
            const studentsFromGroups = allGroups.flatMap(g => g.students);
            relevantStudents = Array.from(new Map(studentsFromGroups.map(s => [s.id, s])).values());
         }
      }
      setStudentsToDisplay(relevantStudents);

      // Load attendance data
      const storedAttendance = localStorage.getItem('globalAttendance');
      if (storedAttendance) {
        const parsedAttendance = JSON.parse(storedAttendance);
        setAttendance(parsedAttendance);
        const dates = Object.keys(parsedAttendance).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        setAttendanceDates(dates);
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
        }
        return newAttendance;
      });
    }
  };
  
  const handleAttendanceChange = (studentId: string, date: string, isPresent: boolean) => {
    const newAttendance = { ...attendance };
    if (!newAttendance[date]) {
      newAttendance[date] = {};
    }
    newAttendance[date][studentId] = isPresent;
    setAttendance(newAttendance);
    localStorage.setItem('globalAttendance', JSON.stringify(newAttendance));
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
                <h1 className="text-3xl font-bold">Registro de Asistencia General</h1>
                <p className="text-muted-foreground">
                    {activeGroupName 
                        ? `Mostrando asistencia para el grupo: ${activeGroupName}` 
                        : 'Marca la asistencia de todos los estudiantes para una fecha específica.'
                    }
                </p>
            </div>
        </div>
        <Button onClick={handleRegisterToday}>Registrar Asistencia de Hoy</Button>
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
                            No hay estudiantes para mostrar.
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
