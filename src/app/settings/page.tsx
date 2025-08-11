

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
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ThemeSwitcher, themes } from '@/components/theme-switcher';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/hooks/use-data';
import { Upload, Download } from 'lucide-react';

export default function SettingsPage() {
    const { settings, setSettings, groups } = useData();
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
      if(isClient) {
        setLogoPreview(settings.logo);
      }
    }, [settings.logo, isClient]);


    const handleSave = () => {
        const newSettings = { ...settings, logo: logoPreview || '' };
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

    const handleExportData = () => {
      try {
        const backupData: { [key: string]: any } = {};
        
        // Iterate through all localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key)!;
            try {
              backupData[key] = JSON.parse(value);
            } catch (e) {
              backupData[key] = value;
            }
          }
        }
        
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `academic-tracker-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Exportación exitosa",
          description: "Todos los datos de la aplicación han sido guardados.",
        });
      } catch (error) {
        console.error("Error exporting data:", error);
        toast({
          variant: "destructive",
          title: "Error al exportar",
          description: "No se pudieron exportar los datos.",
        });
      }
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("File could not be read");
                }
                const backupData = JSON.parse(text);

                // Clear existing localStorage
                localStorage.clear();

                // Import new data
                for (const key in backupData) {
                    if (Object.prototype.hasOwnProperty.call(backupData, key)) {
                        const value = backupData[key];
                        // If the value from backup is an object/array, stringify it. Otherwise, store as is.
                        if (typeof value === 'object' && value !== null) {
                            localStorage.setItem(key, JSON.stringify(value));
                        } else {
                            localStorage.setItem(key, value);
                        }
                    }
                }
                
                toast({
                    title: "Importación Exitosa",
                    description: "Los datos han sido restaurados. La aplicación se recargará.",
                });

                // Reload to apply changes
                setTimeout(() => {
                    window.location.reload();
                }, 1500);

            } catch (error) {
                console.error("Error importing data:", error);
                toast({
                    variant: "destructive",
                    title: "Error al importar",
                    description: "El archivo de respaldo es inválido o está corrupto.",
                });
            } finally {
                // Reset file input
                if(fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };


  if (!isClient) {
    return null;
  }

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
                  src={logoPreview || 'https://placehold.co/200x200.png'}
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
      <Card>
          <CardHeader>
              <CardTitle>Copia de Seguridad y Restauración</CardTitle>
              <CardDescription>
                  Guarda todos tus datos en un archivo o restaura la aplicación desde uno.
              </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={handleExportData} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Datos (Backup)
              </Button>
              <Button onClick={triggerFileSelect} variant="destructive">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Datos (Restaurar)
              </Button>
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleImportData}
              />
          </CardContent>
           <CardFooter>
               <p className="text-xs text-muted-foreground">
                  La importación reemplazará todos los datos actuales. Asegúrate de tener un respaldo si es necesario.
              </p>
           </CardFooter>
      </Card>
    </div>
  );
}
