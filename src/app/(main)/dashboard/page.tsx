
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, BookCopy, Users, AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { students as initialStudents, groups as initialGroups, Student, Group } from '@/lib/placeholder-data';
import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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

type AttendanceStatus = 'present' | 'absent' | 'late';

type AttendanceRecord = {
  [studentId: string]: AttendanceStatus;
};

type DailyAttendance = {
    [date: string]: AttendanceRecord;
}

type CalculatedRisk = {
    level: 'low' | 'medium' | 'high';
    reason: string;
}

type StudentWithRisk = Student & { calculatedRisk: CalculatedRisk };


export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [allGrades, setAllGrades] = useState<{[groupId: string]: Grades}>({});
  const [allAttendance, setAllAttendance] = useState<{[groupId: string]: DailyAttendance}>({});
  const [allCriteria, setAllCriteria] = useState<{[groupId: string]: EvaluationCriteria[]}>({});
  const [atRiskStudents, setAtRiskStudents] = useState<StudentWithRisk[]>([]);
  const [groupAverages, setGroupAverages] = useState<{[groupId: string]: number}>({});
  const [searchQuery, setSearchQuery] = useState('');

  const calculateFinalGrade = useCallback((studentId: string, groupId: string, criteria: EvaluationCriteria[], grades: Grades) => {
    if (!grades || !criteria || criteria.length === 0) return 0;
    const studentGrades = grades[studentId];
    if (!studentGrades) return 0;

    let finalGrade = 0;
    
    for (const criterion of criteria) {
      const gradeDetail = studentGrades[criterion.id];
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

  const getStudentRiskLevel = useCallback((student: Student, studentGroups: Group[], localGrades: any, localCriteria: any, localAttendance: any): CalculatedRisk => {
    if (studentGroups.length === 0) return {level: 'low', reason: 'No está en grupos.'};
    
    let totalGrades = 0;
    let gradeSum = 0;
    let maxAbsencePercentage = 0;

    for(const group of studentGroups) {
      const finalGrade = calculateFinalGrade(student.id, group.id, localCriteria[group.id] || [], localGrades[group.id] || {});
      gradeSum += finalGrade;
      totalGrades++;

      const groupAttendance = localAttendance[group.id];
      if (groupAttendance) {
          const totalDays = Object.keys(groupAttendance).length;
          if (totalDays > 0) {
              let absences = 0;
              for(const date in groupAttendance) {
                  if(groupAttendance[date][student.id] === 'absent') {
                      absences++;
                  }
              }
              const absencePercentage = (absences / totalDays) * 100;
              if(absencePercentage > maxAbsencePercentage) {
                  maxAbsencePercentage = absencePercentage;
              }
          }
      }
    }

    const averageGrade = totalGrades > 0 ? gradeSum / totalGrades : 10;

    if (averageGrade < 7 || maxAbsencePercentage > 20) {
        return {level: 'high', reason: `Promedio de ${averageGrade.toFixed(1)} o ${maxAbsencePercentage.toFixed(0)}% de ausencias.`};
    }
    if (averageGrade < 8 || maxAbsencePercentage > 10) {
       return {level: 'medium', reason: `Promedio de ${averageGrade.toFixed(1)} o ${maxAbsencePercentage.toFixed(0)}% de ausencias.`};
    }
    
    return {level: 'low', reason: `Promedio de ${averageGrade.toFixed(1)} y ${maxAbsencePercentage.toFixed(0)}% de ausencias.`};
  }, [calculateFinalGrade]);

  useEffect(() => {
    try {
      const storedStudents = localStorage.getItem('students');
      const storedGroups = localStorage.getItem('groups');
      
      const loadedStudents = storedStudents ? JSON.parse(storedStudents) : initialStudents;
      const loadedGroups = storedGroups ? JSON.parse(storedGroups) : initialGroups;

      setStudents(loadedStudents);
      setGroups(loadedGroups);

      const localGrades: {[groupId: string]: Grades} = {};
      const localAttendance: {[groupId: string]: DailyAttendance} = {};
      const localCriteria: {[groupId: string]: EvaluationCriteria[]} = {};

      for (const group of loadedGroups) {
        const storedGrades = localStorage.getItem(`grades_${group.id}`);
        if(storedGrades) localGrades[group.id] = JSON.parse(storedGrades);

        const storedAttendance = localStorage.getItem(`attendance_${group.id}`);
        if(storedAttendance) localAttendance[group.id] = JSON.parse(storedAttendance);

        const storedCriteria = localStorage.getItem(`criteria_${group.id}`);
        if(storedCriteria) localCriteria[group.id] = JSON.parse(storedCriteria);
      }
      setAllGrades(localGrades);
      setAllAttendance(localAttendance);
      setAllCriteria(localCriteria);

      const calculatedAtRisk = loadedStudents.map((s: Student) => {
          const studentGroups = loadedGroups.filter((g: Group) => g.students.some(sg => sg.id === s.id));
          return { ...s, calculatedRisk: getStudentRiskLevel(s, studentGroups, localGrades, localCriteria, localAttendance) }
      })
      .filter((s: StudentWithRisk) => s.calculatedRisk.level === 'high' || s.calculatedRisk.level === 'medium')
      .sort((a: StudentWithRisk, b: StudentWithRisk) => {
          if (a.calculatedRisk.level === 'high' && b.calculatedRisk.level !== 'high') return -1;
          if (a.calculatedRisk.level !== 'high' && b.calculatedRisk.level === 'high') return 1;
          return 0;
      });
      setAtRiskStudents(calculatedAtRisk);

      const newGroupAverages: {[groupId: string]: number} = {};
      for(const group of loadedGroups) {
          const groupGrades = group.students.map(s => calculateFinalGrade(s.id, group.id, localCriteria[group.id] || [], localGrades[group.id] || {}));
          const groupAverage = groupGrades.length > 0 ? groupGrades.reduce((a,b) => a + b, 0) / groupGrades.length : 0;
          newGroupAverages[group.id] = groupAverage;
      }
      setGroupAverages(newGroupAverages);

    } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        // Fallback to initial data if localStorage is corrupt
        setStudents(initialStudents);
        setGroups(initialGroups);
    }
  }, [getStudentRiskLevel, calculateFinalGrade]);


  const overallAverageParticipation = useMemo(() => {
    let totalPossibleAttendance = 0;
    let totalPresents = 0;
    for(const groupId in allAttendance) {
      const groupAttendance = allAttendance[groupId];
      const group = groups.find(g => g.id === groupId);
      if(!group) continue;
      
      for(const date in groupAttendance){
        totalPossibleAttendance += group.students.length;
        for(const studentId in groupAttendance[date]) {
          if (group.students.some(s => s.id === studentId) && groupAttendance[date][studentId] === 'present') {
            totalPresents++;
          }
        }
      }
    }
    return totalPossibleAttendance > 0 ? Math.round((totalPresents / totalPossibleAttendance) * 100) : 100;
  }, [allAttendance, groups]);
  
  const filteredAtRiskStudents = useMemo(() => {
    return atRiskStudents.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [atRiskStudents, searchQuery]);


  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estudiantes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de estudiantes registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos Creados</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de asignaturas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estudiantes en Riesgo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {atRiskStudents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención especial
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Asistencia Media
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAverageParticipation}%</div>
            <p className="text-xs text-muted-foreground">
              Promedio en todas las clases
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Grupos Recientes</CardTitle>
              <CardDescription>
                Resumen de los grupos y su rendimiento.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/groups">
                Ver Todos
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asignatura</TableHead>
                  <TableHead className="text-center">Estudiantes</TableHead>
                  <TableHead className="text-right">Promedio Gral.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.slice(0, 5).map((group) => {
                  return (
                    <TableRow key={group.id}>
                      <TableCell>
                        <div className="font-medium">{group.subject}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {group.students.length}
                      </TableCell>
                      <TableCell className="text-right">{(groupAverages[group.id] || 0).toFixed(1)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Estudiantes con Alertas</CardTitle>
            <CardDescription>
              Estudiantes que requieren seguimiento por rendimiento o ausencias.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 flex-grow">
            {atRiskStudents.slice(0, 4).map((student) => (
              <div key={student.id} className="flex items-center gap-4">
                <Image
                  alt="Avatar"
                  className="rounded-full"
                  height={40}
                  src={student.photo}
                  data-ai-hint="student avatar"
                  style={{
                    aspectRatio: '40/40',
                    objectFit: 'cover',
                  }}
                  width={40}
                />
                <div className="grid gap-1">
                  <Link href={`/students/${student.id}`} className="text-sm font-medium leading-none hover:underline">
                    {student.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{student.calculatedRisk.reason}</p>
                </div>
                <div className="ml-auto font-medium">
                  {student.calculatedRisk.level === 'high' && (
                    <Badge variant="destructive">Alto Riesgo</Badge>
                  )}
                  {student.calculatedRisk.level === 'medium' && (
                    <Badge variant="secondary" className="bg-amber-400 text-black">
                      Riesgo Medio
                    </Badge>
                  )}
                </div>
              </div>
            ))}
             {atRiskStudents.length === 0 && (
                <p className="text-sm text-center text-muted-foreground">No hay estudiantes con alertas.</p>
            )}
          </CardContent>
          {atRiskStudents.length > 0 && (
            <CardFooter>
                 <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        Ver todos ({atRiskStudents.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Estudiantes en Riesgo</DialogTitle>
                      <DialogDescription>
                        Lista completa de estudiantes que requieren atención especial.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar estudiante..."
                            className="pl-8 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2">
                        {filteredAtRiskStudents.map((student) => (
                           <div key={student.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted">
                                <Image
                                alt="Avatar"
                                className="rounded-full"
                                height={40}
                                src={student.photo}
                                data-ai-hint="student avatar"
                                style={{
                                    aspectRatio: '40/40',
                                    objectFit: 'cover',
                                }}
                                width={40}
                                />
                                <div className="grid gap-1 flex-grow">
                                <Link href={`/students/${student.id}`} className="text-sm font-medium leading-none hover:underline">
                                    {student.name}
                                </Link>
                                <p className="text-sm text-muted-foreground">{student.calculatedRisk.reason}</p>
                                </div>
                                <div className="ml-auto font-medium">
                                {student.calculatedRisk.level === 'high' && (
                                    <Badge variant="destructive">Alto Riesgo</Badge>
                                )}
                                {student.calculatedRisk.level === 'medium' && (
                                    <Badge variant="secondary" className="bg-amber-400 text-black">
                                    Riesgo Medio
                                    </Badge>
                                )}
                                </div>
                            </div>
                        ))}
                        {filteredAtRiskStudents.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-8">
                                No se encontraron estudiantes con ese nombre.
                            </p>
                        )}
                    </div>
                  </DialogContent>
                </Dialog>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
