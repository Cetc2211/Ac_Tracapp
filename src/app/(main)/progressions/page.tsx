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
                    <Input defaultValue="Cecilio Topete Cruz" />
                  </TableCell>
                  <TableCell>
                    <Label>Semana(s): 1.25 semanas</Label>
                    <Input defaultValue="" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="border-r">
                    <Label>Área del Conocimiento:</Label>
                    <Input defaultValue="Humanidades 1" />
                  </TableCell>
                  <TableCell className="border-r" rowSpan={2}>
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div>
                        <Label>Semestre</Label>
                        <Input defaultValue="I" />
                      </div>
                      <div>
                        <Label>Grupos</Label>
                        <Input defaultValue="IA, B y C" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell rowSpan={2}>
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div>
                        <Label>Horas de mediación docente</Label>
                        <Input defaultValue="4" />
                      </div>
                      <div>
                        <Label>Horas de estudio independiente</Label>
                        <Input defaultValue="1" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="border-r">
                    <Label>Abordaje General:</Label>
                    <Input defaultValue="Qué se necesita saber para transformar la sociedad." />
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
                <span className="font-bold">Progresión:</span> Valora la configuración de su propia experiencia al cuestionar y decidir los roles que puede cumplir en relación con acontecimientos, discursos, instituciones, imágenes, objetos y prácticas, para ejercitar su capacidad práctica y de juicio en los diferentes ámbitos de su vida.
              </p>
              <div className="flex items-center space-x-4 my-2">
                <span className="font-bold">Categoría(s):</span>
                <div className="flex items-center space-x-2">
                  <Checkbox id="vivir" defaultChecked />
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
                <span className="font-bold">Subcategoría(s):</span> Vida alienada: Hace referencia a no poner en cuestión la finitud y experiencia propia.
                Conflictos de lo colectivo: Hace mención a los sentidos que pueden adquirir las relaciones que conforman lo colectivo (Sometimiento, soberanía, obediencia, rebeldía, sublevación, insurrección, ciudadanía)
              </p>
              <p>
                <span className="font-bold">Meta(s) de Aprendizaje:</span> Utiliza los significados (culturales, políticos, históricos, tecnológicos, entre otros) de las prácticas, discursos, instituciones y acontecimientos que constituyen su vida y los vincula a sus capacidades de construir la colectividad con base en los aportes de las humanidades. Asume roles relacionados con los acontecimientos, discursos, instituciones, imágenes, objetos y prácticas que conforman sus vivencias de forma humanista.
              </p>
              <p>
                <span className="font-bold">Aprendizaje de Trayectoria:</span> Cuestiona y argumenta los significados (culturales, políticos, históricos, tecnológicos, naturales, entre otros) de las prácticas, discursos, instituciones y acontecimientos que constituyen su vida para fortalecer su afectividad y sus capacidades de construir su experiencia individual y colectiva.
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
                <TableRow><TableCell className='border-r'>UAC 1</TableCell><TableCell></TableCell></TableRow>
                <TableRow><TableCell className='border-r'>UAC 2</TableCell><TableCell></TableCell></TableRow>
                <TableRow><TableCell className='border-r'>UAC 3</TableCell><TableCell></TableCell></TableRow>
              </TableBody>
              <TableHeader>
                 <TableRow>
                   <TableHead className="text-center font-bold">INTERDISCIPLINARIEDAD</TableHead>
                   <TableHead className="text-center font-bold">S.</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className='border-r'>Nombre del PAEC:</TableCell><TableCell></TableCell></TableRow>
                <TableRow><TableCell className='border-r'>UAC 1</TableCell><TableCell></TableCell></TableRow>
                <TableRow><TableCell className='border-r'>UAC 2</TableCell><TableCell></TableCell></TableRow>
                <TableRow><TableCell className='border-r'>UAC 3</TableCell><TableCell></TableCell></TableRow>
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
                    <p>1.- Visualiza un video acerca de los roles de género, que el docente proporcionará.</p>
                    <p>2.- Responde un cuestionario diagnóstico a partir de la visualización del video.</p>
                  </TableCell>
                  <TableCell className="border-r text-center">Total: 30 min.</TableCell>
                  <TableCell className="border-r text-center">Cuestionario resuelto</TableCell>
                  <TableCell className="text-center">Diagnóstica: <br/> Instrumento: Cuestionario <br/> Ponderación: 5%</TableCell>
                </TableRow>
                <TableRow>
                   <TableCell className="border-r">
                    <span className='font-bold'>Desarrollo:</span>
                    <p>1.- Clasifica a través de una lluvia de ideas, las actividades asignadas socialmente a las mujeres y socialmente asignadas a los hombres.</p>
                    <p>2.- Reflexiona acerca de las funciones sociales que derivan en estereotipos negativos y los que no.</p>
                    <p>3.- Investiga los conceptos de: Rol, Estereotipo, Género, Estereotipo de género y Violencia.</p>
                    <p>4.- Identifica las problemáticas sociales que han causado los estereotipos de género. (Violencias barriales, exclusiones de género, sometimiento político).</p>
                    <p>5.- Describe los riesgos a los que se exponen los diferentes roles sociales en tu comunidad.</p>
                  </TableCell>
                  <TableCell className="border-r text-center">Total: 2 horas 30 min.</TableCell>
                  <TableCell className="border-r text-center">Lluvia de ideas, Reflexión por escrito</TableCell>
                  <TableCell className="text-center">Formativa: <br/> Instrumento: Rúbrica <br/> Ponderación: 60%</TableCell>
                </TableRow>
                 <TableRow>
                   <TableCell className="border-r">
                    <span className='font-bold'>Cierre:</span>
                    <p>1.- Forma equipos, para proponer alternativas de solución a los problemas antes mencionados.</p>
                    <p>2.- Expone al grupo sus propuestas de solución.</p>
                  </TableCell>
                  <TableCell className="border-r text-center">Total: 2 horas</TableCell>
                  <TableCell className="border-r text-center">Formación de equipos, Exposición</TableCell>
                  <TableCell className="text-center">Sumativa: <br/> Instrumento: Rúbrica <br/> Ponderación: 40%</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="bg-gray-200 text-center font-bold p-1">
              F) HERRAMIENTAS DIDÁCTICAS
            </div>
            <Table className="mb-4 border">
               <TableBody>
                <TableRow>
                  <TableCell className="border-r w-1/3"><span className="font-bold">Recursos y Materiales Didácticos:</span><p>Pizarrón, Plumones</p></TableCell>
                  <TableCell className="border-r w-1/3"><span className="font-bold">Equipo:</span><p>Proyector y equipo de computo</p></TableCell>
                  <TableCell className="w-1/3"><span className="font-bold">Fuentes de Información:</span><p>Video (pendiente el link)</p></TableCell>
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
