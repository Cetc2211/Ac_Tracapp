
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Student, StudentObservation } from '@/lib/placeholder-data';
import Image from 'next/image';
import { Mail, User, Contact, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { StudentStats } from '@/app/(main)/students/[studentId]/page';

interface StudentPrintReportProps {
  student: Student | null;
  studentStats: StudentStats | null;
  observations: StudentObservation[];
  generatedFeedback: string;
  attendanceRate: number;
}

export const StudentPrintReport = React.forwardRef<HTMLDivElement, StudentPrintReportProps>(
  ({ student, studentStats, observations, generatedFeedback, attendanceRate }, ref) => {
    
    if (!student) {
      return null;
    }

    return (
      <div ref={ref} className="p-8 font-sans">
        <h1 className="text-3xl font-bold text-center mb-2">Informe Individual del Estudiante</h1>
        <p className="text-center text-muted-foreground mb-8">
            Generado el {format(new Date(), "PPP", { locale: es })}
        </p>
        
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6 items-start">
                    <div className="md:col-span-1 flex justify-center">
                        <Image
                            alt="Avatar"
                            className="rounded-full aspect-square object-cover w-48 h-48"
                            height={192}
                            src={student.photo}
                            data-ai-hint="student avatar"
                            width={192}
                        />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Nombre Completo:</p>
                                    <p className="font-semibold text-lg">{student.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Email:</p>
                                    <p className="font-semibold">{student.email || 'No registrado'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Tutor:</p>
                                    <p className="font-semibold">{student.tutorName || 'No registrado'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Teléfono Tutor:</p>
                                    <p className="font-semibold">{student.tutorPhone || 'No registrado'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Contact className="h-6 w-6 text-primary mt-1 flex-shrink-0"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">ID de Estudiante:</p>
                                    <p className="font-semibold">{student.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6" style={{ breakInside: 'avoid-page' }}>
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen de Calificaciones</CardTitle>
                            <CardDescription>Desglose de calificaciones por materia y promedio semestral.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {studentStats?.gradesByGroup.map(item => (
                                    <div key={item.group} style={{ breakInside: 'avoid' }}>
                                        <div className="flex justify-between items-center p-3 rounded-t-md border bg-muted/50">
                                            <p className="font-semibold">{item.group}</p>
                                        </div>
                                        <div className='p-3 border-x border-b rounded-b-md text-sm space-y-2'>
                                            <div className='flex justify-between'><span>Primer Parcial:</span><span className='font-medium'>{item.grade.toFixed(1)}%</span></div>
                                            <div className='flex justify-between'><span>Segundo Parcial:</span><span className='font-medium'>0.0%</span></div>
                                            <div className='flex justify-between'><span>Tercer Parcial:</span><span className='font-medium'>0.0%</span></div>
                                            <div className='flex justify-between pt-2 border-t mt-2'><span className="font-bold">Promedio Semestral:</span><Badge variant={item.grade >= 70 ? "default" : "destructive"} className="text-base">{item.grade.toFixed(1)}%</Badge></div>
                                        </div>
                                    </div>
                                ))}
                                {studentStats?.gradesByGroup.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No hay calificaciones registradas.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Asistencia</CardTitle>
                            <CardDescription>Resumen de todos los grupos</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between p-2 border-b"><span>Total de Clases Registradas:</span> <span className="font-bold">{studentStats?.attendance.total || 0}</span></div>
                            <div className="flex justify-between p-2 rounded-md bg-green-100 dark:bg-green-900/50"><span>Presente:</span> <span className="font-bold">{studentStats?.attendance.p || 0}</span></div>
                            <div className="flex justify-between p-2 rounded-md bg-red-100 dark:bg-red-900/50"><span>Ausente:</span> <span className="font-bold">{studentStats?.attendance.a || 0}</span></div>
                            <div className="flex justify-between items-center p-3 rounded-md bg-blue-100 dark:bg-blue-900/50 mt-2"><p className="font-bold text-blue-800 dark:text-blue-300">Tasa de Asistencia:</p><Badge className="text-lg bg-blue-600 hover:bg-blue-600">{attendanceRate.toFixed(1)}%</Badge></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <Card style={{ breakInside: 'avoid-page' }}>
                <CardHeader><CardTitle>Bitácora de Observaciones</CardTitle></CardHeader>
                <CardContent>
                    {observations.length > 0 ? (
                        <div className="space-y-4">
                            {observations.map(obs => (
                                <div key={obs.id} className="border-l-4 pl-3 py-1" style={{borderColor: obs.type === 'Mérito' ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))', breakInside: 'avoid' }}>
                                    <div className="flex justify-between items-center"><p className="font-semibold text-sm">{obs.type}</p><p className="text-xs text-muted-foreground">{format(new Date(obs.date), "dd/MM/yy", { locale: es })}</p></div>
                                    <p className="text-xs mt-1">{obs.details}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-center text-muted-foreground py-4">No hay observaciones registradas.</p>}
                </CardContent>
            </Card>

            {generatedFeedback &&
                <Card style={{ breakInside: 'avoid-page' }}>
                    <CardHeader><CardTitle>Retroalimentación y Recomendaciones</CardTitle></CardHeader>
                    <CardContent>
                        <div className="p-4 bg-muted/50 rounded-md border whitespace-pre-wrap text-sm">{generatedFeedback}</div>
                    </CardContent>
                </Card>
            }
        </div>
      </div>
    );
  }
);

StudentPrintReport.displayName = 'StudentPrintReport';
