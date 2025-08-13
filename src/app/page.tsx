
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
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
import { Loader2, Clapperboard, Images, Star } from 'lucide-react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { doc, setDoc, writeBatch } from 'firebase/firestore';

export default function AuthenticationPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerName, setRegisterName] = useState('');

  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      const user = userCredential.user;
      
      const batch = writeBatch(db);

      const userProfileRef = doc(db, `users/${user.uid}/profile`, 'info');
      batch.set(userProfileRef, {
        name: registerName.trim(),
        email: user.email,
        photoURL: ""
      });

      const settingsDocRef = doc(db, `users/${user.uid}/settings`, 'app');
      batch.set(settingsDocRef, {
        institutionName: `${registerName.trim()}'s Institution`,
        logo: "",
        theme: "theme-default"
      });
      
      await batch.commit();

      toast({ title: 'Cuenta Creada', description: '¡Bienvenido! Has sido registrado exitosamente.' });
      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Ocurrió un error inesperado.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está en uso. Por favor, intenta con otro.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
      }
      toast({ variant: 'destructive', title: 'Error de Registro', description: errorMessage });
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
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
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleRegister} disabled={isLoading}>
                   {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Cuenta
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <div className="w-full max-w-4xl mt-12">
        <Card className="p-6">
            <CardHeader className="p-0 mb-6 text-center">
                <h2 className="text-2xl font-bold">La Herramienta Definitiva para el Docente Moderno</h2>
                <p className="text-muted-foreground">Simplifica tu seguimiento, maximiza tu impacto.</p>
            </CardHeader>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                     <h3 className="font-semibold text-lg flex items-center gap-2"><Images /> Galería de la Aplicación</h3>
                     <Carousel className="w-full max-w-lg mx-auto">
                        <CarouselContent>
                            <CarouselItem>
                                <Image src="https://placehold.co/600x400.png" alt="Vista del Dashboard" width={600} height={400} className="rounded-lg" data-ai-hint="app dashboard" />
                            </CarouselItem>
                            <CarouselItem>
                                <Image src="https://placehold.co/600x400.png" alt="Vista de Calificaciones" width={600} height={400} className="rounded-lg" data-ai-hint="grades view" />
                            </CarouselItem>
                             <CarouselItem>
                                <Image src="https://placehold.co/600x400.png" alt="Vista de Informes" width={600} height={400} className="rounded-lg" data-ai-hint="reports page" />
                            </CarouselItem>
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                 </div>
                 <div className="space-y-4">
                     <h3 className="font-semibold text-lg flex items-center gap-2"><Clapperboard/> Video Explicativo</h3>
                     <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                         <p className="text-muted-foreground">Tu video aquí (16:9)</p>
                     </div>
                 </div>
             </div>
             <div className="mt-8 text-center space-y-2">
                 <h3 className="font-semibold text-lg">¿Por qué elegir Academic Tracker?</h3>
                 <div className="flex justify-center gap-6 text-muted-foreground pt-2">
                     <span className="flex items-center gap-1"><Star className="text-primary h-4 w-4"/> Centralizado</span>
                     <span className="flex items-center gap-1"><Star className="text-primary h-4 w-4"/> IA Integrada</span>
                     <span className="flex items-center gap-1"><Star className="text-primary h-4 w-4"/> Personalizable</span>
                 </div>
             </div>
        </Card>
      </div>
    </div>
  );
}
