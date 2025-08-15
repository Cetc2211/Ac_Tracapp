'use server';

import { redirect } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client'; // Server Actions can use the client-side config
import { SignupFormSchema, type FormState } from '@/lib/definitions';

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
    // This is safe to run on the server because Firebase Auth SDK for JS
    // sends a request to the Firebase Auth backend.
    await createUserWithEmailAndPassword(auth, email, password);

  } catch (error: any) {
    // Handle Firebase errors
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

  // The user creation itself doesn't automatically trigger the onAuthStateChanged
  // in useData hook fast enough, especially with server actions.
  // We will simply redirect to the dashboard. The main layout will handle
  // routing to login if the user is not authenticated after a moment.
  redirect('/dashboard');
}
