'use server';

import { ai } from '@/ai';
import { z } from 'zod';

export const ReportSummaryInputSchema = z.object({
  groupName: z.string().describe('El nombre de la asignatura o grupo.'),
  totalStudents: z.number().describe('El número total de estudiantes en el grupo.'),
  approvedCount: z.number().describe('El número de estudiantes que aprobaron.'),
  failedCount: z.number().describe('El número de estudiantes que reprobaron.'),
  groupAverage: z.number().describe('La calificación promedio del grupo.'),
  attendanceRate: z.number().describe('La tasa de asistencia promedio del grupo.'),
  highRiskCount: z.number().describe('El número de estudiantes en riesgo alto.'),
  mediumRiskCount: z.number().describe('El número de estudiantes en riesgo medio.'),
});
export type ReportSummaryInput = z.infer<typeof ReportSummaryInputSchema>;

export const ReportSummaryOutputSchema = z.object({
  summaryText: z.string().describe('Un texto de resumen de 2 a 3 párrafos sobre el rendimiento del grupo, destacando los puntos clave de los datos proporcionados.'),
});
export type ReportSummaryOutput = z.infer<typeof ReportSummaryOutputSchema>;

const prompt = ai.definePrompt({
    name: 'reportSummaryPrompt',
    input: { schema: ReportSummaryInputSchema },
    output: { schema: ReportSummaryOutputSchema },
    prompt: `
        Eres un asistente de análisis académico para un profesor.
        Tu tarea es redactar un resumen conciso y profesional del rendimiento de un grupo de estudiantes basado en los datos proporcionados.
        El resumen debe ser formal, objetivo y fácil de entender.

        Datos del Grupo:
        - Asignatura: {{groupName}}
        - Total de Estudiantes: {{totalStudents}}
        - Aprobados (calificación >= 60%): {{approvedCount}}
        - Reprobados: {{failedCount}}
        - Calificación Promedio del Grupo: {{groupAverage}}%
        - Tasa de Asistencia General: {{attendanceRate}}%
        - Estudiantes en Riesgo Alto: {{highRiskCount}}
        - Estudiantes en Riesgo Medio: {{mediumRiskCount}}

        Instrucciones:
        1.  Comienza con una introducción que mencione el nombre de la asignatura y el número total de estudiantes.
        2.  Describe el rendimiento general en términos de aprobación y calificación promedio.
        3.  Menciona la tasa de asistencia y cómo podría relacionarse con el rendimiento general.
        4.  Si hay estudiantes en riesgo, menciónalo como un punto clave que requiere atención.
        5.  Concluye con una breve frase que resuma la situación del grupo.
        6.  No uses viñetas ni enumeraciones. Redacta el resultado como un texto fluido en párrafos.
        7.  El tono debe ser informativo y de apoyo para el profesor.
    `,
});

export const generateReportSummary = ai.defineFlow(
    {
        name: 'generateReportSummary',
        inputSchema: ReportSummaryInputSchema,
        outputSchema: ReportSummaryOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
