
'use client';

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
import { Loader2, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { generateProgressionSuggestions } from '@/ai/flows/progression-suggester';
import { useToast } from '@/hooks/use-toast';

export default function ProgressionsPage() {
  const [formData, setFormData] = useState({
    uac: '',
    docentes: '',
    semanas: '',
    areaConocimiento: '',
    semestre: '',
    grupos: '',
    horasDocente: '',
    horasIndependiente: '',
    abordajeGeneral: '',
    abordajeEspecifico: '',
    progresion: '',
    categorias: [] as string[],
    subcategorias: '',
    metasAprendizaje: '',
    aprendizajeTrayectoria: '',
    actividadApertura: '',
    tecnicaApertura: '',
    evidenciaApertura: '',
    evaluacionApertura: '',
    actividadDesarrollo: '',
    tecnicaDesarrollo: '',
    evidenciaDesarrollo: '',
    evaluacionDesarrollo: '',
    actividadCierre: '',
    tecnicaCierre: '',
    evidenciaCierre: '',
    evaluacionCierre: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (id: string, checked: boolean | 'indeterminate') => {
    setFormData(prev => {
        const newCategories = checked ? [...prev.categorias, id] : prev.categorias.filter(cat => cat !== id);
        return {...prev, categorias: newCategories};
    });
  }

  const handleGetSuggestions = async () => {
    const { progresion, metasAprendizaje, aprendizajeTrayectoria } = formData;
    if (!progresion || !metasAprendizaje) {
      toast({
        variant: 'destructive',
        title: 'Faltan datos',
        description: 'Por favor, completa los campos "Progresión" y "Meta(s) de Aprendizaje" para obtener sugerencias.',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await generateProgressionSuggestions({
        progression: progresion,
        learningGoals: metasAprendizaje,
        trajectory: aprendizajeTrayectoria,
      });

      setFormData(prev => ({
        ...prev,
        actividadApertura: result.opening,
        actividadDesarrollo: result.development,
        actividadCierre: result.closing,
      }));

      toast({
        title: 'Sugerencias generadas',
        description: 'Se han llenado las actividades de apertura, desarrollo y cierre.',
      });

    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        variant: 'destructive',
        title: 'Error de IA',
        description: 'No se pudieron generar las sugerencias. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };


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
          <Button onClick={handleGetSuggestions} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
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
                    <Label htmlFor="uac">UAC</Label>
                    <Input id="uac" value={formData.uac} onChange={handleInputChange} />
                  </TableCell>
                  <TableCell className="border-r">
                    <Label htmlFor="docentes">Docente(s)</Label>
                    <Input id="docentes" value={formData.docentes} onChange={handleInputChange} />
                  </TableCell>
                  <TableCell>
                    <Label htmlFor="semanas">Semana(s): 1.25 semanas</Label>
                    <Input id="semanas" value={formData.semanas} onChange={handleInputChange} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="border-r">
                    <Label htmlFor="areaConocimiento">Área del Conocimiento:</Label>
                    <Input id="areaConocimiento" value={formData.areaConocimiento} onChange={handleInputChange} />
                  </TableCell>
                  <TableCell className="border-r" rowSpan={2}>
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div>
                        <Label htmlFor="semestre">Semestre</Label>
                        <Input id="semestre" value={formData.semestre} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="grupos">Grupos</Label>
                        <Input id="grupos" value={formData.grupos} onChange={handleInputChange} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell rowSpan={2}>
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div>
                        <Label htmlFor="horasDocente">Horas de mediación docente</Label>
                        <Input id="horasDocente" value={formData.horasDocente} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="horasIndependiente">Horas de estudio independiente</Label>
                        <Input id="horasIndependiente" value={formData.horasIndependiente} onChange={handleInputChange} />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="border-r">
                    <Label htmlFor="abordajeGeneral">Abordaje General:</Label>
                    <Input id="abordajeGeneral" value={formData.abordajeGeneral} onChange={handleInputChange} />
                    <Label htmlFor="abordajeEspecifico">Abordaje Específico:</Label>
                    <Input id="abordajeEspecifico" value={formData.abordajeEspecifico} onChange={handleInputChange} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="bg-gray-200 text-center font-bold p-1">
              B) INTENCIONES FORMATIVAS
            </div>
            <div className="p-2 border mb-4 space-y-2">
              <div>
                <Label htmlFor="progresion" className="font-bold">Progresión:</Label>
                <Textarea id="progresion" className="mt-1" rows={3} value={formData.progresion} onChange={handleInputChange}></Textarea>
              </div>
              <div className="flex items-center space-x-4 my-2">
                <span className="font-bold">Categoría(s):</span>
                <div className="flex items-center space-x-2">
                  <Checkbox id="vivir" onCheckedChange={(checked) => handleCheckboxChange('vivir', checked)} />
                  <Label htmlFor="vivir">Vivir aquí y ahora</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="juntos" onCheckedChange={(checked) => handleCheckboxChange('juntos', checked)} />
                  <Label htmlFor="juntos">Estar juntos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="experiencias" onCheckedChange={(checked) => handleCheckboxChange('experiencias', checked)} />
                  <Label htmlFor="experiencias">Experiencias</Label>
                </div>
              </div>
               <div>
                <Label htmlFor="subcategorias" className="font-bold">Subcategoría(s):</Label>
                <Textarea id="subcategorias" className="mt-1" rows={2} value={formData.subcategorias} onChange={handleInputChange}></Textarea>
              </div>
              <div>
                <Label htmlFor="metasAprendizaje" className="font-bold">Meta(s) de Aprendizaje:</Label>
                <Textarea id="metasAprendizaje" className="mt-1" rows={3} value={formData.metasAprendizaje} onChange={handleInputChange}></Textarea>
              </div>
              <div>
                <Label htmlFor="aprendizajeTrayectoria" className="font-bold">Aprendizaje de Trayectoria:</Label>
                <Textarea id="aprendizajeTrayectoria" className="mt-1" rows={3} value={formData.aprendizajeTrayectoria} onChange={handleInputChange}></Textarea>
              </div>
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
                    <Label htmlFor="actividadApertura" className='font-bold'>Apertura:</Label>
                    <Textarea id="actividadApertura" className='mt-1' rows={3} value={formData.actividadApertura} onChange={handleInputChange}></Textarea>
                  </TableCell>
                  <TableCell className="border-r"><Textarea id="tecnicaApertura" className='h-full' value={formData.tecnicaApertura} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell className="border-r"><Textarea id="evidenciaApertura" className='h-full' value={formData.evidenciaApertura} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell><Textarea id="evaluacionApertura" className='h-full' value={formData.evaluacionApertura} onChange={handleInputChange}></Textarea></TableCell>
                </TableRow>
                <TableRow>
                   <TableCell className="border-r">
                    <Label htmlFor="actividadDesarrollo" className='font-bold'>Desarrollo:</Label>
                    <Textarea id="actividadDesarrollo" className='mt-1' rows={5} value={formData.actividadDesarrollo} onChange={handleInputChange}></Textarea>
                  </TableCell>
                  <TableCell className="border-r"><Textarea id="tecnicaDesarrollo" className='h-full' value={formData.tecnicaDesarrollo} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell className="border-r"><Textarea id="evidenciaDesarrollo" className='h-full' value={formData.evidenciaDesarrollo} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell><Textarea id="evaluacionDesarrollo" className='h-full' value={formData.evaluacionDesarrollo} onChange={handleInputChange}></Textarea></TableCell>
                </TableRow>
                 <TableRow>
                   <TableCell className="border-r">
                    <Label htmlFor="actividadCierre" className='font-bold'>Cierre:</Label>
                    <Textarea id="actividadCierre" className='mt-1' rows={3} value={formData.actividadCierre} onChange={handleInputChange}></Textarea>
                  </TableCell>
                  <TableCell className="border-r"><Textarea id="tecnicaCierre" className='h-full' value={formData.tecnicaCierre} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell className="border-r"><Textarea id="evidenciaCierre" className='h-full' value={formData.evidenciaCierre} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell><Textarea id="evaluacionCierre" className='h-full' value={formData.evaluacionCierre} onChange={handleInputChange}></Textarea></TableCell>
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
