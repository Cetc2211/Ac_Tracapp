
'use client';

import { useState } from 'react';
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
import { auth } from '@/lib/firebase/client';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { SignupFormSchema } from '@/lib/definitions';

export default function AuthenticationPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string[]}>({});
  const [formError, setFormError] = useState('');

  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setFormError('');

    const validatedFields = SignupFormSchema.safeParse({ name, email, password });
    if (!validatedFields.success) {
        setErrors(validatedFields.error.flatten().fieldErrors);
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      
      toast({
        title: 'Registro exitoso',
        description: '¡Bienvenido! Redirigiendo a tu dashboard...',
      });
      router.push('/dashboard');

    } catch (error: any) {
      let errorMessage = 'Ocurrió un error inesperado al registrar la cuenta.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está en uso. Por favor, intenta con otro.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido.';
      }
      setFormError(errorMessage);
      console.error("Signup Error:", error);
    } finally {
      setIsLoading(false);
    }
  };


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
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Tu nombre completo"
                  required
                  disabled={isLoading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                 {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                 {errors.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                 {errors.password && <p className="text-sm text-destructive">{errors.password[0]}</p>}
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Cuenta
              </Button>
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

