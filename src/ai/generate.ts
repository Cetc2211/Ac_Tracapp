// src/ai/generate.ts
'use server';

/**
 * Genera retroalimentación personalizada usando la API de Google Gemini.
 * @param prompt Texto con las instrucciones y datos.
 * @param apiKey Tu clave API de Google AI.
 * @returns Texto generado por la IA.
 */
export async function generateFeedback(prompt: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch(
      'https://generativeai.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      }
    );
    const data = await response.json();
    // Ajusta esta línea si la estructura de respuesta cambia.
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sin respuesta de la IA';
  } catch (error: any) {
    throw new Error(error.message || 'Error al generar feedback');
  }
}

/**
 * Genera un análisis grupal usando la API de Google Gemini.
 * @param prompt Texto con las instrucciones y datos.
 * @param apiKey Tu clave API de Google AI.
 * @returns Texto generado por la IA.
 */
export async function generateGroupAnalysis(prompt: string, apiKey: string): Promise<string> {
  // Puedes reutilizar la función anterior si el endpoint y formato son iguales.
  return generateFeedback(prompt, apiKey);
}
