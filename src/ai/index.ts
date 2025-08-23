
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {GenkitError} from 'genkit';

if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: La variable de entorno GEMINI_API_KEY no está definida. Por favor, crea un archivo .env y añade tu clave.");
}

export const geminiModel = 'gemini-1.5-flash-latest';

export const standardModelConfig = {
  // Disabling safety settings for this demo to avoid content filtering issues.
  // In a production app, you should configure this appropriately.
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_NONE',
    },
  ],
};

export const ai = genkit({
  plugins: [
    googleAI({
      // Specify the default model for all generation tasks.
      defaultGenerationOptions: {
        model: geminiModel,
        ...standardModelConfig,
      }
    }),
  ],
  // Log all errors to the console.
  logLevel: 'error',
  // Ensure that telemetry is exported to the console for debugging purposes.
  enableTracing: true,
  // Increased timeout for potentially long-running flows.
  // This is particularly useful for flows that make multiple API calls.
  clientOptions: {
    timeout: 300000, // 5 minutes
  },
});
