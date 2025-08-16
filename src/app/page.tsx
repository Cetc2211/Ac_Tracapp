
'use client';

import { useActionState, useState, useEffect } from 'react';
import { signup } from '@/app/actions/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/app-logo';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { auth } from '@/lib/firebase/client';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { FormState } from '@/lib/definitions';


function SignupButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Cuenta
        </Button>
    )
}

export default function AuthenticationPage() {
  const [state, action] = useActionState(signup, undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handleSuccessfulSignup = async () => {
        if (state && !state.errors && !state.message) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                 toast({
                    title: 'Registro y sesión exitosos',
                    description: 'Redirigiendo a tu dashboard...',
                });
                router.push('/dashboard');
            } catch (signInError) {
                 toast({
                    variant: 'destructive',
                    title: 'Error de inicio de sesión',
                    description: 'No pudimos iniciar sesión después del registro. Por favor, ve a la página de login.',
                });
            }
        }
    };
    handleSuccessfulSignup();
  }, [state, email, password, router, toast]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <AppLogo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Crear Cuenta</CardTitle>
            <CardDescription>
              Regístrate para empezar a gestionar tus grupos.
            </CardDescription>
          </CardHeader>
          <form action={action}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Tu nombre completo"
                  required
                />
                 {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                 {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                 {state?.errors?.password && (
                    <div className="text-sm text-destructive">
                      <p>La contraseña debe contener:</p>
                      <ul className="list-disc pl-5">
                        {state.errors.password.map((error) => (
                          <li key={error}>- {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
              {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <SignupButton />
               <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="underline">
                  Inicia sesión
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
