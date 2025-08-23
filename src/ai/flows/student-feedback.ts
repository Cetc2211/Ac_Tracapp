
'use server';

/**
 * @fileOverview A Genkit flow for generating personalized student feedback.
 *
 * - generateStudentFeedback - A function that generates feedback based on performance data.
 * - StudentFeedbackInput - The input type for the generateStudentFeedback function.
 * - StudentFeedbackOutput - The return type for the generateStudentFeedback function.
 */

import { ai, geminiModel, standardModelConfig } from '@/ai';
import { z } from 'zod';

const AttendanceSchema = z.object({
  p: z.number().describe('Number of present classes.'),
  a: z.number().describe('Number of absent classes.'),
  total: z.number().describe('Total number of classes.'),
});

const ObservationSchema = z.object({
  type: z.string().describe('The type of observation (e.g., "Mérito", "Problema de conducta").'),
  details: z.string().describe('The details of the observation.'),
});

const GroupGradeSchema = z.object({
  group: z.string().describe('The subject or group name.'),
  grade: z.number().describe('The final grade for the subject.'),
});

const StudentFeedbackInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  gradesByGroup: z.array(GroupGradeSchema).describe('An array of grades for each group/subject.'),
  attendance: AttendanceSchema.describe('The student\'s attendance record.'),
  observations: z.array(ObservationSchema).optional().describe('A list of observations made by the teacher.'),
});
export type StudentFeedbackInput = z.infer<typeof StudentFeedbackInputSchema>;

const StudentFeedbackOutputSchema = z.object({
  feedback: z.string().describe('A comprehensive, encouraging feedback text for the student, written in Spanish. This should highlight strengths and areas of opportunity in a positive tone.'),
  recommendations: z.array(z.string()).describe('A list of 2-3 concrete, actionable recommendations in Spanish for the student to implement.'),
});
export type StudentFeedbackOutput = z.infer<typeof StudentFeedbackOutputSchema>;

export async function generateStudentFeedback(input: StudentFeedbackInput): Promise<StudentFeedbackOutput> {
  console.log('DIAGNOSIS: Input received by studentFeedbackFlow:', JSON.stringify(input, null, 2));
  return studentFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studentFeedbackPrompt',
  input: { schema: StudentFeedbackInputSchema },
  output: { schema: StudentFeedbackOutputSchema },
  config: {
    model: geminiModel,
    ...standardModelConfig,
  },
  prompt: `
    You are an expert educational psychologist. Generate brief, constructive, and personalized feedback for a student in Spanish.
    The output must be a JSON object with two fields: 'feedback' and 'recommendations'.

    **Data for {{{studentName}}}:**

    1.  **Grades (out of 100):**
    {{#each gradesByGroup}}
    - {{{group}}}: {{{grade}}}%
    {{/each}}

    2.  **Attendance:**
        - Attended: {{{attendance.p}}}
        - Absences: {{{attendance.a}}}
        - Total: {{{attendance.total}}}

    {{#if observations}}
    3.  **Teacher's Observations:**
    {{#each observations}}
    - Type: {{{type}}}, Details: {{{details}}}
    {{/each}}
    {{/if}}

    **Output Instructions:**

    1.  **'feedback' field (string):**
        - Write a comprehensive and encouraging paragraph.
        - Start by acknowledging the student's effort.
        - Highlight one or two key strengths (e.g., high grades, excellent attendance, positive observations like 'Mérito').
        - Gently introduce areas of opportunity based on the data (low grades, absences, negative observations). Frame them constructively.
        - End on a positive and motivational note, expressing confidence in the student's ability to succeed.

    2.  **'recommendations' field (array of strings):**
        - Provide a list of 2 to 3 concise, concrete, and actionable recommendations.
        - Each recommendation should be a separate string in the array.
        - Examples:
          - "Dedicar 30 minutos adicionales al día para repasar los temas de la materia."
          - "Formar un grupo de estudio con compañeros para prepararse para el próximo examen."
          - "Acercarse al profesor después de clase para aclarar dudas sobre los proyectos."
          - "Establecer una meta personal para reducir el número de ausencias en el próximo parcial."

    Ensure the final output strictly follows the JSON schema.
  `,
});


const studentFeedbackFlow = ai.defineFlow(
  {
    name: 'studentFeedbackFlow',
    inputSchema: StudentFeedbackInputSchema,
    outputSchema: StudentFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
