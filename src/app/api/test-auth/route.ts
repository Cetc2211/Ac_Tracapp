import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBliGErw1WiGhY6lZeCSh6WU0Kg2ZK7oao",
  authDomain: "academic-tracker-qeoxi.firebaseapp.com",
  projectId: "academic-tracker-qeoxi",
  storageBucket: "academic-tracker-qeoxi.appspot.com",
  messagingSenderId: "263108580734",
  appId: "1:263108580734:web:316c14f8e71c20aa038f2f"
};

// Initialize Firebase only if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const auth = getAuth(app);

    // Primero verificar si el usuario existe
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      console.log('Sign-in methods for', email, ':', signInMethods);
      
      if (!signInMethods || signInMethods.length === 0) {
        return NextResponse.json({
          error: 'USER_NOT_FOUND',
          message: `El correo ${email} NO está registrado en Firebase Authentication`,
          project: 'academic-tracker-qeoxi'
        }, { status: 404 });
      }
    } catch (methodError: any) {
      console.error('Error checking sign-in methods:', methodError);
    }

    // Si se proporcionó contraseña, intentar login
    if (password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return NextResponse.json({
          success: true,
          message: 'Login exitoso',
          user: {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            emailVerified: userCredential.user.emailVerified
          }
        });
      } catch (authError: any) {
        console.error('Auth error:', authError);
        let errorMessage = authError.message;
        let errorCode = authError.code;

        switch (authError.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
            errorCode = 'INVALID_PASSWORD';
            errorMessage = 'La contraseña es incorrecta';
            break;
          case 'auth/too-many-requests':
            errorCode = 'TOO_MANY_ATTEMPTS';
            errorMessage = 'Cuenta bloqueada temporalmente por demasiados intentos. Intenta más tarde o restablece tu contraseña.';
            break;
          case 'auth/user-disabled':
            errorCode = 'USER_DISABLED';
            errorMessage = 'Esta cuenta ha sido deshabilitada';
            break;
        }

        return NextResponse.json({
          error: errorCode,
          message: errorMessage,
          originalCode: authError.code
        }, { status: 401 });
      }
    }

    return NextResponse.json({
      message: 'Email verificado',
      email: email
    });

  } catch (error: any) {
    console.error('Error general:', error);
    return NextResponse.json({
      error: 'SERVER_ERROR',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Auth API - Use POST with { email, password }',
    project: 'academic-tracker-qeoxi',
    authDomain: 'academic-tracker-qeoxi.firebaseapp.com'
  });
}
