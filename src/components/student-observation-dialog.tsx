
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Student, StudentObservation } from '@/lib/placeholder-data';
import { useState, useEffect } from 'react';

interface StudentObservationDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const observationTypes: Exclude<StudentObservation['type'], 'Otros' | string>[] = [
  'Problema de conducta',
  'Episodio emocional',
  'Mérito',
  'Demérito',
  'Asesoría académica',
];

export function StudentObservationDialog({ student, open, onOpenChange }: StudentObservationDialogProps) {
  const [observationType, setObservationType] = useState<StudentObservation['type'] | ''>('');
  const [details, setDetails] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setTimeout(() => {
        setObservationType('');
        setDetails('');
      }, 300); 
    }
  }, [open]);

  const handleSave = () => {
    if (!student || !observationType || !details.trim()) {
      toast({
        variant: 'destructive',
        title: 'Datos incompletos',
        description: 'Por favor, completa todos los campos de la observación.',
      });
      return;
    }

    // This is just a placeholder and won't be used
    const dummyCanalizationLogic = {
        requiresCanalization: false,
        canalizationTarget: undefined,
        requiresFollowUp: false,
        followUpUpdates: [],
        isClosed: true,
    }

    const newObservation: StudentObservation = {
      id: `OBS-${Date.now()}`,
      studentId: student.id,
      date: new Date().toISOString(),
      type: observationType,
      details: details.trim(),
      ...dummyCanalizationLogic,
    };

    try {
      const observationsKey = `observations_${student.id}`;
      const storedObservations = localStorage.getItem(observationsKey);
      const allObservations: StudentObservation[] = storedObservations ? JSON.parse(storedObservations) : [];
      allObservations.push(newObservation);
      localStorage.setItem(observationsKey, JSON.stringify(allObservations));

      toast({
        title: 'Observación guardada',
        description: `Se ha añadido una nueva entrada a la bitácora de ${student.name}.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving observation to localStorage', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo guardar la observación.',
      });
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Observación para {student.name}</DialogTitle>
          <DialogDescription>
            Registra una nueva conducta o situación para este estudiante.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <Label>Tipo de Observación</Label>
            <RadioGroup onValueChange={(value: StudentObservation['type']) => setObservationType(value)} value={observationType}>
              <div className="grid grid-cols-2 gap-4">
                {observationTypes.map((type) => (
                  <div key={type} className="flex items-center">
                    <RadioGroupItem value={type} id={`type-${type}`} />
                    <Label htmlFor={`type-${type}`} className="ml-2 font-normal cursor-pointer">{type}</Label>
                  </div>
                ))}
                 <div className="flex items-center">
                    <RadioGroupItem value="Otros" id="type-Otros" />
                    <Label htmlFor="type-Otros" className="ml-2 font-normal cursor-pointer">Otros</Label>
                  </div>
              </div>
            </RadioGroup>
            
            <Label htmlFor="observation-details" className="pt-4">Observaciones Detalladas</Label>
            <Textarea
              id="observation-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder={`Describe la conducta de tipo "${observationType}"...`}
            />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!details.trim() || !observationType}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
