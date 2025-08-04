
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
import { ThemeSwitcher, themes } from '@/components/theme-switcher';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/hooks/use-data';

export default function SettingsPage() {
    const { settings, setSettings } = useData();
    const [logoPreview, setLogoPreview] = useState(settings.logo);
    const { toast } = useToast();

    useEffect(() => {
      setLogoPreview(settings.logo);
    }, [settings.logo]);


    const handleSave = () => {
        const newSettings = { ...settings, logo: logoPreview };
        setSettings(newSettings);
        localStorage.setItem('appSettings', JSON.stringify(newSettings));
        window.dispatchEvent(new Event('storage'));
        toast({
            title: 'Ajustes Guardados',
            description: 'La información ha sido actualizada.',
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleThemeChange = (theme: string) => {
        setSettings(prev => ({ ...prev, theme }));
    };


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground">
          Personaliza la información de tu institución y la apariencia de la aplicación.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Información de la Institución</CardTitle>
          <CardDescription>
            Actualiza el nombre y logo de tu escuela. Estos datos aparecerán en los informes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="institutionName">Nombre de la Institución</Label>
            <Input
              id="institutionName"
              value={settings.institutionName}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">Logo de la Institución</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <Image
                  src={logoPreview}
                  alt="Logo actual"
                  fill
                  className="rounded-md object-contain"
                  data-ai-hint="school logo"
                />
              </div>
              <Input id="logo" type="file" className="max-w-sm" onChange={handleLogoChange} accept="image/png, image/jpeg" />
            </div>
            <p className="text-xs text-muted-foreground">
              Sube un archivo PNG o JPG. Tamaño recomendado: 200x200px.
            </p>
          </div>
        </CardContent>
        <Separator className="my-4" />
        <CardHeader>
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>
                Elige un tema para personalizar los colores de la aplicación.
            </CardDescription>
        </CardHeader>
         <CardContent>
            <ThemeSwitcher selectedTheme={settings.theme} onThemeChange={handleThemeChange} />
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
