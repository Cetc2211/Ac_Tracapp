
'use server';

/**
 * @fileOverview AI-powered student selector for equitable engagement, prioritizing students with fewer participations.
 *
 * - attendanceRandomizer - A function to select a student from a list, prioritizing less frequent participants.
 * - AttendanceRandomizerInput - The input type for the attendanceRandomizer function.
 * - AttendanceRandomizerOutput - The return type for the attendanceRandomizer function.
 */

import {ai} from '@/ai';
import {z} from 'genkit';

const StudentParticipationSchema = z.object({
  name: z.string().describe('The name of the student.'),
  participationCount: z.number().describe('How many times the student has participated.'),
});

const AttendanceRandomizerInputSchema = z.object({
  studentList: z.array(StudentParticipationSchema).describe('List of students in the class with their participation counts.'),
});
export type AttendanceRandomizerInput = z.infer<typeof AttendanceRandomizerInputSchema>;

const AttendanceRandomizerOutputSchema = z.object({
  selectedStudent: z.string().describe('The name of the randomly selected student.'),
});
export type AttendanceRandomizerOutput = z.infer<typeof AttendanceRandomizerOutputSchema>;

export async function attendanceRandomizer(input: AttendanceRandomizerInput): Promise<AttendanceRandomizerOutput> {
  return attendanceRandomizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'attendanceRandomizerPrompt',
  input: {schema: AttendanceRandomizerInputSchema},
  output: {schema: AttendanceRandomizerOutputSchema},
  prompt: `From the following list of students, randomly select one to call on. Prioritize students who have participated less frequently.

Student List & Participation Counts:
{{#each studentList}}
- {{name}}: {{participationCount}} participation(s)
{{/each}}

Your selection should favor students with lower participation counts to ensure equitable opportunities for all.

Selected Student:`,
});

const attendanceRandomizerFlow = ai.defineFlow(
  {
    name: 'attendanceRandomizerFlow',
    inputSchema: AttendanceRandomizerInputSchema,
    outputSchema: AttendanceRandomizerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
