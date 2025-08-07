
'use client';

import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Student } from '@/lib/placeholder-data';
import { Search, Users, BookText, Library } from 'lucide-react';
import { ObservationDialog } from '@/components/observation-dialog';
import { StudentObservationLogDialog } from '@/components/student-observation-log-dialog';
import { useData } from '@/hooks/use-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const StudentTable = ({ students, onOpenDialog, buttonText, buttonIcon }: { students: Student[], onOpenDialog: (student: Student) => void, buttonText: string, buttonIcon: React.ReactNode }) => {
    if (students.length === 0) {
        return (
            <div className="text-center p-12 text-muted-foreground">
                <p>No se encontraron estudiantes.</p>
            </div>
        )
    }
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="hidden w-[80px] sm:table-cell">
                    Foto
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Acción</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.map(student => (
                <TableRow key={student.id}>
                    <TableCell className="hidden sm:table-cell">
                    <Image
                        src={student.photo}
                        alt={student.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.id}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => onOpenDialog(student)}>
                            {buttonIcon}
                            {buttonText}
                        </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}


export default function ObservationsPage() {
  const { activeGroup, allObservations } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForNew, setSelectedStudentForNew] = useState<Student | null>(null);
  const [selectedStudentForLog, setSelectedStudentForLog] = useState<Student | null>(null);
  const [isNewObservationDialogOpen, setIsNewObservationDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);

  const studentsToDisplay = useMemo(() => {
    return activeGroup?.students || [];
  }, [activeGroup]);

  const studentsWithObservations = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.students.filter(student => allObservations[student.id] && allObservations[student.id].length > 0);
  }, [activeGroup, allObservations]);

  const handleOpenNewObservationDialog = (student: Student) => {
    setSelectedStudentForNew(student);
    setIsNewObservationDialogOpen(true);
  };
  
  const handleOpenLogDialog = (student: Student) => {
    setSelectedStudentForLog(student);
    setIsLogDialogOpen(true);
  }

  const filteredAllStudents = useMemo(() => {
    return studentsToDisplay.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [studentsToDisplay, searchQuery]);
  
  const filteredStudentsWithObservations = useMemo(() => {
    return studentsWithObservations.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [studentsWithObservations, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
       {selectedStudentForNew && (
        <ObservationDialog
          student={selectedStudentForNew}
          open={isNewObservationDialogOpen}
          onOpenChange={setIsNewObservationDialogOpen}
        />
      )}
       {selectedStudentForLog && (
        <StudentObservationLogDialog
          student={selectedStudentForLog}
          open={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
        />
       )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bitácora de Observaciones</h1>
          <p className="text-muted-foreground">
            {activeGroup 
                ? `Registra y consulta observaciones para el grupo: ${activeGroup.subject}.`
                : 'Selecciona un grupo para ver a sus estudiantes.'
            }
          </p>
        </div>
      </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Lista de Estudiantes</CardTitle>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar estudiante..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {activeGroup ? (
                  <Tabs defaultValue="all">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="all">Todos los Estudiantes</TabsTrigger>
                      <TabsTrigger value="with-observations">
                        Con Observaciones <Badge className="ml-2">{studentsWithObservations.length}</Badge>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all">
                        <StudentTable 
                          students={filteredAllStudents} 
                          onOpenDialog={handleOpenNewObservationDialog}
                          buttonText='Ver / Registrar'
                          buttonIcon={<BookText className="mr-2 h-4 w-4" />}
                        />
                    </TabsContent>
                    <TabsContent value="with-observations">
                         <StudentTable 
                          students={filteredStudentsWithObservations} 
                          onOpenDialog={handleOpenLogDialog}
                          buttonText='Ver Bitácora'
                          buttonIcon={<Library className="mr-2 h-4 w-4" />}
                        />
                    </TabsContent>
                  </Tabs>
                ) : (
                     <div className="text-center p-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-4">
                            <Users className="h-12 w-12" />
                            <h3 className="text-lg font-semibold">No hay un grupo activo seleccionado</h3>
                            <p className="text-sm">Por favor, ve a la sección 'Grupos' y selecciona uno para empezar.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
