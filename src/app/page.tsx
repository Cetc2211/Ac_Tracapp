
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { AppLogo } from '@/components/app-logo';
import { Loader2 } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);

export default function AuthenticationPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  // Temporal: Auto-create a test user for verification
  useEffect(() => {
    const createTestUser = async () => {
      try {
        // Try to sign in silently to check if user exists
        await signInWithEmailAndPassword(auth, 'test@test.com', 'password');
      } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, 'test@test.com', 'password');
            console.log('Test user created successfully.');
          } catch (creationError) {
            console.error('Failed to create test user:', creationError);
          }
        }
      }
    };
    createTestUser();
  }, []);

  const handleAuthAction = async (action: 'login' | 'signup' | 'google') => {
    if (action === 'google') {
        setIsGoogleLoading(true);
    } else {
        setIsLoading(true);
    }

    if (action === 'signup' && password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Las contraseñas no coinciden.' });
      setIsLoading(false);
      return;
    }

    try {
        if (action === 'google') {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } else if (action === 'signup') {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
        
        toast({ title: 'Éxito', description: 'Has accedido correctamente.' });
        router.push('/dashboard');
        
    } catch (error: any) {
        let description = 'Ocurrió un error inesperado.';
        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    description = 'Correo o contraseña incorrectos.';
                    break;
                case 'auth/email-already-in-use':
                    description = 'Este correo electrónico ya está registrado.';
                    break;
                case 'auth/weak-password':
                    description = 'La contraseña debe tener al menos 6 caracteres.';
                    break;
                 case 'auth/popup-closed-by-user':
                    description = 'El proceso de inicio de sesión con Google fue cancelado.';
                    break;
                default:
                    description = error.message;
            }
        }
        toast({ variant: 'destructive', title: 'Error de autenticación', description });
    } finally {
        setIsLoading(false);
        setIsGoogleLoading(false);
    }
  };

  const isFormInvalid = !email || !password || isLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
             <CardHeader className="text-center">
                <div className="mx-auto">
                    <AppLogo />
                </div>
                <CardTitle className="text-2xl">Bienvenido a Academic Tracker</CardTitle>
                <CardDescription>
                    La herramienta definitiva para la gestión académica.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="login">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                        <TabsTrigger value="signup">Crear Cuenta</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login" className="space-y-4 pt-4">
                        <div className="space-y-1">
                            <Label htmlFor="login-email">Correo Electrónico</Label>
                            <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="login-password">Contraseña</Label>
                            <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <Button className="w-full" onClick={() => handleAuthAction('login')} disabled={isFormInvalid}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Iniciar Sesión
                        </Button>
                    </TabsContent>
                    <TabsContent value="signup" className="space-y-4 pt-4">
                        <div className="space-y-1">
                            <Label htmlFor="signup-email">Correo Electrónico</Label>
                            <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com"/>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="signup-password">Contraseña</Label>
                            <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                        <Button className="w-full" onClick={() => handleAuthAction('signup')} disabled={isFormInvalid || !confirmPassword}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Cuenta
                        </Button>
                    </TabsContent>
                </Tabs>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                    </div>
                </div>
                
                <Button variant="outline" className="w-full" onClick={() => handleAuthAction('google')} disabled={isGoogleLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Google
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
