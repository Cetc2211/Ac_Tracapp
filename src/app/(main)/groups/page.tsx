
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Student, Group } from '@/lib/placeholder-data';
import { Users, ClipboardList, PlusCircle, BookCopy, Settings, AlertTriangle } from 'lucide-react';
import { AttendanceRandomizer } from '@/components/attendance-randomizer';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useData } from '@/hooks/use-data';

const cardColors = [
    'bg-card-1',
    'bg-card-2',
    'bg-card-3',
    'bg-card-4',
    'bg-card-5',
];


export default function GroupsPage() {
  const { groups, allStudents, setGroups, setAllStudents, groupAverages, atRiskStudents, setActiveGroupId } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [bulkNames, setBulkNames] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkPhones, setBulkPhones] = useState('');
  const [bulkTutorNames, setBulkTutorNames] = useState('');
  const [bulkTutorPhones, setBulkTutorPhones] = useState('');

  const { toast } = useToast();

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'El nombre de la asignatura es obligatorio.'
        });
        return;
    }

    const names = bulkNames.trim().split('\n').filter(name => name);
    const emails = bulkEmails.trim().split('\n');
    const phones = bulkPhones.trim().split('\n');
    const tutorNames = bulkTutorNames.trim().split('\n');
    const tutorPhones = bulkTutorPhones.trim().split('\n');
    
    const studentsForNewGroup: Student[] = names.map((name, index) => ({
      id: `S${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${index}`,
      name: name.trim(),
      email: emails[index]?.trim() || '',
      phone: phones[index]?.trim() || '',
      tutorName: tutorNames[index]?.trim() || '',
      tutorPhone: tutorPhones[index]?.trim() || '',
      photo: 'https://placehold.co/100x100.png',
    }));

    const newGroup: Group = {
        id: `G${Date.now()}`,
        subject: newGroupName,
        students: studentsForNewGroup,
    };
    
    const updatedGroups = [...groups, newGroup];
    const updatedAllStudents = [...allStudents];
    studentsForNewGroup.forEach(newStudent => {
        if (!updatedAllStudents.some(s => s.id === newStudent.id)) {
            updatedAllStudents.push(newStudent);
        }
    });

    setGroups(updatedGroups);
    setAllStudents(updatedAllStudents);

    // Reset form
    setNewGroupName('');
    setBulkNames('');
    setBulkEmails('');
    setBulkPhones('');
    setBulkTutorNames('');
    setBulkTutorPhones('');
    setIsDialogOpen(false);

    toast({
        title: 'Grupo Creado',
        description: `El grupo "${newGroupName}" ha sido creado exitosamente.`
    });
  };

  const handleGroupClick = (groupId: string) => {
    setActiveGroupId(groupId);
  };
  
  const getHighRiskCountForGroup = (groupId: string) => {
      const group = groups.find(g => g.id === groupId);
      if(!group) return 0;
      return atRiskStudents.filter(s => s.calculatedRisk.level === 'high' && group.students.some(gs => gs.id === s.id)).length;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grupos de Asignaturas</h1>
          <p className="text-muted-foreground">
            Gestiona tus grupos, toma asistencia y registra actividades.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Nuevo Grupo
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                  <DialogDescription>
                      Ingresa los detalles para crear un nuevo grupo de asignatura y añade a sus estudiantes.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                      <Label htmlFor="group-name">Nombre de la Asignatura*</Label>
                      <Input 
                          id="group-name" 
                          placeholder="Ej. Cálculo Diferencial"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                      />
                  </div>
                    <div className="grid gap-2">
                      <Label>Añadir Estudiantes al Grupo (Opcional)</Label>
                        <p className="text-sm text-muted-foreground">
                          Pega una columna de datos en cada campo. Asegúrate de que cada línea corresponda al mismo estudiante. Los estudiantes nuevos se crearán y añadirán al grupo.
                      </p>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                          <Textarea className="lg:col-span-1" placeholder="Nombres* (uno por línea)" rows={5} value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} />
                          <Textarea className="lg:col-span-1" placeholder="Emails (opcional)" rows={5} value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} />
                          <Textarea className="lg:col-span-1" placeholder="Teléfonos (opcional)" rows={5} value={bulkPhones} onChange={(e) => setBulkPhones(e.target.value)} />
                          <Textarea className="lg:col-span-1" placeholder="Nombres Tutor (opcional)" rows={5} value={bulkTutorNames} onChange={(e) => setBulkTutorNames(e.target.value)} />
                          <Textarea className="lg:col-span-1" placeholder="Teléfonos Tutor (opcional)" rows={5} value={bulkTutorPhones} onChange={(e) => setBulkTutorPhones(e.target.value)} />
                      </div>
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateGroup}>Crear Grupo</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, index) => {
            const average = groupAverages[group.id] || 0;
            const highRiskCount = getHighRiskCountForGroup(group.id);
            const colorClass = cardColors[index % cardColors.length];
            
            return (
              <Card key={group.id} className={cn("flex flex-col text-card-foreground-alt", colorClass)}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">{group.subject}</CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-2 text-card-foreground-alt/80">
                                <Users className="h-4 w-4" />
                                <span>{group.students.length} estudiantes</span>
                            </CardDescription>
                        </div>
                        <Button asChild variant="ghost" size="icon" className="text-card-foreground-alt hover:bg-white/20 hover:text-card-foreground-alt">
                            <Link href={`/groups/${group.id}`} onClick={() => handleGroupClick(group.id)}>
                                <Settings className="h-5 w-5" />
                                  <span className="sr-only">Configurar</span>
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-sm space-y-2">
                    <div className='flex items-center gap-2'><span className='font-semibold'>Promedio Gral:</span> <span className={`font-bold`}>{average.toFixed(1)}</span></div>
                    <div className='flex items-center gap-2'><span className='font-semibold'>Riesgo Alto:</span> <span className='font-bold flex items-center gap-1'>{highRiskCount > 0 && <AlertTriangle className="h-4 w-4" />} {highRiskCount}</span></div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <Button asChild variant="outline" className="bg-transparent border-card-foreground-alt/50 text-card-foreground-alt hover:bg-white/20 hover:text-card-foreground-alt">
                    <Link href={`/groups/${group.id}`} onClick={() => handleGroupClick(group.id)}>
                      <ClipboardList className="mr-2 h-4 w-4" /> Detalles
                    </Link>
                  </Button>
                  <AttendanceRandomizer students={group.students} variant="outline" className="bg-transparent border-card-foreground-alt/50 text-card-foreground-alt hover:bg-white/20 hover:text-card-foreground-alt" />
                </CardFooter>
              </Card>
            )
        })}
         {groups.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                     <div className="bg-muted rounded-full p-4">
                        <BookCopy className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-semibold leading-none tracking-tight">No hay grupos todavía</h3>
                    <CardDescription>Crea tu primer grupo para empezar a organizar a tus estudiantes.</CardDescription>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
