
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Trash, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { groups as initialGroups } from '@/lib/placeholder-data';
import { useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
};

const nameOptions = ["Actividades", "Portafolio", "Participación", "Examen", "Proyecto Integrador", "Otros"];
const weightOptions = ["10", "20", "30", "40", "50", "60", "70", "80", "90", "100", "Otros"];

export default function GroupCriteriaPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<(typeof initialGroups)[0] | null>(null);
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriteria[]>([]);

  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedWeight, setSelectedWeight] = useState('');
  const [customWeight, setCustomWeight] = useState('');
  const [newCriterionValue, setNewCriterionValue] = useState('');
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<EvaluationCriteria | null>(null);

  const { toast } = useToast();
  
  const isParticipationSelected = useMemo(() => (selectedName === 'Participación'), [selectedName]);

  useEffect(() => {
    try {
      const storedGroups = localStorage.getItem('groups');
      const allGroups = storedGroups ? JSON.parse(storedGroups) : initialGroups;
      const currentGroup = allGroups.find((g: any) => g.id === groupId);
      setGroup(currentGroup || null);
      
      const storedCriteria = localStorage.getItem(`criteria_${groupId}`);
      if (storedCriteria) {
        setEvaluationCriteria(JSON.parse(storedCriteria));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      setGroup(null);
    }
  }, [groupId]);

  useEffect(() => {
    if(isParticipationSelected) {
        setNewCriterionValue('0');
    } else {
        setNewCriterionValue('');
    }
  }, [isParticipationSelected]);


  const saveCriteria = (newCriteria: EvaluationCriteria[]) => {
    setEvaluationCriteria(newCriteria);
    localStorage.setItem(`criteria_${groupId}`, JSON.stringify(newCriteria));
  };
  
  const handleAddCriterion = () => {
    const finalName = selectedName === 'Otros' ? customName.trim() : selectedName;
    const finalWeight = selectedWeight === 'Otros' ? customWeight : selectedWeight;
    
    const weight = parseFloat(finalWeight);
    const expectedValue = parseInt(newCriterionValue, 10);

    if (!finalName || isNaN(weight) || weight <= 0 || weight > 100 || (isNaN(expectedValue) && !isParticipationSelected) || (!isParticipationSelected && expectedValue < 0) ) {
        toast({
            variant: 'destructive',
            title: 'Datos inválidos',
            description: 'El nombre no puede estar vacío, el peso debe ser un número entre 1 y 100, y el valor esperado debe ser un número positivo.',
        });
        return;
    }

    const totalWeight = evaluationCriteria.reduce((sum, c) => sum + c.weight, 0) + weight;
    if (totalWeight > 100) {
        toast({
            variant: 'destructive',
            title: 'Límite de peso excedido',
            description: `El peso total (${totalWeight}%) no puede superar el 100%.`,
        });
        return;
    }

    const newCriterion: EvaluationCriteria = {
        id: `C${Date.now()}`,
        name: finalName,
        weight: weight,
        expectedValue: isParticipationSelected ? 0 : expectedValue, // For participation, expected value is calculated dynamically
    };

    saveCriteria([...evaluationCriteria, newCriterion]);
    setSelectedName('');
    setCustomName('');
    setSelectedWeight('');
    setCustomWeight('');
    setNewCriterionValue('');
    toast({ title: 'Criterio Agregado', description: `Se agregó "${newCriterion.name}" a la lista.`});
  };
  
  const handleRemoveCriterion = (criterionId: string) => {
    const newCriteria = evaluationCriteria.filter(c => c.id !== criterionId);
    saveCriteria(newCriteria);
    // Also remove any grades associated with this criterion
    const gradesKey = `grades_${groupId}`;
    const storedGrades = localStorage.getItem(gradesKey);
    if (storedGrades) {
        const grades = JSON.parse(storedGrades);
        for (const studentId in grades) {
            if (grades[studentId][criterionId]) {
                delete grades[studentId][criterionId];
            }
        }
        localStorage.setItem(gradesKey, JSON.stringify(grades));
    }
    toast({ title: 'Criterio Eliminado', description: 'El criterio de evaluación ha sido eliminado.' });
  };
  
  const handleOpenEditDialog = (criterion: EvaluationCriteria) => {
    setEditingCriterion({ ...criterion });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCriterion = () => {
    if (!editingCriterion) return;

    const weight = editingCriterion.weight;
    const expectedValue = editingCriterion.expectedValue;
    const isParticipation = editingCriterion.name === 'Participación';

     if (!editingCriterion.name.trim() || isNaN(weight) || weight <= 0 || weight > 100 || (isNaN(expectedValue) && !isParticipation) || (!isParticipation && expectedValue < 0) ) {
        toast({
            variant: 'destructive',
            title: 'Datos inválidos',
            description: 'El nombre no puede estar vacío, el peso debe ser un número entre 1 y 100, y el valor esperado debe ser un número positivo.',
        });
        return;
    }

    const otherCriteriaWeight = evaluationCriteria
      .filter(c => c.id !== editingCriterion.id)
      .reduce((sum, c) => sum + c.weight, 0);

    const totalWeight = otherCriteriaWeight + weight;
    if (totalWeight > 100) {
        toast({
            variant: 'destructive',
            title: 'Límite de peso excedido',
            description: `El peso total (${totalWeight}%) no puede superar el 100%.`,
        });
        return;
    }
    
    const updatedCriteria = evaluationCriteria.map(c => c.id === editingCriterion.id ? editingCriterion : c);
    saveCriteria(updatedCriteria);

    setIsEditDialogOpen(false);
    setEditingCriterion(null);
    toast({ title: 'Criterio Actualizado', description: 'Los cambios han sido guardados.' });
  };


  const totalWeight = useMemo(() => {
    return evaluationCriteria.reduce((sum, c) => sum + c.weight, 0);
  }, [evaluationCriteria]);

  if (!group) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <p>Cargando grupo...</p>
        </div>
    )
  }
  
  const finalNameForCheck = selectedName === 'Otros' ? customName.trim() : selectedName;
  const finalWeightForCheck = selectedWeight === 'Otros' ? customWeight : selectedWeight;
  const isAddButtonDisabled = !finalNameForCheck || !finalWeightForCheck || (!newCriterionValue && !isParticipationSelected);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href={`/groups/${groupId}`}>
            <ArrowLeft />
            <span className="sr-only">Volver al Grupo</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Criterios de Evaluación</h1>
          <p className="text-muted-foreground">
            Gestiona los rubros para la calificación del grupo "{group.subject}".
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Definir Criterios</CardTitle>
          <CardDescription>
            Define los rubros, su peso para la calificación final y el valor esperado para cada uno. El peso total no debe exceder el 100%.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 mb-6">
            <div className="flex-grow space-y-1">
                <Label htmlFor="criterion-name">Nombre del criterio</Label>
                <div className="flex gap-2">
                    <Select value={selectedName} onValueChange={setSelectedName}>
                        <SelectTrigger id="criterion-name">
                            <SelectValue placeholder="Selecciona un nombre" />
                        </SelectTrigger>
                        <SelectContent>
                            {nameOptions.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedName === 'Otros' && (
                        <Input 
                            placeholder="Nombre personalizado" 
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                        />
                    )}
                </div>
            </div>
             <div className="space-y-1">
                <Label htmlFor="criterion-weight">Peso %</Label>
                <div className="flex gap-2">
                    <Select value={selectedWeight} onValueChange={setSelectedWeight}>
                        <SelectTrigger id="criterion-weight" className="w-[120px]">
                            <SelectValue placeholder="Peso" />
                        </SelectTrigger>
                        <SelectContent>
                             {weightOptions.map(option => (
                                <SelectItem key={option} value={option}>{option === 'Otros' ? option : `${option}`}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     {selectedWeight === 'Otros' && (
                        <Input 
                            type="number"
                            placeholder="Peso %" 
                            className="w-[120px]"
                            value={customWeight}
                            onChange={(e) => setCustomWeight(e.target.value)}
                        />
                     )}
                </div>
             </div>
             <div className="space-y-1">
                <Label htmlFor="criterion-value">Valor Esperado</Label>
                <Input 
                    id="criterion-value"
                    type="number" 
                    placeholder={isParticipationSelected ? "Automático por asistencia" : "Valor Esperado"}
                    className="w-[180px]"
                    value={newCriterionValue}
                    onChange={(e) => setNewCriterionValue(e.target.value)}
                    disabled={isParticipationSelected}
                />
             </div>
            <Button size="icon" onClick={handleAddCriterion} disabled={isAddButtonDisabled} className="self-end">
                <PlusCircle className="h-4 w-4"/>
                <span className="sr-only">Agregar</span>
            </Button>
          </div>
          
          <h3 className="text-lg font-medium mb-2">Lista de Criterios</h3>
          <div className="space-y-2">
            {evaluationCriteria.map(criterion => (
                <div key={criterion.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                        <span className="font-medium">{criterion.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {criterion.name === 'Participación' 
                            ? 'Calculado automáticamente por asistencia' 
                            : `${criterion.expectedValue} es el valor esperado`
                          }
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">{criterion.weight}%</Badge>
                         <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleOpenEditDialog(criterion)}>
                            <Edit className="h-4 w-4"/>
                            <span className="sr-only">Editar</span>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRemoveCriterion(criterion.id)}>
                            <Trash className="h-4 w-4 text-destructive"/>
                            <span className="sr-only">Eliminar</span>
                        </Button>
                    </div>
                </div>
            ))}
            {evaluationCriteria.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-8">No has agregado criterios de evaluación.</p>
            )}
          </div>
        </CardContent>

        {(totalWeight > 0 || evaluationCriteria.length > 0) && (
            <CardHeader className="border-t pt-4 mt-4">
                <div className="flex justify-end">
                    {totalWeight > 0 && (
                        <div className={`text-right font-bold ${totalWeight > 100 ? 'text-destructive' : ''}`}>
                            Total: {totalWeight}% {totalWeight > 100 && "(Sobrepasa el 100%)"}
                        </div>
                    )}
                </div>
            </CardHeader>
        )}
      </Card>

      {editingCriterion && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Criterio de Evaluación</DialogTitle>
              <DialogDescription>
                Ajusta los detalles de tu criterio de evaluación.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="edit-name"
                  value={editingCriterion.name}
                  onChange={(e) => setEditingCriterion({ ...editingCriterion, name: e.target.value })}
                  className="col-span-3"
                  disabled={editingCriterion.name === 'Participación'}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-weight" className="text-right">
                  Peso %
                </Label>
                <Input
                  id="edit-weight"
                  type="number"
                  value={editingCriterion.weight}
                   onChange={(e) => setEditingCriterion({ ...editingCriterion, weight: parseFloat(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-value" className="text-right">
                  Valor Esperado
                </Label>
                <Input
                  id="edit-value"
                  type="number"
                  value={editingCriterion.expectedValue}
                  onChange={(e) => setEditingCriterion({ ...editingCriterion, expectedValue: parseInt(e.target.value, 10) || 0 })}
                  className="col-span-3"
                  disabled={editingCriterion.name === 'Participación'}
                  placeholder={editingCriterion.name === 'Participación' ? 'Automático por asistencia' : ''}
                />
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleUpdateCriterion}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

    