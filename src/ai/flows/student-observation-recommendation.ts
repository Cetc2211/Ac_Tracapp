
'use server';

/**
 * @fileOverview AI agent to provide recommendations based on student observations.
 *
 * - generateObservationRecommendation - Generates analysis and recommendations from observation data.
 * - ObservationRecommendationInput - The input type for the function.
 * - ObservationRecommendationOutput - The return type for the function.
 */

import {ai} from '@/ai';
import {z} from 'genkit';

const FollowUpUpdateSchema = z.object({
    date: z.string().describe("The date of the follow-up update in ISO format."),
    update: z.string().describe("The text content of the follow-up update."),
});

const ObservationRecommendationInputSchema = z.object({
  studentName: z.string().describe("The name of the student."),
  observationType: z.string().describe("The category of the initial observation (e.g., 'Problema de conducta', 'Mérito')."),
  initialObservation: z.string().describe("The detailed text of the initial observation."),
  followUpUpdates: z.array(FollowUpUpdateSchema).optional().describe("A list of follow-up updates, if any."),
});
export type ObservationRecommendationInput = z.infer<typeof ObservationRecommendationInputSchema>;

const ObservationRecommendationOutputSchema = z.object({
  analysis: z.string().describe("A brief analysis in Spanish of the student's situation based on the observation and follow-ups."),
  recommendations: z.array(z.string()).describe("A list of 2-4 concrete, actionable recommendations in Spanish for the teacher."),
});
export type ObservationRecommendationOutput = z.infer<typeof ObservationRecommendationOutputSchema>;

export async function generateObservationRecommendation(input: ObservationRecommendationInput): Promise<ObservationRecommendationOutput> {
  return observationRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'observationRecommendationPrompt',
  input: {schema: ObservationRecommendationInputSchema},
  output: {schema: ObservationRecommendationOutputSchema},
  prompt: `
    You are an expert educational psychologist and school counselor. Your task is to provide a concise analysis and actionable recommendations for a teacher based on a specific student observation and its follow-up log.

    **Student:** {{{studentName}}}

    **Initial Observation:**
    - **Type:** {{{observationType}}}
    - **Details:** {{{initialObservation}}}

    {{#if followUpUpdates}}
    **Follow-up Log:**
    {{#each followUpUpdates}}
    - **Date:** {{{date}}}
      **Update:** {{{update}}}
    {{/each}}
    {{/if}}

    **Task Instructions (Output in Spanish):**

    1.  **Analysis ('analysis' field):**
        - Write a very brief paragraph (2-3 sentences) synthesizing the situation.
        - Identify the core issue or positive behavior.
        - If there are follow-ups, comment on the progression (e.g., "La situación de conducta de {{{studentName}}} parece persistir a pesar de la intervención inicial...") or ("El mérito inicial de {{{studentName}}} se ha visto reforzado por su continua participación...").
        - If there are no follow-ups, analyze the initial observation on its own.

    2.  **Recommendations ('recommendations' field):**
        - Provide a list of 2 to 4 concrete, actionable, and future-oriented steps for the teacher.
        - Recommendations should be tailored to the specific situation.
        - **Good examples for negative behavior:**
          - "Establecer una señal no verbal con {{{studentName}}} para indicarle que su conducta es inapropiada sin interrumpir la clase."
          - "Agendar una breve reunión con el tutor para presentar el registro de seguimiento y crear un plan de acción conjunto."
          - "Referir el caso a la psicóloga del colegio para una evaluación más profunda, presentando esta bitácora como antecedente."
        - **Good examples for positive behavior:**
          - "Asignar a {{{studentName}}} un rol de liderazgo en el próximo proyecto en equipo para capitalizar su iniciativa."
          - "Enviar una nota de felicitación a casa destacando el mérito observado."
          - "Mencionar públicamente su contribución como un ejemplo positivo para la clase."

    Ensure the final output strictly follows the JSON schema with 'analysis' and 'recommendations' fields.
  `,
});

const observationRecommendationFlow = ai.defineFlow(
  {
    name: 'observationRecommendationFlow',
    inputSchema: ObservationRecommendationInputSchema,
    outputSchema: ObservationRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
