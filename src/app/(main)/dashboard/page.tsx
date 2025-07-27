
'use client';

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
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, BookCopy, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { students as initialStudents, groups as initialGroups, Student } from '@/lib/placeholder-data';
import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo } from 'react';

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


export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [groups, setGroups] = useState(initialGroups);
  const [allGrades, setAllGrades] = useState<{[groupId: string]: Grades}>({});
  const [allAttendance, setAllAttendance] = useState<{[groupId: string]: DailyAttendance}>({});
  const [allCriteria, setAllCriteria] = useState<{[groupId: string]: EvaluationCriteria[]}>({});

  useEffect(() => {
    try {
      const storedStudents = localStorage.getItem('students');
      const storedGroups = localStorage.getItem('groups');
      
      const loadedStudents = storedStudents ? JSON.parse(storedStudents) : initialStudents;
      const loadedGroups = storedGroups ? JSON.parse(storedGroups) : initialGroups;

      setStudents(loadedStudents);
      setGroups(loadedGroups);

      const grades: {[groupId: string]: Grades} = {};
      const attendance: {[groupId: string]: DailyAttendance} = {};
      const criteria: {[groupId: string]: EvaluationCriteria[]} = {};

      for (const group of loadedGroups) {
        const storedGrades = localStorage.getItem(`grades_${group.id}`);
        if(storedGrades) grades[group.id] = JSON.parse(storedGrades);

        const storedAttendance = localStorage.getItem(`attendance_${group.id}`);
        if(storedAttendance) attendance[group.id] = JSON.parse(storedAttendance);

        const storedCriteria = localStorage.getItem(`criteria_${group.id}`);
        if(storedCriteria) criteria[group.id] = JSON.parse(storedCriteria);
      }
      setAllGrades(grades);
      setAllAttendance(attendance);
      setAllCriteria(allCriteria);

    } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        // Fallback to initial data if localStorage is corrupt
        setStudents(initialStudents);
        setGroups(initialGroups);
    }
  }, []);

  const calculateFinalGrade = useCallback((studentId: string, groupId: string) => {
    const evaluationCriteria = allCriteria[groupId] || [];
    const studentGrades = allGrades[groupId]?.[studentId];

    if (!studentGrades || evaluationCriteria.length === 0) return 0;

    let finalGrade = 0;
    
    for (const criterion of evaluationCriteria) {
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
  }, [allGrades, allCriteria]);

  const getStudentRiskLevel = useCallback((student: Student): {level: 'low' | 'medium' | 'high', reason: string} => {
    const studentGroups = groups.filter(g => g.students.some(s => s.id === student.id));
    if (studentGroups.length === 0) return {level: 'low', reason: 'No está en grupos.'};
    
    let totalGrades = 0;
    let gradeSum = 0;
    let maxAbsencePercentage = 0;

    for(const group of studentGroups) {
      const finalGrade = calculateFinalGrade(student.id, group.id);
      gradeSum += finalGrade;
      totalGrades++;

      const groupAttendance = allAttendance[group.id];
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
  }, [groups, allAttendance, calculateFinalGrade]);


  const atRiskStudents = students.map(s => ({ ...s, calculatedRisk: getStudentRiskLevel(s) }))
    .filter(s => s.calculatedRisk.level === 'high' || s.calculatedRisk.level === 'medium');

  const overallAverageParticipation = useMemo(() => {
    let totalStudents = 0;
    let totalPresents = 0;
    for(const groupId in allAttendance) {
      const groupAttendance = allAttendance[groupId];
      const studentsInGroup = groups.find(g => g.id === groupId)?.students.length || 0;
      for(const date in groupAttendance){
        totalStudents += studentsInGroup;
        for(const studentId in groupAttendance[date]) {
          if (groupAttendance[date][studentId] === 'present') {
            totalPresents++;
          }
        }
      }
    }
    return totalStudents > 0 ? Math.round((totalPresents / totalStudents) * 100) : 75;
  }, [allAttendance, groups]);


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
                   const groupGrades = group.students.map(s => calculateFinalGrade(s.id, group.id));
                   const groupAverage = groupGrades.length > 0 ? groupGrades.reduce((a, b) => a + b, 0) / groupGrades.length : 0;
                  return (
                    <TableRow key={group.id}>
                      <TableCell>
                        <div className="font-medium">{group.subject}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {group.students.length}
                      </TableCell>
                      <TableCell className="text-right">{groupAverage.toFixed(1)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estudiantes con Alertas</CardTitle>
            <CardDescription>
              Estudiantes que requieren seguimiento por rendimiento o ausencias.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {atRiskStudents.map((student) => (
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
                      Medio Riesgo
                    </Badge>
                  )}
                </div>
              </div>
            ))}
             {atRiskStudents.length === 0 && (
                <p className="text-sm text-center text-muted-foreground">No hay estudiantes con alertas.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
