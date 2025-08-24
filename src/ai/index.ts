'use server';

import { genkit, configureGenkit } from 'genkit';
// import { googleAI } from '@genkit-ai/googleai';

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
};

export const ai = genkit({
    plugins: [
        // googleAI({
        //     apiVersion: "v1beta",
        //     defaultGenerationOptions: {
        //         model: 'gemini-pro',
        //         ...standardModelConfig,
        //     },
        // }),
    ],
    logLevel: 'debug',
    enableTracing: true,
});
