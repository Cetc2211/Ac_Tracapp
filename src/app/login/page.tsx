'use client';

import { useState } from 'react';
import { useSignInWithEmailAndPassword, useSendPasswordResetEmail } from 'react-firebase-hooks/auth';
import { auth, isDemoMode } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInWithEmailAndPassword, user, loading, error] = isDemoMode 
    ? [async () => ({ user: {} }), null, false, null]
    : useSignInWithEmailAndPassword(auth);
  const [sendPasswordResetEmail, sending, resetError] = isDemoMode
    ? [async () => true, false, null]
    : useSendPasswordResetEmail(auth);
  
  const { toast } = useToast();
  const router = useRouter();
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSignIn = async () => {
    // Modo Demo
    if (isDemoMode) {
      setDemoLoading(true);
      
      // Simular delay de autenticación
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // En modo demo, aceptar cualquier credencial
      const demoUser = {
        uid: 'demo-user-' + Date.now(),
        email: email || 'demo@academic-tracker.com',
        displayName: (email || 'demo').split('@')[0],
        photoURL: ''
      };
      
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      
      toast({
        title: 'Modo Demo',
        description: `Bienvenido, ${demoUser.displayName}. Los datos se almacenan localmente.`,
      });
      
      setDemoLoading(false);
      router.push('/dashboard');
      return;
    }

    // Modo Firebase
    try {
      const result = await signInWithEmailAndPassword(email, password);
      if (result) {
        toast({
          title: 'Inicio de sesión exitoso',
          description: 'Bienvenido de nuevo.',
        });
        router.push('/dashboard');
      } else if (error) {
        let errorMessage = 'Las credenciales proporcionadas no son válidas. Por favor, inténtalo de nuevo.';
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const authError = error as { code: string };
          switch (authError.code) {
            case 'auth/user-not-found':
              errorMessage = 'Este correo electrónico no está registrado. Por favor, crea una cuenta.';
              break;
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
              errorMessage = 'Contraseña incorrecta. Por favor, inténtalo de nuevo.';
              break;
            case 'auth/invalid-email':
              errorMessage = 'El formato del correo electrónico no es válido.';
              break;
            default:
              console.error('Firebase Auth Error:', error);
          }
        }
        toast({
          variant: 'destructive',
          title: 'Error al iniciar sesión',
          description: errorMessage,
        });
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error inesperado',
        description: 'Ocurrió un error al intentar iniciar sesión.',
      });
    }
  };
  
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({ variant: 'destructive', title: 'Correo requerido', description: 'Por favor, ingresa tu correo electrónico.' });
      return;
    }
    
    if (isDemoMode) {
      toast({ 
        title: 'Modo Demo', 
        description: 'La recuperación de contraseña no está disponible en modo demo. Usa cualquier credencial para entrar.' 
      });
      setIsResetDialogOpen(false);
      return;
    }

    try {
      const success = await sendPasswordResetEmail(resetEmail);
      if (success) {
        toast({ title: 'Correo enviado', description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.' });
        setIsResetDialogOpen(false);
      } else {
        let errorMessage = 'No se pudo enviar el correo de recuperación. Inténtalo de nuevo.';
        if (resetError && typeof resetError === 'object' && 'code' in resetError) {
          const authError = resetError as { code: string; message: string };
          switch (authError.code) {
            case 'auth/user-not-found':
              errorMessage = 'Este correo electrónico no está registrado. No se puede enviar el correo.';
              break;
            case 'auth/invalid-email':
              errorMessage = 'El formato del correo electrónico no es válido.';
              break;
            default:
              errorMessage = authError.message;
          }
        }
        toast({ variant: 'destructive', title: 'Error al enviar correo', description: errorMessage });
      }
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un problema al enviar el correo de recuperación.' });
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restablecer Contraseña</AlertDialogTitle>
            <AlertDialogDescription>
              {isDemoMode 
                ? 'En modo demo, puedes usar cualquier credencial para iniciar sesión.'
                : 'Ingresa tu correo electrónico y te enviaremos un enlace para que puedas restablecer tu contraseña.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!isDemoMode && (
            <div className="py-4">
              <Label htmlFor="reset-email">Correo Electrónico</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="nombre@ejemplo.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {!isDemoMode && (
              <AlertDialogAction onClick={handlePasswordReset} disabled={sending}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Enviar Correo
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            {isDemoMode 
              ? 'Modo Demo: Usa cualquier credencial para acceder'
              : 'Ingresa tu correo y contraseña para acceder a tu panel.'
            }
          </CardDescription>
        </CardHeader>
        
        {isDemoMode && (
          <div className="px-6 pt-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTitle className="text-yellow-800">🎯 Modo Demo Activo</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Los datos se almacenan localmente y no se conectan a Firebase.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder={isDemoMode ? "demo@academic-tracker.com" : "nombre@ejemplo.com"}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Contraseña</Label>
              {!isDemoMode && (
                <Button variant="link" className="ml-auto inline-block text-sm p-0 h-auto" onClick={() => { setResetEmail(email); setIsResetDialogOpen(true); }}>
                  ¿Olvidaste tu contraseña?
                </Button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              placeholder={isDemoMode ? "cualquier contraseña" : "••••••••"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleSignIn} disabled={loading || demoLoading}>
            {(loading || demoLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            {isDemoMode ? 'Entrar al Demo' : 'Iniciar Sesión'}
          </Button>
          {!isDemoMode && (
            <div className="text-center text-sm">
              ¿No tienes una cuenta?{' '}
              <Link href="/signup" className="underline">
                Regístrate
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
