
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

type UserProfile = {
    name: string;
    email: string;
}

const defaultProfileInfo: UserProfile = {
    name: "John Doe",
    email: "john.doe@example.com",
};

const defaultAvatar = "https://placehold.co/100x100.png";

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile>(defaultProfileInfo);
    const [avatarPreview, setAvatarPreview] = useState(defaultAvatar);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedProfileInfo = localStorage.getItem('userProfileInfo');
            if (savedProfileInfo) {
                setProfile(JSON.parse(savedProfileInfo));
            } else {
                 localStorage.setItem('userProfileInfo', JSON.stringify(defaultProfileInfo));
            }

            const savedAvatar = localStorage.getItem('userAvatar');
            if (savedAvatar) {
                setAvatarPreview(savedAvatar);
            } else {
                localStorage.setItem('userAvatar', defaultAvatar);
            }
        } catch (error) {
            console.error("Failed to load user profile from localStorage", error);
            setProfile(defaultProfileInfo);
            setAvatarPreview(defaultAvatar);
        }
    }, []);

    const handleSave = () => {
        try {
            localStorage.setItem('userProfileInfo', JSON.stringify(profile));
            localStorage.setItem('userAvatar', avatarPreview);
            
            // Dispatch a generic storage event that other components can listen to.
            window.dispatchEvent(new Event('storage')); 
            
            toast({
                title: 'Perfil Guardado',
                description: 'Tu información ha sido actualizada.',
            });
        } catch(error) {
            console.error("Failed to save profile:", error);
            toast({
                variant: 'destructive',
                title: 'Error al guardar',
                description: 'No se pudo guardar el perfil. El almacenamiento podría estar lleno.'
            });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setProfile(prev => ({ ...prev, [id]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

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
                  src={avatarPreview}
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
              value={profile.name}
              onChange={handleInputChange}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
