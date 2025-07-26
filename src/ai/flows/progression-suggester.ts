
'use server';
/**
 * @fileOverview A Genkit flow for generating didactic progression suggestions.
 *
 * - generateProgressionSuggestions - A function that generates activity suggestions for a didactic progression.
 * - ProgressionSuggesterInput - The input type for the generateProgressionSuggestions function.
 * - ProgressionSuggesterOutput - The return type for the generateProgressionSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ProgressionSuggesterInputSchema = z.object({
  progression: z.string().describe('The main content or topic of the progression.'),
  learningGoals: z.string().describe('The learning goals for this progression.'),
  trajectory: z.string().optional().describe('The learning trajectory or path.'),
});
export type ProgressionSuggesterInput = z.infer<typeof ProgressionSuggesterInputSchema>;

export const ProgressionSuggesterOutputSchema = z.object({
  opening: z.string().describe('A suggested opening activity to start the class.'),
  development: z.string().describe('A suggested development activity for the core of the class.'),
  closing: z.string().describe('A suggested closing activity to wrap up the class.'),
});
export type ProgressionSuggesterOutput = z.infer<typeof ProgressionSuggesterOutputSchema>;

export async function generateProgressionSuggestions(
  input: ProgressionSuggesterInput
): Promise<ProgressionSuggesterOutput> {
  return progressionSuggesterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'progressionSuggesterPrompt',
  input: { schema: ProgressionSuggesterInputSchema },
  output: { schema: ProgressionSuggesterOutputSchema },
  prompt: `
    You are an expert in pedagogy and instructional design for high school education.
    Based on the provided information, generate concise and practical suggestions for learning activities.
    The activities should be divided into three moments: opening, development, and closing.
    The tone should be creative, inspiring, and aligned with modern teaching methodologies.

    Progression Content:
    {{{progression}}}

    Learning Goals:
    {{{learningGoals}}}
    
    {{#if trajectory}}
    Learning Trajectory:
    {{{trajectory}}}
    {{/if}}

    Provide one distinct activity for each of the three moments.
  `,
});


const progressionSuggesterFlow = ai.defineFlow(
  {
    name: 'progressionSuggesterFlow',
    inputSchema: ProgressionSuggesterInputSchema,
    outputSchema: ProgressionSuggesterOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
