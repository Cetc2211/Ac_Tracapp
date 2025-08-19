
'use client';

import { useState, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, ButtonProps } from '@/components/ui/button';
import type { Student } from '@/lib/placeholder-data';
import { attendanceRandomizer } from '@/ai/flows/attendance-randomizer';
import type { AttendanceRandomizerOutput } from '@/ai/flows/attendance-randomizer';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';
import { useData } from '@/hooks/use-data';

interface AttendanceRandomizerProps extends ButtonProps {
  students: Student[];
}

export function AttendanceRandomizer({ students, ...props }: AttendanceRandomizerProps) {
  const [result, setResult] = useState<AttendanceRandomizerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { partialData } = useData();
  const { participations } = partialData;

  const participationCounts = useMemo(() => {
    return students.map(student => {
        const participationDates = Object.keys(participations);
        const studentParticipations = participationDates.filter(date =>
            participations[date]?.[student.id]
        ).length;
        return { name: student.name, participationCount: studentParticipations };
    });
  }, [students, participations]);

  const handleRandomize = async () => {
    if (students.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No hay estudiantes en este grupo para seleccionar.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const randomStudent = await attendanceRandomizer({ studentList: participationCounts });
      setResult(randomStudent);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error selecting random student:', error);
      toast({
        variant: 'destructive',
        title: 'Error de IA',
        description: 'No se pudo seleccionar un estudiante. Por favor, inténtelo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleRandomize} disabled={isLoading} {...props}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-4 w-4" />
        )}
        Selección aleatoria
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estudiante Seleccionado</AlertDialogTitle>
            <AlertDialogDescription>
              El estudiante seleccionado para participar es:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 text-center text-2xl font-bold text-primary">
            {result?.selectedStudent}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setIsDialogOpen(false)}>¡Entendido!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
