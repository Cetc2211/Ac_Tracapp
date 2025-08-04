
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Student, StudentObservation } from '@/lib/placeholder-data';
import { useState } from 'react';
import { Input } from './ui/input';
import { useData } from '@/hooks/use-data';

interface ObservationDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const observationTypes: Exclude<StudentObservation['type'], 'Otros'>[] = [
  'Problema de conducta',
  'Episodio emocional',
  'Mérito',
  'Demérito',
  'Asesoría académica',
];

const canalizationTypes: StudentObservation['canalizationTarget'][] = [
    'Tutor',
    'Atención psicológica',
    'Directivo',
    'Padre/Madre/Tutor legal',
]

export function ObservationDialog({ student, open, onOpenChange }: ObservationDialogProps) {
  const { saveStudentObservation } = useData();
  const [step, setStep] = useState(1);
  const [observationType, setObservationType] = useState<StudentObservation['type'] | ''>('');
  const [otherType, setOtherType] = useState('');
  const [details, setDetails] = useState('');
  const [requiresCanalization, setRequiresCanalization] = useState<boolean | null>(null);
  const [canalizationTarget, setCanalizationTarget] = useState<StudentObservation['canalizationTarget'] | ''>('');
  const [otherCanalizationTarget, setOtherCanalizationTarget] = useState('');
  const [requiresFollowUp, setRequiresFollowUp] = useState<boolean | null>(null);

  const { toast } = useToast();

  const resetState = () => {
    setStep(1);
    setObservationType('');
    setOtherType('');
    setDetails('');
    setRequiresCanalization(null);
    setCanalizationTarget('');
    setOtherCanalizationTarget('');
    setRequiresFollowUp(null);
  }

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after a short delay to allow dialog to close
    setTimeout(() => {
        resetState();
    }, 300);
  }
  
  const handleNext = () => {
    if (step === 1) {
        if (!observationType) {
             toast({ variant: 'destructive', title: 'Selección requerida', description: 'Por favor, elige un tipo de observación.' });
             return;
        }
        if (observationType === 'Otros' && !otherType.trim()) {
            toast({ variant: 'destructive', title: 'Campo requerido', description: 'Por favor, especifica el tipo de observación.' });
            return;
        }
        setStep(2);
    } else if (step === 2) {
        if(!details.trim()){
            toast({ variant: 'destructive', title: 'Campo requerido', description: 'Por favor, detalla la observación.' });
            return;
        }
        setStep(3);
    } else if (step === 3) {
        if (requiresCanalization === null) {
            toast({ variant: 'destructive', title: 'Selección requerida', description: 'Por favor, indica si se requiere canalización.' });
            return;
        }
        if (requiresCanalization) {
            if(!canalizationTarget) {
                 toast({ variant: 'destructive', title: 'Selección requerida', description: 'Por favor, elige a quién se canalizará.' });
                 return;
            }
            if(canalizationTarget === 'Otros' && !otherCanalizationTarget.trim()) {
                 toast({ variant: 'destructive', title: 'Campo requerido', description: 'Por favor, especifica con quién se canaliza.' });
                 return;
            }
        }
        setStep(4);
    }
  };

  const handleSave = () => {
    if (!student || !observationType || !details.trim()) {
      toast({ variant: 'destructive', title: 'Datos incompletos' });
      return;
    }
     if (requiresFollowUp === null) {
        toast({ variant: 'destructive', title: 'Selección requerida', description: 'Por favor, indica si se requiere seguimiento.' });
        return;
    }

    const finalObservationType = observationType === 'Otros' ? otherType.trim() : observationType;
    let finalCanalizationTarget: string | undefined = undefined;
    if (requiresCanalization) {
        finalCanalizationTarget = canalizationTarget === 'Otros' ? otherCanalizationTarget.trim() : canalizationTarget;
    }

    const newObservation: StudentObservation = {
      id: `OBS-${Date.now()}`,
      studentId: student.id,
      date: new Date().toISOString(),
      type: finalObservationType,
      details: details.trim(),
      requiresCanalization: requiresCanalization || false,
      canalizationTarget: finalCanalizationTarget,
      requiresFollowUp: requiresFollowUp,
      followUpUpdates: [],
      isClosed: false,
    };

    saveStudentObservation(newObservation);

    toast({
      title: 'Observación guardada',
      description: `Se ha añadido una nueva entrada a la bitácora de ${student.name}.`,
    });

    handleClose();
  };

  if (!student) return null;

  const renderStep = () => {
    switch (step) {
      case 1: // Tipo de observación
        return (
          <div className="py-4 space-y-4">
            <RadioGroup value={observationType} onValueChange={(value: StudentObservation['type']) => setObservationType(value)}>
              <div className="grid grid-cols-2 gap-4">
                {observationTypes.map((type) => (
                  <div key={type} className="flex items-center">
                    <RadioGroupItem value={type} id={type} />
                    <Label htmlFor={type} className="ml-2 font-normal cursor-pointer">{type}</Label>
                  </div>
                ))}
                 <div className="flex items-center">
                    <RadioGroupItem value="Otros" id="Otros-type" />
                    <Label htmlFor="Otros-type" className="ml-2 font-normal cursor-pointer">Otros</Label>
                  </div>
              </div>
            </RadioGroup>
            {observationType === 'Otros' && (
                 <div className="space-y-2 pt-2">
                    <Label htmlFor="other-type-input">Especificar "Otro"</Label>
                    <Input id="other-type-input" value={otherType} onChange={(e) => setOtherType(e.target.value)} placeholder="Nombre de la observación"/>
                </div>
            )}
          </div>
        );
      case 2: // Detalle de la observación
        return (
            <div className="py-4 space-y-2">
                <Label htmlFor="observation-details">Describe la situación detalladamente</Label>
                <Textarea
                id="observation-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={6}
                placeholder={`Observaciones sobre "${observationType === 'Otros' ? otherType : observationType}"...`}
                />
            </div>
        );
       case 3: // Requiere canalización
        return (
            <div className="py-4 space-y-4">
                 <Label>¿Requiere canalización?</Label>
                 <RadioGroup value={requiresCanalization === null ? '' : String(requiresCanalization)} onValueChange={(value) => setRequiresCanalization(value === 'true')}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="true" id="canal-yes" /><Label htmlFor="canal-yes">Sí</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="false" id="canal-no" /><Label htmlFor="canal-no">No</Label></div>
                 </RadioGroup>

                 {requiresCanalization && (
                    <div className='pt-4 space-y-4'>
                        <Label>¿Con quién se canaliza?</Label>
                         <RadioGroup value={canalizationTarget} onValueChange={(value) => setCanalizationTarget(value as StudentObservation['canalizationTarget'])}>
                            <div className="grid grid-cols-2 gap-4">
                                {canalizationTypes.map((type) => (
                                <div key={type} className="flex items-center">
                                    <RadioGroupItem value={type} id={type} />
                                    <Label htmlFor={type} className="ml-2 font-normal cursor-pointer">{type}</Label>
                                </div>
                                ))}
                                <div className="flex items-center">
                                    <RadioGroupItem value="Otros" id="Otros-canal" />
                                    <Label htmlFor="Otros-canal" className="ml-2 font-normal cursor-pointer">Otros</Label>
                                </div>
                            </div>
                        </RadioGroup>
                        {canalizationTarget === 'Otros' && (
                            <div className="space-y-2 pt-2">
                                <Label htmlFor="other-canal-input">Especificar con quién</Label>
                                <Input id="other-canal-input" value={otherCanalizationTarget} onChange={(e) => setOtherCanalizationTarget(e.target.value)} placeholder="Nombre o departamento"/>
                            </div>
                        )}
                    </div>
                 )}
            </div>
        );
        case 4: // Requiere seguimiento
            return (
                 <div className="py-4 space-y-4">
                    <Label>¿Requiere seguimiento docente?</Label>
                    <RadioGroup value={requiresFollowUp === null ? '' : String(requiresFollowUp)} onValueChange={(value) => setRequiresFollowUp(value === 'true')}>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="true" id="followup-yes" /><Label htmlFor="followup-yes">Sí, requiere seguimiento</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="false" id="followup-no" /><Label htmlFor="followup-no">No requiere seguimiento</Label></div>
                    </RadioGroup>
                 </div>
            );
      default:
        return null;
    }
  };

  const getDialogDescription = () => {
    switch (step) {
      case 1: return 'Selecciona el tipo de conducta o situación a registrar.';
      case 2: return 'Describe la situación con el mayor detalle posible.';
      case 3: return 'Indica si el estudiante necesita ser canalizado a otra área.';
      case 4: return 'Define si esta observación necesita seguimiento de tu parte.';
      default: return '';
    }
  }

  const getDialogTitle = () => {
    return `Observación para ${student.name} (Paso ${step}/4)`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        {renderStep()}

        <DialogFooter className="flex justify-between w-full">
            <Button variant="outline" onClick={step === 1 ? handleClose : () => setStep(s => s - 1)}>
                {step === 1 ? 'Cancelar' : 'Volver'}
            </Button>
            {step < 4 && <Button onClick={handleNext}>Siguiente</Button>}
            {step === 4 && <Button onClick={handleSave}>Guardar Observación</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
