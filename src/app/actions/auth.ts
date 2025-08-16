'use server';

import { redirect } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { SignupFormSchema, type FormState } from '@/lib/definitions';
import { setupNewUser } from '@/ai/flows/user-setup';

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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // After creating the user, set up their initial data in Firestore
    await setupNewUser({
      userId: user.uid,
      email: user.email || '',
      displayName: name,
      photoURL: user.photoURL || '',
    });

  } catch (error: any) {
    console.error("Signup Error:", error);
    let errorMessage = 'Ocurrió un error inesperado al registrar la cuenta.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este correo electrónico ya está en uso. Por favor, intenta con otro.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    }
    
    return {
        message: errorMessage,
    }
  }

  redirect('/dashboard');
}
