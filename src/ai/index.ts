'use server';

import { genkit, GenerationCommonConfigSchema, ModelArgument } from 'genkit';
import { googleAI, geminiModel } from '@genkit-ai/googleai';
import { z } from 'zod';

const standardModelConfig = {
    temperature: 0.7,
    maxOutputTokens: 2048,
    topK: 40,
    topP: 1,
    safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
} as z.infer<typeof GenerationCommonConfigSchema>;


export const ai = genkit({
    plugins: [
        googleAI({
            defaultGenerationOptions: {
                model: geminiModel('gemini-1.5-flash-latest'),
                ...standardModelConfig,
            },
        }),
    ],
    logLevel: 'debug',
    enableTracing: true,
    clientOptions: {
        timeout: 300000, // 5 minutes
    }
});
