
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
type StudentFeedbackOutput = z.infer<typeof StudentFeedbackOutputSchema>;

export async function generateStudentFeedback(input: StudentFeedbackInput): Promise<StudentFeedbackOutput> {
  return studentFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studentFeedbackPrompt',
  input: { schema: StudentFeedbackInputSchema },
  output: { schema: StudentFeedbackOutputSchema },
  prompt: `
    You are an expert educational psychologist and academic advisor.
    Your task is to generate a constructive, encouraging, and personalized feedback for a high school student based on their academic performance.
    The feedback should be written in Spanish, in a supportive and clear tone.

    Analyze the following data for the student, {{{studentName}}}:

    **1. Academic Performance (Grades out of 100):**
    {{#each gradesByGroup}}
    - Subject: {{{group}}}, Final Grade: {{{grade}}}
    {{/each}}

    **2. Attendance Record:**
    - Total Classes: {{{attendance.total}}}
    - Attended: {{{attendance.p}}}
    - Absences: {{{attendance.a}}}

    {{#if observations}}
    **3. Teacher's Observations:**
    {{#each observations}}
    - Type: {{{type}}}
      Details: {{{details}}}
    {{/each}}
    {{/if}}

    **Instructions for generating the feedback:**
    1.  **Introduction:** Start with a positive and encouraging opening addressing the student by name.
    2.  **Analyze Strengths:** Identify areas where the student is performing well. Mention specific subjects with high grades and good attendance as indicators of responsibility and commitment.
    3.  **Identify Areas for Improvement:** Gently point out areas that need attention. This could be subjects with lower grades or a pattern of absences. Frame this constructively, focusing on potential and growth. If there are negative observations (e.g., 'Problema de conducta'), address them as behaviors that can be improved and may be affecting their performance, offering a path forward.
    4.  **Provide Specific, Actionable Recommendations:** Based on the analysis (especially teacher observations), provide concrete suggestions. 
        - If 'Problema de lectura' is mentioned, suggest specific strategies like reading 20 minutes daily or using text-to-speech tools.
        - If there are behavioral issues, suggest talking to a counselor or teacher.
        - For academic struggles, recommend seeking extra help, forming study groups, or reviewing specific concepts.
    5.  **Closing:** End with a motivational and forward-looking statement, expressing confidence in the student's ability to succeed.

    Combine all these points into a single, coherent text in the "feedback" field.
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
