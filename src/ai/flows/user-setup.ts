
'use server';
/**
 * @fileOverview A flow to set up initial data for a new user.
 *
 * - setupNewUser - Creates default profile and settings documents in Firestore.
 * - UserSetupInput - The input type for the setupNewUser function.
 */

import { ai } from '@/ai';
import { z } from 'zod';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import { app } from '@/lib/firebase/client';

const UserSetupInputSchema = z.object({
  userId: z.string().describe('The UID of the new user.'),
  email: z.string().optional().describe('The email of the new user.'),
  displayName: z.string().optional().describe('The initial display name for the new user.'),
  photoURL: z.string().optional().describe('The photo URL for the new user.'),
});
export type UserSetupInput = z.infer<typeof UserSetupInputSchema>;

export async function setupNewUser(input: UserSetupInput): Promise<{success: boolean}> {
    return setupNewUserFlow(input);
}

const setupNewUserFlow = ai.defineFlow(
  {
    name: 'setupNewUserFlow',
    inputSchema: UserSetupInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    const defaultSettings = {
        institutionName: "Mi Institución",
        logo: "",
        theme: "theme-default"
    };
    
    try {
        const db = getFirestore(app);
        const batch = writeBatch(db);

        const userProfileRef = doc(db, `users/${input.userId}/profile`, 'info');
        const settingsDocRef = doc(db, `users/${input.userId}/settings`, 'app');
        
        const profileData = {
            name: input.displayName || input.email?.split('@')[0] || "Usuario",
            email: input.email || "",
            photoURL: input.photoURL || ""
        };

        batch.set(userProfileRef, profileData);
        batch.set(settingsDocRef, defaultSettings);

        await batch.commit();
        
        console.log(`Successfully created initial data for user ${input.userId}`);
        return { success: true };

    } catch (error) {
        console.error('Error setting up new user:', error);
        // Throw an error to be caught by the calling Server Action
        throw new Error('Failed to set up initial user data in Firestore.');
    }
  }
);
