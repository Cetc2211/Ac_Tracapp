'use server';

import { ai } from '@/ai/index';
import { z } from 'zod';

export const StudentFeedbackInputSchema = z.object({
    studentName: z.string().describe("El nombre del estudiante."),
    groupName: z.string().describe("El nombre de la asignatura o grupo."),
    finalGrade: z.number().describe("La calificación final del estudiante en el parcial."),
    attendance: z.object({
        p: z.number().describe("Número de asistencias."),
        a: z.number().describe("Número de ausencias."),
        rate: z.number().describe("Tasa de asistencia en porcentaje."),
    }),
    criteriaDetails: z.array(z.object({
        name: z.string().describe("Nombre del criterio de evaluación (ej. Examen, Actividades)."),
        earned: z.number().describe("Porcentaje obtenido por el estudiante en este criterio."),
        weight: z.number().describe("Peso del criterio en la calificación final."),
    })).describe("Desglose de la calificación por criterio."),
    observations: z.array(z.object({
        type: z.string().describe("Tipo de observación (ej. Mérito, Problema de conducta)."),
        details: z.string().describe("Descripción de la observación."),
    })).describe("Observaciones de la bitácora del estudiante."),
});

export type StudentFeedbackInput = z.infer<typeof StudentFeedbackInputSchema>;

export const StudentFeedbackOutputSchema = z.object({
  feedback: z.string().describe("Una retroalimentación constructiva y personalizada en formato Markdown."),
});

export type StudentFeedbackOutput = z.infer<typeof StudentFeedbackOutputSchema>;

// const prompt = ai.definePrompt({
//     name: 'studentFeedbackPrompt',
//     input: { schema: StudentFeedbackInputSchema },
//     output: { schema: StudentFeedbackOutputSchema },
//     prompt: `
//         Eres un asistente pedagógico experto en crear retroalimentación personalizada y constructiva para estudiantes.
//         Tu objetivo es generar un informe detallado para {{studentName}} sobre su desempeño en la materia de {{groupName}}.

//         **Datos del Estudiante:**
//         - **Nombre:** {{studentName}}
//         - **Asignatura:** {{groupName}}
//         - **Calificación Final del Parcial:** {{finalGrade}}%
//         - **Asistencia:** {{attendance.rate}}% ({{attendance.p}} presentes, {{attendance.a}} ausentes)
//         - **Desglose de Calificación:**
//         {{#each criteriaDetails}}
//           - **{{name}}:** Obtuvo un {{earned}}% de {{weight}}% posible.
//         {{/each}}
//         - **Bitácora:**
//         {{#if observations}}
//             {{#each observations}}
//             - **{{type}}:** {{details}}
//             {{/each}}
//         {{else}}
//             - Sin observaciones notables.
//         {{/if}}

//         **Instrucciones para la Retroalimentación (Formato Markdown):**

//         1.  **Título:** Comienza con un título en negrita como: **Retroalimentación para {{studentName}}**.

//         2.  **Resumen General (Párrafo 1):**
//             - Inicia con un saludo cordial.
//             - Resume el desempeño general de {{studentName}} en {{groupName}}, mencionando su calificación final ({{finalGrade}}%).
//             - Clasifica el rendimiento como 'excelente' (90-100), 'muy bueno' (80-89), 'bueno' (70-79), 'suficiente' (60-69) o 'necesita mejorar' (<60).
//             - Menciona su tasa de asistencia y cómo se relaciona con su rendimiento.

//         3.  **Análisis de Fortalezas (Sección "Áreas de Fortaleza"):**
//             - Crea una sección con el título: **Áreas de Fortaleza**.
//             - Identifica 2-3 áreas donde el estudiante tuvo un buen desempeño, basándote en los criterios con el porcentaje 'earned' más alto en comparación con su 'weight'.
//             - Si hay observaciones de "Mérito" en la bitácora, úsalas para reforzar esta sección.
//             - Escribe en formato de lista (usando '*').

//         4.  **Áreas de Oportunidad (Sección "Áreas de Oportunidad"):**
//             - Crea una sección con el título: **Áreas de Oportunidad**.
//             - Identifica 2-3 áreas donde el estudiante puede mejorar, basándote en los criterios con el porcentaje 'earned' más bajo.
//             - Si hay observaciones de "Problema de conducta", "Demérito" o "Asesoría académica", úsalas aquí para dar contexto.
//             - Ofrece sugerencias específicas y accionables para cada punto. Por ejemplo, si el problema fue en el examen, sugiere "repasar los apuntes semanalmente" o "formar un grupo de estudio".
//             - Escribe en formato de lista (usando '*').

//         5.  **Recomendaciones Generales y Cierre (Párrafo final):**
//             - Ofrece una o dos recomendaciones generales (ej. "Mantener la comunicación activa", "No dudes en preguntar en clase").
//             - Termina con un mensaje de ánimo y motivación.

//         El tono debe ser siempre de apoyo, constructivo y enfocado en el crecimiento del estudiante.
//     `,
// });

// export async function generateStudentFeedback(input: StudentFeedbackInput): Promise<StudentFeedbackOutput> {
//     const { output } = await prompt(input);
//     return output!;
// }


export async function generateStudentFeedback(input: StudentFeedbackInput): Promise<StudentFeedbackOutput> {
    console.log("AI function called, but Genkit is disabled. Returning placeholder.", input);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        feedback: `
### **Retroalimentación para ${input.studentName} (Ejemplo)**

La función de IA está en mantenimiento. A continuación se muestra un ejemplo del tipo de retroalimentación que se generaría.

**Resumen General:**
Hola ${input.studentName}, tu rendimiento general en el parcial ha sido destacable. Has demostrado un buen compromiso, lo cual se refleja en tus calificaciones.

**Áreas de Fortaleza:**
*   **Participación en Clase:** Muestras una excelente disposición para compartir tus ideas.
*   **Entrega de Actividades:** Cumples consistentemente con las tareas asignadas, lo cual es fundamental.

**Áreas de Oportunidad:**
*   **Preparación para Exámenes:** Sería beneficioso dedicar tiempo adicional al repaso de los temas clave antes de las evaluaciones para mejorar los resultados en ese rubro.

¡Sigue con el buen trabajo! Estoy aquí para apoyarte.
        `
    };
}
