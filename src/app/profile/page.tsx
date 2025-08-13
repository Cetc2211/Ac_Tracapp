
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y foto de perfil.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidad no disponible</CardTitle>
          <CardDescription>
            La gestión de perfiles de usuario requiere la implementación de un sistema de autenticación.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p>Para habilitar los perfiles de usuario, primero debemos añadir la funcionalidad de inicio de sesión y registro.</p>
        </CardContent>
        <CardFooter>
            <Button disabled>Guardar Cambios</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
