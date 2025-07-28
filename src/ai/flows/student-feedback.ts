
'use server';

/**
 * @fileOverview A Genkit flow for generating personalized student feedback.
 *
 * - generateStudentFeedback - A function that generates feedback based on performance data.
 * - StudentFeedbackInput - The input type for the generateStudentFeedback function.
 * - StudentFeedbackOutput - The return type for the generateStudentFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GradeItemSchema = z.object({
  group: z.string().describe('The subject or group name.'),
  grade: z.number().describe('The final grade for the subject.'),
});

const AttendanceSchema = z.object({
  p: z.number().describe('Number of present classes.'),
  a: z.number().describe('Number of absent classes.'),
  total: z.number().describe('Total number of classes.'),
});

const ObservationSchema = z.object({
  type: z.string().describe('The type of observation (e.g., "Mérito", "Problema de conducta").'),
  details: z.string().describe('The details of the observation.'),
});

const StudentFeedbackInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  gradesByGroup: z.array(GradeItemSchema).describe('A list of final grades for each subject.'),
  attendance: AttendanceSchema.describe('The student\'s attendance record.'),
  observations: z.array(ObservationSchema).optional().describe('A list of observations made by the teacher.'),
});
type StudentFeedbackInput = z.infer<typeof StudentFeedbackInputSchema>;

const StudentFeedbackOutputSchema = z.object({
  feedback: z.string().describe('A comprehensive feedback text for the student, written in Spanish.'),
});
export type StudentFeedbackOutput = z.infer<typeof StudentFeedbackOutputSchema>;

export async function generateStudentFeedback(input: StudentFeedbackInput): Promise<StudentFeedbackOutput> {
  return studentFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studentFeedbackPrompt',
  input: { schema: StudentFeedbackInputSchema },
  output: { schema: StudentFeedbackOutputSchema },
  prompt: `
    You are an expert educational psychologist. Generate a brief, constructive, and personalized feedback for a student in Spanish.
    The feedback must start with a "Recomendaciones:" section, followed by a positive reinforcement paragraph without a title.

    **Data for {{{studentName}}}:**

    1.  **Grades (out of 100):**
        {{#each gradesByGroup}}
        - {{{group}}}: {{{grade}}}
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
    1.  **Start with "Recomendaciones:":**
        - Be direct and concise.
        - Identify the most critical areas for improvement (low grades, high absences, negative observations like 'Problema de conducta' or 'Problema de lectura').
        - Provide one or two concrete, actionable recommendations. For example: "Recomendaciones:\nSe observa que tu desempeño en [Subject] necesita mejorar. Te recomendamos solicitar asesorías o formar grupos de estudio para reforzar los temas."
    
    2.  **Follow with a Positive Reinforcement Paragraph (No Title):**
        - After the recommendations, write a new paragraph.
        - Be encouraging and motivational.
        - Highlight one or two key strengths (high grades, perfect attendance, positive observations like 'Mérito').
        - End on a positive note, expressing confidence in the student's ability to succeed. For example: "¡Felicidades por tu excelente asistencia! Ese compromiso es tu mayor fortaleza y te ayudará a alcanzar tus metas."

    Combine both parts into a single, coherent text under the "feedback" field.
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
