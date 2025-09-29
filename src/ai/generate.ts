
'use server';

import { genkit, configure, AI } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This is a server-side file. It should not be imported directly into client components.

async function callGoogleAI(prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error("No se ha configurado una clave API de Google AI válida. Ve a Ajustes para agregarla.");
  }
  
  // Configure Genkit on-the-fly for each request.
  // This ensures the latest API key from settings is used.
  configure({
    plugins: [googleAI({ apiKey: apiKey })],
    logLevel: 'warn',
    enableTracingAndMetrics: true,
  });

  const ai = genkit();
  
  try {
    const response = await ai.generate({
      model: 'gemini-1.5-flash-latest',
      prompt,
      config: {
        temperature: 0.5,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH"
        },
      ],
      // @ts-ignore - Tools support retries, even if not in the base type.
      retries: 2,
    });
    return response.text;
  } catch (e: any) {
    console.error("Genkit AI Error:", e);
    throw new Error(`Error del servicio de IA: ${e.message || 'Error desconocido'}`);
  }
}


export async function generateFeedback(prompt: string, apiKey: string): Promise<string> {
    return await callGoogleAI(prompt, apiKey);
}

export async function generateGroupAnalysis(prompt: string, apiKey: string): Promise<string> {
    return await callGoogleAI(prompt, apiKey);
}
