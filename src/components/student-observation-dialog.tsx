
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
import { useState } from 'react';

interface StudentObservationDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const observationTypes: StudentObservation['type'][] = [
  'Problemas de conducta',
  'Episodios emocionales',
  'Cambio de conducta significativo',
  'Mérito',
  'Demérito',
  'Irresponsabilidad',
  'Otros',
];

export function StudentObservationDialog({ student, open, onOpenChange }: StudentObservationDialogProps) {
  const [step, setStep] = useState(1);
  const [observationType, setObservationType] = useState<StudentObservation['type'] | null>(null);
  const [details, setDetails] = useState('');
  const { toast } = useToast();

  const handleNext = () => {
    if (observationType) {
      setStep(2);
    } else {
      toast({
        variant: 'destructive',
        title: 'Selección requerida',
        description: 'Por favor, elige un tipo de observación.',
      });
    }
  };

  const handleSave = () => {
    if (!student || !observationType || !details.trim()) {
      toast({
        variant: 'destructive',
        title: 'Datos incompletos',
        description: 'Por favor, completa todos los campos de la observación.',
      });
      return;
    }

    const newObservation: StudentObservation = {
      id: `OBS-${Date.now()}`,
      studentId: student.id,
      date: new Date().toISOString(),
      type: observationType,
      details: details.trim(),
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

      handleClose();
    } catch (error) {
      console.error('Error saving observation to localStorage', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo guardar la observación.',
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after a short delay to allow dialog to close
    setTimeout(() => {
        setStep(1);
        setObservationType(null);
        setDetails('');
    }, 300);
  }

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Observación para {student.name}</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Selecciona el tipo de conducta o situación a registrar.' : 'Describe detalladamente la situación.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="py-4 space-y-4">
            <Label>Tipo de Observación</Label>
            <RadioGroup onValueChange={(value: StudentObservation['type']) => setObservationType(value)}>
              <div className="grid grid-cols-2 gap-4">
                {observationTypes.map((type) => (
                  <div key={type} className="flex items-center">
                    <RadioGroupItem value={type} id={type} />
                    <Label htmlFor={type} className="ml-2 font-normal cursor-pointer">{type}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {step === 2 && (
          <div className="py-4 space-y-4">
            <Label htmlFor="observation-details">Observaciones Detalladas</Label>
            <Textarea
              id="observation-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={6}
              placeholder={`Describe la conducta de tipo "${observationType}"...`}
            />
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <>
                <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button onClick={handleNext} disabled={!observationType}>Siguiente</Button>
            </>
          )}
          {step === 2 && (
             <>
                <Button variant="outline" onClick={() => setStep(1)}>Volver</Button>
                <Button onClick={handleSave} disabled={!details.trim()}>Guardar Observación</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
