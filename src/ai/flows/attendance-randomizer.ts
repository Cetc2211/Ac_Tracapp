'use server';

/**
 * @fileOverview AI-powered random student selector for equitable engagement and participation tracking.
 *
 * - attendanceRandomizer - A function to randomly select a student from a list.
 * - AttendanceRandomizerInput - The input type for the attendanceRandomizer function.
 * - AttendanceRandomizerOutput - The return type for the attendanceRandomizer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AttendanceRandomizerInputSchema = z.object({
  studentList: z.array(z.string()).describe('List of student names in the class.'),
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
  prompt: `Given the following list of students, randomly select one student to call on.\n\nStudent List:\n{{#each studentList}}- {{{this}}}\n{{/each}}\n\nSelected Student:`,
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
