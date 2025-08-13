
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    const user = auth.currentUser;

    useEffect(() => {
        if (user) {
            setName(user.displayName || '');
            setEmail(user.email || '');
            setAvatarPreview(user.photoURL || 'https://placehold.co/100x100.png');
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        
        try {
            await updateProfile(user, {
                displayName: name,
                photoURL: avatarPreview
            });
            
            toast({
                title: 'Perfil Guardado',
                description: 'Tu información ha sido actualizada.',
            });
        } catch(error) {
            console.error("Failed to save profile:", error);
            toast({
                variant: 'destructive',
                title: 'Error al guardar',
                description: 'No se pudo actualizar el perfil.'
            });
        } finally {
            setIsLoading(false);
        }
    };


    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 200;
                    const MAX_HEIGHT = 200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL(file.type);
                    setAvatarPreview(dataUrl);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

  if (!user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando perfil...</span>
        </div>
    );
  }

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
          <CardTitle>Información de Usuario</CardTitle>
          <CardDescription>
            Actualiza tu nombre, correo y foto que se mostrarán en la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="avatar">Foto de Perfil</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <Image
                  src={avatarPreview || 'https://placehold.co/100x100.png'}
                  alt="Avatar actual"
                  fill
                  className="rounded-full object-cover"
                  data-ai-hint="user avatar"
                />
              </div>
              <Input id="avatar" type="file" className="max-w-sm" onChange={handleAvatarChange} accept="image/png, image/jpeg" />
            </div>
            <p className="text-xs text-muted-foreground">
              Sube un archivo PNG o JPG.
            </p>
          </div>
          <Separator />
           <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
            />
             <p className="text-xs text-muted-foreground">
              El correo electrónico no se puede cambiar.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Guardar Cambios
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
