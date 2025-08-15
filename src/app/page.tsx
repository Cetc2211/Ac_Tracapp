
'use client';

import { useActionState, useState } from 'react';
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

export default function AuthenticationPage() {
  const [state, action, isPending] = useActionState(signup, undefined);

  // For simplicity, we'll keep login form as a placeholder for now
  // as we focus on fixing the signup flow first.
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
                  disabled={isPending}
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
                  disabled={isPending}
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
                  disabled={isPending}
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
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Cuenta
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
