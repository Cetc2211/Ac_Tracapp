import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Wand2 } from 'lucide-react';

export default function ProgressionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progresiones Didácticas</h1>
          <p className="text-muted-foreground">
            Gestiona el material de tus cursos, realiza anotaciones y manténlo actualizado.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Guardar Cambios</Button>
          <Button>
            <Wand2 className="mr-2 h-4 w-4" />
            Obtener Sugerencias (IA)
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editor de Progresión: Matemáticas Avanzadas</CardTitle>
          <CardDescription>
            Realiza anotaciones y modificaciones según el curso avance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Escribe aquí el contenido de tu progresión didáctica..."
            className="min-h-[500px] resize-y text-base"
            defaultValue={`Trimestre 1: Álgebra Lineal

Semana 1-2: Introducción a Vectores
- Definición de vectores en R2 y R3.
- Operaciones básicas: suma, resta, producto por escalar.
- Norma de un vector y vectores unitarios.

Semana 3-4: Matrices y Sistemas de Ecuaciones
- Operaciones con matrices.
- Matriz inversa y determinante.
- Resolución de sistemas lineales por Gauss-Jordan.

Anotaciones del curso:
- Recordar enfocar la primera semana en ejemplos geométricos para facilitar la comprensión.
- La actividad de la semana 4 fue muy compleja, considerar simplificarla para el próximo ciclo.
`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
