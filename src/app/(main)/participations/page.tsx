
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

type ParticipationRecord = {
  [date: string]: {
    [studentId: string]: boolean; 
  };
};

export default function ParticipationsPage() {
  const [studentsToDisplay, setStudentsToDisplay] = useState<Student[]>([]);
  const [participations, setParticipations] = useState<ParticipationRecord>({});
  const [participationDates, setParticipationDates] = useState<string[]>([]);
  const [activeGroupName, setActiveGroupName] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedActiveGroupId = localStorage.getItem('activeGroupId');
      const groupName = localStorage.getItem('activeGroupName');
      const allGroupsJson = localStorage.getItem('groups');
      const allGroups: Group[] = allGroupsJson ? JSON.parse(allGroupsJson) : [];

      setActiveGroupName(groupName);
      setActiveGroupId(storedActiveGroupId);

      let relevantStudents: Student[] = [];
      if (storedActiveGroupId) {
        const activeGroup = allGroups.find(g => g.id === storedActiveGroupId);
        relevantStudents = activeGroup ? activeGroup.students : [];
      }
      setStudentsToDisplay(relevantStudents);

      if (storedActiveGroupId) {
        const storedParticipations = localStorage.getItem(`participations_${storedActiveGroupId}`);
        if (storedParticipations) {
          const parsedParticipations = JSON.parse(storedParticipations);
          setParticipations(parsedParticipations);
          const dates = Object.keys(parsedParticipations).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          setParticipationDates(dates);
        }
      } else {
        setParticipations({});
        setParticipationDates([]);
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
    if (!participationDates.includes(today)) {
      const newDates = [today, ...participationDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      setParticipationDates(newDates);

      setParticipations(prev => {
        const newParticipations = { ...prev };
        if (!newParticipations[today]) {
          newParticipations[today] = {};
        }
        return newParticipations;
      });
    }
  };
  
  const handleParticipationChange = (studentId: string, date: string, hasParticipated: boolean) => {
    if (!activeGroupId) return;

    const newParticipations = { ...participations };
    if (!newParticipations[date]) {
      newParticipations[date] = {};
    }
    newParticipations[date][studentId] = hasParticipated;
    setParticipations(newParticipations);
    localStorage.setItem(`participations_${activeGroupId}`, JSON.stringify(newParticipations));
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
                <h1 className="text-3xl font-bold">Registro de Participaciones</h1>
                <p className="text-muted-foreground">
                    {activeGroupName 
                        ? `Mostrando participaciones para el grupo: ${activeGroupName}` 
                        : 'Selecciona un grupo para registrar participaciones.'
                    }
                </p>
            </div>
        </div>
        {activeGroupId && <Button onClick={handleRegisterToday}>Registrar Participaciones de Hoy</Button>}
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
                    {participationDates.map(date => (
                      <TableCell key={`${student.id}-${date}`} className="text-center">
                        <Checkbox 
                           checked={participations[date]?.[student.id] || false}
                           onCheckedChange={(checked) => handleParticipationChange(student.id, date, !!checked)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                 {studentsToDisplay.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={participationDates.length + 1} className="text-center h-24">
                           {activeGroupName 
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
