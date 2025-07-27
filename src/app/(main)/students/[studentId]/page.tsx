
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { students as initialStudents, Student, Group } from '@/lib/placeholder-data';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Edit, Mail, Phone, User, Save, Contact } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
};

type GradeDetail = {
  delivered: number | null;
  average: number | null;
};

type Grades = {
  [studentId: string]: {
    [criterionId: string]: GradeDetail;
  };
};

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    try {
      const storedStudents = localStorage.getItem('students');
      const studentsList = storedStudents ? JSON.parse(storedStudents) : initialStudents;
      setAllStudents(studentsList);
      
      const currentStudent = studentsList.find((s: Student) => s.id === studentId);
      setStudent(currentStudent || null);
      setEditingStudent(currentStudent || null);

      const storedGroups = localStorage.getItem('groups');
      const allGroups = storedGroups ? JSON.parse(storedGroups) : [];
      const studentGroups = allGroups.filter((g: Group) => 
        g.students.some(s => s.id === studentId)
      );
      setGroups(studentGroups);

    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      setStudent(null);
    }
  }, [studentId]);
  
  const calculateFinalGrade = useCallback((studentId: string, groupId: string) => {
    const criteriaKey = `criteria_${groupId}`;
    const gradesKey = `grades_${groupId}`;
    
    const storedCriteria = localStorage.getItem(criteriaKey);
    const evaluationCriteria: EvaluationCriteria[] = storedCriteria ? JSON.parse(storedCriteria) : [];

    const storedGrades = localStorage.getItem(gradesKey);
    const grades: Grades = storedGrades ? JSON.parse(storedGrades) : {};

    if (evaluationCriteria.length === 0) return 0;

    let finalGrade = 0;
    
    for (const criterion of evaluationCriteria) {
      const gradeDetail = grades[studentId]?.[criterion.id];
      const delivered = gradeDetail?.delivered ?? 0;
      const average = gradeDetail?.average ?? 0;
      const expected = criterion.expectedValue;

      if(expected > 0) {
        const criterionScore = (delivered / expected) * average;
        finalGrade += criterionScore * (criterion.weight / 100);
      }
    }
    return parseFloat(finalGrade.toFixed(2));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (editingStudent) {
      setEditingStudent((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSave = () => {
    if (!editingStudent) return;
    
    const updatedStudents = allStudents.map(s => s.id === editingStudent.id ? editingStudent as Student : s);
    setAllStudents(updatedStudents);
    setStudent(editingStudent as Student);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    
    toast({
      title: 'Estudiante Actualizado',
      description: 'La información del estudiante ha sido guardada.',
    });
    setIsEditDialogOpen(false);
  };
  
  if (!student) {
    // Wait for the useEffect to run
    return null;
  }
  
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" onClick={() => router.push('/students')}>
              <ArrowLeft />
              <span className="sr-only">Volver a Estudiantes</span>
            </Button>
            <div>
            <h1 className="text-3xl font-bold">Perfil del Estudiante</h1>
            <p className="text-muted-foreground">
                Información detallada de {student.name}.
            </p>
            </div>
         </div>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Perfil
              </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Estudiante</DialogTitle>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre*</Label>
                        <Input id="name" className="col-span-3" value={editingStudent?.name || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" className="col-span-3" value={editingStudent?.email || ''} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Teléfono</Label>
                        <Input id="phone" type="tel" className="col-span-3" value={editingStudent?.phone || ''} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tutorName" className="text-right">Tutor</Label>
                        <Input id="tutorName" className="col-span-3" value={editingStudent?.tutorName || ''} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tutorPhone" className="text-right">Tel. Tutor</Label>
                        <Input id="tutorPhone" type="tel" className="col-span-3" value={editingStudent?.tutorPhone || ''} onChange={handleInputChange} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader className="flex items-center flex-row gap-4">
                    <Image
                        src={student.photo}
                        alt={student.name}
                        width={80}
                        height={80}
                        className="rounded-full"
                    />
                    <div>
                        <CardTitle className="text-2xl">{student.name}</CardTitle>
                        <CardDescription>ID: {student.id}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        {student.riskLevel === 'high' && <Badge variant="destructive" className="text-md">Alto Riesgo</Badge>}
                        {student.riskLevel === 'medium' && <Badge variant="secondary" className="bg-amber-400 text-black text-md">Riesgo Medio</Badge>}
                        {student.riskLevel === 'low' && <Badge variant="secondary" className="text-md">Riesgo Bajo</Badge>}
                     </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{student.email || "No registrado"}</span>
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{student.phone || "No registrado"}</span>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Contact className="h-5 w-5"/>
                        Información del Tutor
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{student.tutorName || "No registrado"}</span>
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{student.tutorPhone || "No registrado"}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Rendimiento Académico</CardTitle>
                    <CardDescription>Calificaciones finales en los grupos inscritos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Grupo</TableHead>
                                <TableHead className="text-right">Calificación Final</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups.map(group => (
                                <TableRow key={group.id}>
                                    <TableCell>{group.subject}</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{calculateFinalGrade(student.id, group.id)}</TableCell>
                                </TableRow>
                            ))}
                            {groups.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center h-24">El estudiante no está en ningún grupo.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

