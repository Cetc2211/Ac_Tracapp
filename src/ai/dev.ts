
import { config } from 'dotenv';
config();

import '@/ai/flows/student-feedback.ts';
import '@/ai/flows/at-risk-student-recommendation.ts';
import '@/ai/flows/student-observation-recommendation.ts';
import '@/ai/flows/report-summary-generator.ts';
