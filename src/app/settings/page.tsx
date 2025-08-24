
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
import type { Group, Student, StudentObservation, PartialId } from '@/lib/placeholder-data';
import type { PartialData } from '@/hooks/use-data';


type ExportData = {
  version: string;
  groups: Group[];
  students: Student[];
  observations: { [studentId: string]: StudentObservation[] };
  settings: typeof settings;
  partialsData: {
    [groupId: string]: {
      [partialId in PartialId]?: PartialData;
    };
  };
};


export default function SettingsPage() {
    const { settings, isLoading, groups, allStudents, allObservations, fetchPartialData, setSettings: setSettingsInDb, resetAllData } = useData();
    const [localSettings, setLocalSettings] = useState(settings);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    
    useEffect(() => {
        if(!isLoading && settings) {
            setLocalSettings(settings);
            setLogoPreview(settings.logo);
        }
    }, [settings, isLoading]);
    
    const handleSave = async () => {
        if (isLoading) {
            toast({variant: "destructive", title: "Error", description: "No se pueden guardar los ajustes mientras los datos se están cargando."})
            return;
        }
        setIsSaving(true);
        const newSettings = { ...localSettings, logo: logoPreview || '' };
        
        try {
            await setSettingsInDb(newSettings);
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

    const handleExportData = async () => {
        setIsExporting(true);
        toast({ title: "Exportando datos...", description: "Recopilando toda tu información."});
        try {
            const partialsData: ExportData['partialsData'] = {};
            for (const group of groups) {
                partialsData[group.id] = {};
                const partials: PartialId[] = ['p1', 'p2', 'p3'];
                const results = await Promise.all(partials.map(pId => fetchPartialData(group.id, pId)));
                partials.forEach((pId, index) => {
                    if (results[index] && (results[index]!.criteria.length > 0 || Object.keys(results[index]!.grades).length > 0)) {
                        partialsData[group.id][pId] = results[index]!;
                    }
                });
            }

            const exportData: ExportData = {
                version: "1.0.0-local",
                groups,
                students: allStudents,
                observations: allObservations,
                settings,
                partialsData,
            };

            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `academic_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            toast({ title: "Exportación completa", description: "Tus datos han sido guardados." });

        } catch (error) {
            console.error("Export error:", error);
            toast({ variant: 'destructive', title: "Error de exportación", description: "No se pudieron exportar los datos." });
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImportFile(file);
        }
    };
    
    const handleConfirmImport = async () => {
        if (!importFile) return;
        setIsImporting(true);
        toast({ title: 'Importando datos...', description: 'Esto puede tardar un momento y sobreescribirá tus datos actuales.' });

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read");
                
                const data = JSON.parse(text) as ExportData;

                if (!data.version || !data.groups || !data.students || !data.settings) {
                    throw new Error("Archivo de importación inválido o corrupto.");
                }

                localStorage.setItem('app_groups', JSON.stringify(data.groups));
                localStorage.setItem('app_students', JSON.stringify(data.students));
                localStorage.setItem('app_observations', JSON.stringify(data.observations));
                localStorage.setItem('app_partialsData', JSON.stringify(data.partialsData));
                localStorage.setItem('app_settings', JSON.stringify(data.settings));


                toast({ title: "Importación exitosa", description: "Tus datos han sido restaurados. La página se recargará." });
                setTimeout(() => window.location.reload(), 2000);

            } catch (error: any) {
                console.error("Import error:", error);
                toast({ variant: 'destructive', title: "Error de importación", description: error.message || "El archivo puede estar corrupto." });
            } finally {
                setIsImporting(false);
                setImportFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(importFile);
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleResetApp = async () => {
       setIsSaving(true);
        toast({ title: 'Restableciendo datos...', description: 'Este proceso es irreversible y puede tardar.' });
        await resetAllData();
        setIsSaving(false);
        setIsResetDialogOpen(false);
    }

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
            </div>
        );
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
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Guardar Cambios
            </Button>
            </CardFooter>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Copia de Seguridad y Restauración</CardTitle>
                <CardDescription>
                    Guarda todos tus datos en un archivo o restaura la aplicación desde uno. La importación sobreescribirá todos los datos actuales.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleExportData} variant="outline" disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Exportar Mis Datos
                </Button>
                <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button onClick={triggerFileSelect}>
                                <Upload className="mr-2 h-4 w-4" />
                                Importar Mis Datos
                            </Button>
                        </AlertDialogTrigger>
                        {importFile && (
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmas la importación?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción sobreescribirá permanentemente TODOS tus datos actuales con los datos del archivo "{importFile.name}". Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setImportFile(null)}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleConfirmImport} disabled={isImporting}>
                                        {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sí, importar y sobreescribir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        )}
                    </AlertDialog>
                <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleImportFileChange}
                />
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Asegúrate de que el archivo de importación haya sido generado por esta aplicación.
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
                    <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restablecer Mis Datos
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción borrará permanentemente TODOS tus datos de la aplicación, incluyendo grupos, estudiantes, calificaciones y ajustes. La página se recargará.
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
                    Esta función eliminará todos tus datos guardados en el navegador.
                </p>
            </CardFooter>
        </Card>
        </div>
    );
}
