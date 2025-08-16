'use server';

import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { SignupFormSchema, type FormState } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';

export async function signup(state: FormState, formData: FormData) {
  // Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '',
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    // Create user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    const user = userRecord;

    // After creating the user, set up their initial data in Firestore directly
    const batch = adminDb.batch();

    // Default settings for a new user
    const defaultSettings = {
        institutionName: "Mi Institución",
        logo: "",
        theme: "theme-default"
    };

    // Profile document
    const profileRef = adminDb.doc(`users/${user.uid}/profile/info`);
    const profileData = {
        name: name,
        email: user.email || "",
        photoURL: user.photoURL || ""
    };
    batch.set(profileRef, profileData);

    // Settings document
    const settingsRef = adminDb.doc(`users/${user.uid}/settings/app`);
    batch.set(settingsRef, defaultSettings);

    await batch.commit();

  } catch (error: any) {
    console.error("Signup Error:", error);
    let errorMessage = 'Ocurrió un error inesperado al registrar la cuenta.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Este correo electrónico ya está en uso. Por favor, intenta con otro.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    }
    
    return {
        errors: {},
        message: errorMessage,
    }
  }

  // On successful user creation and data setup, we don't redirect here.
  // The client will handle login and redirection.
  return {
    errors: {},
    message: '',
  };
}
