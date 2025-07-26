import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Wand2 } from 'lucide-react';
import Image from 'next/image';

export default function ProgressionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progresiones Didácticas</h1>
          <p className="text-muted-foreground">
            Gestiona el material de tus cursos, realiza anotaciones y manténlo
            actualizado.
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
        <CardContent className="p-6">
          <div className="border p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col items-center">
                <Image
                  src="https://placehold.co/100x50.png"
                  width={100}
                  height={50}
                  alt="EDUCACIÓN"
                  data-ai-hint="education logo"
                />
                <span className="text-xs font-bold">EDUCACIÓN</span>
              </div>
              <div className="text-center">
                <p className="text-sm">
                  Dirección General de Educación Tecnológica Agropecuaria y
                  Ciencias del Mar
                </p>
                <p className="text-sm font-bold">
                  Planeación por Progresión en el MCCEMS
                </p>
                <p className="text-xs">Ciclo Agosto 2024-Enero 2025</p>
              </div>
              <div className="flex flex-col items-center">
                <Image
                  src="https://placehold.co/100x50.png"
                  width={100}
                  height={50}
                  alt="SEMS"
                  data-ai-hint="SEMS logo"
                />
                <span className="text-xs font-bold">SEMS</span>
              </div>
            </div>
            <p className="mb-4">
              <span className="font-bold">Plantel:</span> Centro de Bachillerato
              Tecnológico Agropecuario No. 130 "Eutimio Plantillas Avelar"
            </p>

            <div className="bg-gray-200 text-center font-bold p-1">
              A) IDENTIFICACIÓN
            </div>
            <Table className="mb-4 border">
              <TableBody>
                <TableRow>
                  <TableCell className="border-r">
                    <Label>UAC</Label>
                    <Input defaultValue="" />
                  </TableCell>
                  <TableCell className="border-r">
                    <Label>Docente(s)</Label>
                    <Input defaultValue="" />
                  </TableCell>
                  <TableCell>
                    <Label>Semana(s): 1.25 semanas</Label>
                    <Input defaultValue="" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="border-r">
                    <Label>Área del Conocimiento:</Label>
                    <Input defaultValue="" />
                  </TableCell>
                  <TableCell className="border-r" rowSpan={2}>
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div>
                        <Label>Semestre</Label>
                        <Input defaultValue="" />
                      </div>
                      <div>
                        <Label>Grupos</Label>
                        <Input defaultValue="" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell rowSpan={2}>
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div>
                        <Label>Horas de mediación docente</Label>
                        <Input defaultValue="" />
                      </div>
                      <div>
                        <Label>Horas de estudio independiente</Label>
                        <Input defaultValue="" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="border-r">
                    <Label>Abordaje General:</Label>
                    <Input defaultValue="" />
                    <Label>Abordaje Específico:</Label>
                    <Input defaultValue="" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="bg-gray-200 text-center font-bold p-1">
              B) INTENCIONES FORMATIVAS
            </div>
            <div className="p-2 border mb-4">
              <p>
                <span className="font-bold">Progresión:</span>
                <Textarea className="mt-1" rows={3} defaultValue=""></Textarea>
              </p>
              <div className="flex items-center space-x-4 my-2">
                <span className="font-bold">Categoría(s):</span>
                <div className="flex items-center space-x-2">
                  <Checkbox id="vivir" />
                  <Label htmlFor="vivir">Vivir aquí y ahora</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="juntos" />
                  <Label htmlFor="juntos">Estar juntos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="experiencias" />
                  <Label htmlFor="experiencias">Experiencias</Label>
                </div>
              </div>
              <p>
                <span className="font-bold">Subcategoría(s):</span>
                <Textarea className="mt-1" rows={2} defaultValue=""></Textarea>
              </p>
              <p>
                <span className="font-bold">Meta(s) de Aprendizaje:</span>
                <Textarea className="mt-1" rows={3} defaultValue=""></Textarea>
              </p>
              <p>
                <span className="font-bold">Aprendizaje de Trayectoria:</span>
                <Textarea className="mt-1" rows={3} defaultValue=""></Textarea>
              </p>
            </div>

            <div className="bg-gray-200 text-center font-bold p-1">
              C) TRANSVERSALIDAD
            </div>
            <Table className="mb-4 border">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-bold">MULTIDISCIPLINARIEDAD</TableHead>
                  <TableHead className="text-center font-bold">Producto/Desempeño/Conocimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className='border-r'><Textarea defaultValue="UAC 1" className='min-h-0 p-1 h-8'/></TableCell><TableCell><Textarea defaultValue="" className='min-h-0 p-1 h-8'/></TableCell></TableRow>
                <TableRow><TableCell className='border-r'><Textarea defaultValue="UAC 2" className='min-h-0 p-1 h-8'/></TableCell><TableCell><Textarea defaultValue="" className='min-h-0 p-1 h-8'/></TableCell></TableRow>
                <TableRow><TableCell className='border-r'><Textarea defaultValue="UAC 3" className='min-h-0 p-1 h-8'/></TableCell><TableCell><Textarea defaultValue="" className='min-h-0 p-1 h-8'/></TableCell></TableRow>
              </TableBody>
              <TableHeader>
                 <TableRow>
                   <TableHead className="text-center font-bold">INTERDISCIPLINARIEDAD</TableHead>
                   <TableHead className="text-center font-bold">S.</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className='border-r'><Textarea defaultValue="Nombre del PAEC:" className='min-h-0 p-1 h-8'/></TableCell><TableCell><Textarea defaultValue="" className='min-h-0 p-1 h-8'/></TableCell></TableRow>
                <TableRow><TableCell className='border-r'><Textarea defaultValue="UAC 1" className='min-h-0 p-1 h-8'/></TableCell><TableCell><Textarea defaultValue="" className='min-h-0 p-1 h-8'/></TableCell></TableRow>
                <TableRow><TableCell className='border-r'><Textarea defaultValue="UAC 2" className='min-h-0 p-1 h-8'/></TableCell><TableCell><Textarea defaultValue="" className='min-h-0 p-1 h-8'/></TableCell></TableRow>
                <TableRow><TableCell className='border-r'><Textarea defaultValue="UAC 3" className='min-h-0 p-1 h-8'/></TableCell><TableCell><Textarea defaultValue="" className='min-h-0 p-1 h-8'/></TableCell></TableRow>
              </TableBody>
            </Table>

            <div className="bg-gray-200 text-center font-bold p-1">
              D) METODOLOGÍA: Aprendizaje basado en problemas
            </div>
            
            <div className="bg-gray-200 text-center font-bold p-1 mt-4">
              E) ACTIVIDADES DE APRENDIZAJE
            </div>
            <Table className="mb-4 border">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Momentos didácticos:</TableHead>
                  <TableHead className="font-bold text-center">Técnicas Didácticas</TableHead>
                  <TableHead className="font-bold text-center">Evidencia(s) de Aprendizaje (Producto/Desempeño/Conocimiento)</TableHead>
                  <TableHead className="font-bold text-center">Estrategia de Evaluación:</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border-r">
                    <span className='font-bold'>Apertura:</span>
                    <Textarea className='mt-1' rows={3}></Textarea>
                  </TableCell>
                  <TableCell className="border-r"><Textarea className='h-full'></Textarea></TableCell>
                  <TableCell className="border-r"><Textarea className='h-full'></Textarea></TableCell>
                  <TableCell><Textarea className='h-full'></Textarea></TableCell>
                </TableRow>
                <TableRow>
                   <TableCell className="border-r">
                    <span className='font-bold'>Desarrollo:</span>
                    <Textarea className='mt-1' rows={5}></Textarea>
                  </TableCell>
                  <TableCell className="border-r"><Textarea className='h-full'></Textarea></TableCell>
                  <TableCell className="border-r"><Textarea className='h-full'></Textarea></TableCell>
                  <TableCell><Textarea className='h-full'></Textarea></TableCell>
                </TableRow>
                 <TableRow>
                   <TableCell className="border-r">
                    <span className='font-bold'>Cierre:</span>
                    <Textarea className='mt-1' rows={3}></Textarea>
                  </TableCell>
                  <TableCell className="border-r"><Textarea className='h-full'></Textarea></TableCell>
                  <TableCell className="border-r"><Textarea className='h-full'></Textarea></TableCell>
                  <TableCell><Textarea className='h-full'></Textarea></TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="bg-gray-200 text-center font-bold p-1">
              F) HERRAMIENTAS DIDÁCTICAS
            </div>
            <Table className="mb-4 border">
               <TableBody>
                <TableRow>
                  <TableCell className="border-r w-1/3"><span className="font-bold">Recursos y Materiales Didácticos:</span><Textarea className="mt-1" rows={2}></Textarea></TableCell>
                  <TableCell className="border-r w-1/3"><span className="font-bold">Equipo:</span><Textarea className="mt-1" rows={2}></Textarea></TableCell>
                  <TableCell className="w-1/3"><span className="font-bold">Fuentes de Información:</span><Textarea className="mt-1" rows={2}></Textarea></TableCell>
                </TableRow>
               </TableBody>
            </Table>

            <div className="bg-gray-200 text-center font-bold p-1">
              G) VALIDACIÓN
            </div>
             <Table className="mb-4 border">
               <TableBody>
                <TableRow>
                  <TableCell className="border-r w-1/3 text-center"><p className='font-bold'>Elaboró</p><br/><br/><hr/><p>Facilitador</p></TableCell>
                  <TableCell className="border-r w-1/3 text-center"><p className='font-bold'>Revisó</p><br/><br/><hr/><p>Jefe del Depto. Académico y de Competencias</p></TableCell>
                  <TableCell className="w-1/3 text-center"><p className='font-bold'>Avali</p><br/><br/><hr/><p>Presidente del Consejo Técnico Académico</p></TableCell>
                </TableRow>
               </TableBody>
            </Table>
            <div>
              <p className="font-bold">Nomenclatura en la plantilla:</p>
              <p>UAC: Unidad de aprendizaje curricular</p>
              <p>PAEC: Proyecto Aula-Escuela-Comunidad</p>
              <p>P: Progresión</p>
              <p>S: Semana</p>
              <p>A: Autoevaluación</p>
              <p>C: Coevaluación</p>
              <p>H: Heteroevaluación</p>
              <p>R: Rúbrica</p>
              <p>LC: Lista de Cotejo</p>
              <p>GO: Guía de Observación</p>
              <p>E: Escala Evaluativa, Escala Valorativa</p>
              <p>PE: Prueba escrita</p>
              <p>Otro: Diario de emociones, bitácora de aprendizaje, etc</p>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
