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

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground">
          Personaliza la información de tu institución educativa.
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
            <Label htmlFor="institution-name">Nombre de la Institución</Label>
            <Input
              id="institution-name"
              defaultValue="Instituto de Innovación Educativa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">Logo de la Institución</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <Image
                  src="https://placehold.co/200x200.png"
                  alt="Logo actual"
                  fill
                  className="rounded-md object-contain"
                  data-ai-hint="school logo"
                />
              </div>
              <Input id="logo" type="file" className="max-w-sm" />
            </div>
            <p className="text-xs text-muted-foreground">
              Sube un archivo PNG o JPG. Tamaño recomendado: 200x200px.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Guardar Cambios</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
