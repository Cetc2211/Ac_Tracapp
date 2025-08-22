
'use server';

/**
 * @fileOverview A Genkit flow for generating a summary report for a group.
 *
 * - generateReportSummary - A function that generates a summary text.
 * - ReportSummaryInput - The input type for the function.
 * - ReportSummaryOutput - The return type for the function.
 */

import { ai, geminiModel, standardModelConfig } from '@/ai';
import { z } from 'zod';

const ReportSummaryInputSchema = z.object({
  groupName: z.string().describe('The name of the group/subject.'),
  studentCount: z.number().describe('The total number of students in the group.'),
  averageGrade: z.number().describe('The average final grade of the group.'),
  approvalRate: z.number().describe('The percentage of students who passed (grade >= 60).'),
  attendanceRate: z.number().describe('The overall attendance rate percentage for the group.'),
  highRiskCount: z.number().describe('The number of students at high risk.'),
  mediumRiskCount: z.number().describe('The number of students at medium risk.'),
});
export type ReportSummaryInput = z.infer<typeof ReportSummaryInputSchema>;

const ReportSummaryOutputSchema = z.object({
  summary: z.string().describe('A formal, detailed summary text in Spanish for an academic report. It should analyze the provided data and present it clearly.'),
});
export type ReportSummaryOutput = z.infer<typeof ReportSummaryOutputSchema>;

export async function generateReportSummary(input: ReportSummaryInput): Promise<ReportSummaryOutput> {
  return reportSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reportSummaryPrompt',
  input: { schema: ReportSummaryInputSchema },
  output: { schema: ReportSummaryOutputSchema },
  config: {
    model: geminiModel,
    ...standardModelConfig,
  },
  prompt: `
    You are an expert academic assistant tasked with writing the introductory summary for a group performance report.
    Based on the data provided, write a formal and objective paragraph in Spanish.

    **Data:**
    - Group Name: {{{groupName}}}
    - Student Count: {{{studentCount}}}
    - Average Grade: {{{averageGrade}}}%
    - Approval Rate: {{{approvalRate}}}%
    - Attendance Rate: {{{attendanceRate}}}%
    - High-Risk Students: {{{highRiskCount}}}
    - Medium-Risk Students: {{{mediumRiskCount}}}

    **Instructions:**
    - Start with a formal opening.
    - Integrate the data smoothly into the text.
    - Highlight key achievements (e.g., high approval or attendance rates).
    - Mention areas of concern (e.g., low average grade, number of at-risk students) constructively.
    - Keep the tone professional and informative.
    - Do not add a closing or signature.

    **Example Output:**
    "Por medio del presente, se informa sobre el rendimiento académico del grupo de {{{groupName}}}, compuesto por {{{studentCount}}} estudiantes. Durante el periodo evaluado, el grupo alcanzó un promedio general de {{{averageGrade}}}%, con una tasa de aprobación del {{{approvalRate}}}%. La asistencia se mantuvo en un {{{attendanceRate}}}%. Es importante notar que se han identificado {{{highRiskCount}}} estudiantes en riesgo alto y {{{mediumRiskCount}}} en riesgo medio, lo cual requerirá atención y estrategias de seguimiento específicas."

    Generate a summary based on the provided data.
  `,
});

const reportSummaryFlow = ai.defineFlow(
  {
    name: 'reportSummaryFlow',
    inputSchema: ReportSummaryInputSchema,
    outputSchema: ReportSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
