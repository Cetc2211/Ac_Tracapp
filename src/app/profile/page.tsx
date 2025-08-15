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
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase/client';
import { doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useData } from '@/hooks/use-data';

export default function ProfilePage() {
  const { userProfile } = useData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setAvatar(userProfile.photoURL);
    }
  }, [userProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Optimize image before setting preview
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
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
          setAvatar(canvas.toDataURL('image/jpeg'));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo encontrar al usuario actual.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const profileRef = doc(db, `users/${user.uid}/profile`, 'info');
      await updateDoc(profileRef, {
        name: name,
        photoURL: avatar,
      });

      toast({
        title: 'Perfil Actualizado',
        description: 'Tu información ha sido guardada exitosamente.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getInitials = (nameStr: string) => {
    if(!nameStr) return 'U';
    const names = nameStr.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return nameStr.substring(0,2).toUpperCase();
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
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Estos datos se mostrarán en tu perfil y navegación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                {avatar ? (
                  <Image src={avatar} alt="Avatar" width={96} height={96} className="rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">{getInitials(name)}</span>
                )}
              </div>
            </div>
            <div className="flex-grow">
               <Label htmlFor="avatar-upload">Foto de Perfil</Label>
               <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} ref={fileInputRef} />
               <p className="text-xs text-muted-foreground mt-1">Sube un archivo de imagen (JPG, PNG).</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" value={email} disabled />
             <p className="text-xs text-muted-foreground">El correo electrónico no puede ser cambiado.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
