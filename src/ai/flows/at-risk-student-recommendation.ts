
'use server';

/**
 * @fileOverview A Genkit flow for generating recommendations for at-risk students.
 *
 * - generateAtRiskStudentRecommendation - A function that generates an analysis and recommendations.
 * - AtRiskStudentInput - The input type for the function.
 * - AtRiskStudentOutput - The return type for the function.
 */

import { ai } from '@/ai';
import { z } from 'zod';

const GradeDetailSchema = z.object({
  name: z.string().describe('Name of the evaluation criterion.'),
  earned: z.number().describe('Percentage points earned by the student for this criterion.'),
  weight: z.number().describe('Total weight of this criterion in the final grade.'),
});

const GroupGradeSchema = z.object({
  group: z.string().describe('The subject or group name.'),
  grade: z.number().describe('The final grade for the subject.'),
  criteriaDetails: z.array(GradeDetailSchema).describe('Detailed breakdown of the grade by criterion.'),
});

const AttendanceSchema = z.object({
  p: z.number().describe('Number of present classes.'),
  a: z.number().describe('Number of absent classes.'),
  total: z.number().describe('Total number of classes.'),
});

const ObservationSchema = z.object({
  type: z.string().describe('The type of observation (e.g., "Problema de conducta", "Mérito").'),
  details: z.string().describe('The details of the observation.'),
});

const AtRiskStudentInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  riskReason: z.string().describe('A brief, pre-calculated reason why the student is considered at risk.'),
  gradesByGroup: z.array(GroupGradeSchema).describe('A list of final grades for each subject, with a detailed breakdown.'),
  attendance: AttendanceSchema.describe('The student\'s attendance record.'),
  observations: z.array(ObservationSchema).optional().describe('A list of observations made by the teacher.'),
});
export type AtRiskStudentInput = z.infer<typeof AtRiskStudentInputSchema>;

const AtRiskStudentOutputSchema = z.object({
  analysis: z.string().describe('A detailed analysis in Spanish explaining the root causes of the student\'s at-risk status, based on the provided data.'),
  recommendations: z.array(z.string()).describe('A list of 3-5 concrete, actionable recommendations in Spanish for the teacher to implement.'),
});
export type AtRiskStudentOutput = z.infer<typeof AtRiskStudentOutputSchema>;


export async function generateAtRiskStudentRecommendation(input: AtRiskStudentInput): Promise<AtRiskStudentOutput> {
  return atRiskStudentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'atRiskStudentPrompt',
  input: { schema: AtRiskStudentInputSchema },
  output: { schema: AtRiskStudentOutputSchema },
  prompt: `
    You are an expert educational psychologist and academic advisor. Your task is to provide a detailed analysis and actionable recommendations for an at-risk student.

    **Student Profile:**
    - **Name:** {{{studentName}}}
    - **Identified Risk:** {{{riskReason}}}

    **Academic & Behavioral Data:**

    **1. Academic Performance (Grades are out of 100):**
    {{#each gradesByGroup}}
    - **Subject: {{{group}}} (Final Grade: {{{grade}}})**
      {{#each criteriaDetails}}
      - Criterion: {{{name}}} (Weight: {{{weight}}}%, Earned: {{{earned}}}%)
      {{/each}}
    {{/each}}

    **2. Attendance Record:**
    - Present: {{{attendance.p}}}
    - Absences: {{{attendance.a}}}
    - Total Classes: {{{attendance.total}}}

    {{#if observations}}
    **3. Teacher's Observations:**
    {{#each observations}}
    - Type: {{{type}}}, Details: {{{details}}}
    {{/each}}
    {{/if}}

    **Task Instructions (Output in Spanish):**

    1.  **Analysis ('analysis' field):**
        - Write a concise paragraph explaining the **root causes** of the student's situation.
        - Synthesize information from all data points. Do not just list the data.
        - **Connect the dots:** For example, link poor grades in a specific subject to negative observations or low performance in a specific criterion (e.g., "El bajo rendimiento en Matemáticas ({{gradesByGroup.[0].grade}}%) parece estar directamente relacionado con su dificultad en el criterio 'Examen', donde solo obtuvo un {{gradesByGroup.[0].criteriaDetails.[0].earned}}% de {{gradesByGroup.[0].criteriaDetails.[0].weight}}%. Esto, sumado a las observaciones sobre 'Problema de conducta', sugiere una posible frustración o desinterés en la materia.")
        - Mention attendance if it's a contributing factor.

    2.  **Recommendations ('recommendations' field):**
        - Provide a list of 3 to 5 concrete, actionable steps the teacher can take.
        - The recommendations should be diverse and address the identified root causes.
        - **Examples of good recommendations:**
          - "Agendar una sesión de asesoría individual para revisar los temas del criterio 'Examen' en Matemáticas."
          - "Implementar un sistema de recompensas a corto plazo para reconocer mejoras en la conducta durante la clase."
          - "Contactar al tutor legal para discutir el patrón de ausentismo y establecer un plan de acción conjunto."
          - "Asignar un proyecto práctico en 'Proyecto Integrador' que se alinee con los intereses del estudiante para fomentar el engagement."

    Ensure the final output strictly follows the JSON schema with 'analysis' and 'recommendations' fields.
  `,
});

const atRiskStudentFlow = ai.defineFlow(
  {
    name: 'atRiskStudentFlow',
    inputSchema: AtRiskStudentInputSchema,
    outputSchema: AtRiskStudentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
