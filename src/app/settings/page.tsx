
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
import { Upload, Download, RotateCcw, Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { auth, db } from '@/lib/firebase-client';
import { doc, setDoc } from 'firebase/firestore';

export default function SettingsPage() {
    const { settings, isLoading, setSettings: setSettingsInDb } = useData();
    const [localSettings, setLocalSettings] = useState(settings);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        setLocalSettings(settings);
        setLogoPreview(settings.logo);
    }, [settings]);
    
    const handleSave = async () => {
        if (!auth.currentUser) {
            toast({variant: "destructive", title: "Error", description: "Debes iniciar sesión."});
            return;
        }
        setIsSaving(true);
        const newSettings = { ...localSettings, logo: logoPreview || '' };
        try {
          await setDoc(doc(db, `users/${auth.currentUser.uid}/settings`, 'app'), newSettings);
          toast({
              title: 'Ajustes Guardados',
              description: 'La información ha sido actualizada.',
          });
        } catch (e) {
          toast({variant: "destructive", title: "Error", description: "No se pudieron guardar los ajustes."})
        } finally {
          setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [id]: value }));
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
        setLocalSettings(prev => ({ ...prev, theme }));
        document.body.className = theme;
    };

    const handleExportData = () => {
      // This needs to be reimplemented to fetch all data from Firestore,
      // which is a complex operation and best handled by a backend/cloud function.
      // For now, we'll disable it or show a message.
      toast({
        title: "Función no disponible",
        description: "La exportación de datos desde la nube se añadirá en una futura actualización."
      });
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        // This is also a complex and potentially dangerous operation.
        // It would require careful data validation and merging.
        // Disabling for now.
         toast({
          title: "Función no disponible",
          description: "La importación de datos a la nube se añadirá en una futura actualización."
        });
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleResetApp = () => {
        // This should now delete all data for the current user from Firestore.
        // This is a very destructive action and requires careful implementation.
        toast({
            title: "Función no disponible",
            description: "El reseteo de datos se implementará próximamente."
        });
    }

  if (isLoading && !settings.institutionName) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="mr-2 h-8 w-8 animate-spin" /> Cargando...</div>;
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
              value={localSettings.institutionName}
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
            <ThemeSwitcher selectedTheme={localSettings.theme} onThemeChange={handleThemeChange} />
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Guardar Cambios
          </Button>
        </CardFooter>
      </Card>
      <Card>
          <CardHeader>
              <CardTitle>Copia de Seguridad y Restauración</CardTitle>
              <CardDescription>
                  Guarda todos tus datos en un archivo o restaura la aplicación desde uno. (Funcionalidad deshabilitada temporalmente)
              </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={handleExportData} variant="outline" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Mis Datos
              </Button>
              <Button onClick={triggerFileSelect} disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Mis Datos
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
                  La importación/exportación masiva de datos en la nube requiere una implementación cuidadosa y estará disponible en el futuro.
              </p>
           </CardFooter>
      </Card>
       <Card>
          <CardHeader>
              <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
              <CardDescription>
                  Estas acciones no se pueden deshacer. Úsalas con precaución.
              </CardDescription>
          </CardHeader>
          <CardContent>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restablecer Mis Datos
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción borrará permanentemente TODOS tus datos de la aplicación, incluyendo grupos, estudiantes, calificaciones y ajustes.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetApp}>Sí, borrar mis datos</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
          </CardContent>
           <CardFooter>
               <p className="text-xs text-muted-foreground">
                  Esta función eliminará todos tus datos en la nube. Estará disponible próximamente.
              </p>
           </CardFooter>
      </Card>
    </div>
  );
}
