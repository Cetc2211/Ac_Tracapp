
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLogo } from '@/components/app-logo';
import { Loader2 } from 'lucide-react';

export default function AuthenticationPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerName, setRegisterName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({
        title: 'Inicio de Sesión Exitoso',
        description: '¡Bienvenido de nuevo!',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error de Inicio de Sesión',
        description: 'Las credenciales son incorrectas. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async () => {
    if (registerPassword !== registerConfirmPassword) {
      toast({ variant: 'destructive', title: 'Error de Registro', description: 'Las contraseñas no coinciden.' });
      return;
    }
    if (!registerName.trim()) {
       toast({ variant: 'destructive', title: 'Error de Registro', description: 'El nombre es obligatorio.' });
       return;
    }
    if (registerPassword.length < 6) {
        toast({ variant: 'destructive', title: 'Error de Registro', description: 'La contraseña debe tener al menos 6 caracteres.' });
        return;
    }
    
    setIsRegistering(true);
    try {
      localStorage.setItem('pending_registration_name', registerName.trim());

      await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      
      toast({ title: 'Cuenta Creada', description: '¡Bienvenido! Redirigiendo al dashboard...' });
      router.push('/dashboard');

    } catch (error: any) {
      localStorage.removeItem('pending_registration_name');

      let errorMessage = 'Ocurrió un error inesperado al registrar la cuenta.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está en uso. Por favor, intenta con otro.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'El formato del correo electrónico no es válido.';
      }
      
      console.error("Registration Error:", error);
      toast({ variant: 'destructive', title: 'Error de Registro', description: errorMessage });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <AppLogo />
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Crear Cuenta</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Iniciar Sesión</CardTitle>
                <CardDescription>
                  Ingresa a tu cuenta para continuar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Correo Electrónico</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar Sesión
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Crear Cuenta</CardTitle>
                <CardDescription>
                  Regístrate para empezar a gestionar tus grupos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="register-name">Nombre Completo</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    disabled={isRegistering}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Correo Electrónico</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    disabled={isRegistering}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    disabled={isRegistering}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    disabled={isRegistering}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleRegister} disabled={isRegistering}>
                   {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Cuenta
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
