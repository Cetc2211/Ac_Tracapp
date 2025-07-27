
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
import { useState, useEffect } from 'react';
import { generateProgressionSuggestions } from '@/ai/flows/progression-suggester';
import { useToast } from '@/hooks/use-toast';

const initialFormData = {
  uac: '',
  docentes: '',
  semanas: '',
  periodo: '',
  areaConocimiento: '',
  semestre: '',
  grupos: '',
  horasDocente: '',
  horasIndependiente: '',
  progresion: '',
  categorias: [] as string[],
  subcategorias: '',
  metasAprendizaje: '',
  productoEsperado: '',
  conceptosCentrales: '',
  conceptosTransversales: '',
  recursosSociocognitivos: '',
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
  lugar: '',
  fecha: '',
};

export default function ProgressionsPage() {
  const [formData, setFormData] = useState(initialFormData);

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('progressionData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Ensure all keys from initialFormData are present
        const completeData = { ...initialFormData, ...parsedData };
        setFormData(completeData);
      }
    } catch (error) {
        console.error("Failed to parse progression data from localStorage", error);
        setFormData(initialFormData);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('progressionData', JSON.stringify(formData));
    toast({
      title: 'Progreso Guardado',
      description: 'La información de la progresión ha sido guardada en tu navegador.',
    });
  };

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
    const { progresion, metasAprendizaje, productoEsperado, conceptosCentrales, conceptosTransversales, recursosSociocognitivos } = formData;
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
        trajectory: productoEsperado,
        centralConcepts: conceptosCentrales,
        crossConcepts: conceptosTransversales,
        sociocognitiveResources: recursosSociocognitivos,
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
          <Button variant="outline" onClick={handleSave}>Guardar Cambios</Button>
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
                  src="https://placehold.co/200x100.png"
                  width={100}
                  height={50}
                  alt="Logo SEP"
                  data-ai-hint="government education logo"
                />
              </div>
              <div className="text-center">
                <p className="font-bold">
                  SUBSECRETARÍA DE EDUCACIÓN MEDIA SUPERIOR
                </p>
                <p className="text-sm">
                  Dirección General de Educación Tecnológica Agropecuaria y
                  Ciencias del Mar
                </p>
              </div>
              <div className="flex flex-col items-center">
                 <Image
                  src="https://placehold.co/200x100.png"
                  width={100}
                  height={50}
                  alt="Logo DGETAyCM"
                  data-ai-hint="school system logo"
                />
              </div>
            </div>
            <p className="text-center font-bold mb-4">
                INSTRUMENTACIÓN DIDÁCTICA PARA LA FORMACIÓN DEL SEMESTRE
            </p>

            <div className="bg-gray-200 text-center font-bold p-1">
              A) IDENTIFICACIÓN
            </div>
            <Table className="mb-4 border">
              <TableBody>
                <TableRow>
                    <TableCell className="border-r font-bold" colSpan={2}>PLANTEL: Centro de Bachillerato Tecnológico Agropecuario No. 130, "Eutimio Plantillas Avelar"</TableCell>
                    <TableCell className="border-r">
                        <Label htmlFor="periodo">PERIODO DE APLICACIÓN</Label>
                        <Input id="periodo" value={formData.periodo} onChange={handleInputChange} placeholder="AGOSTO 2024 - ENERO 2025" />
                    </TableCell>
                    <TableCell>
                        <Label htmlFor="fecha">FECHA</Label>
                        <Input id="fecha" value={formData.fecha} onChange={handleInputChange} placeholder="DD/MM/AAAA" />
                    </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="border-r" colSpan={2}>
                    <Label htmlFor="uac">UNIDAD DE APRENDIZAJE CURRICULAR (UAC)</Label>
                    <Input id="uac" value={formData.uac} onChange={handleInputChange} />
                  </TableCell>
                  <TableCell className="border-r">
                    <Label htmlFor="areaConocimiento">ÁREA DE CONOCIMIENTO</Label>
                    <Input id="areaConocimiento" value={formData.areaConocimiento} onChange={handleInputChange} />
                  </TableCell>
                   <TableCell className="border-r">
                    <Label htmlFor="semestre">SEMESTRE</Label>
                    <Input id="semestre" value={formData.semestre} onChange={handleInputChange} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="border-r" colSpan={2}>
                    <Label htmlFor="docentes">DOCENTE(S)</Label>
                    <Input id="docentes" value={formData.docentes} onChange={handleInputChange} />
                  </TableCell>
                  <TableCell className="border-r">
                    <Label htmlFor="grupos">GRUPOS</Label>
                    <Input id="grupos" value={formData.grupos} onChange={handleInputChange} />
                  </TableCell>
                  <TableCell>
                    <Label htmlFor="horasDocente">HORAS ASIGNADAS A LA UAC</Label>
                    <Input id="horasDocente" value={formData.horasDocente} onChange={handleInputChange} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="bg-gray-200 text-center font-bold p-1">
              B) INTENCIONES FORMATIVAS
            </div>
            <div className="p-2 border mb-4 space-y-2">
              <div>
                <Label htmlFor="progresion" className="font-bold">PROGRESIÓN:</Label>
                <Textarea id="progresion" className="mt-1" rows={3} value={formData.progresion} onChange={handleInputChange}></Textarea>
              </div>
              <div className="flex items-center space-x-4 my-2">
                <span className="font-bold">CATEGORÍA(S):</span>
                <div className="flex items-center space-x-2">
                  <Checkbox id="vivir" onCheckedChange={(checked) => handleCheckboxChange('vivir', checked)} checked={formData.categorias.includes('vivir')} />
                  <Label htmlFor="vivir">Vivir aquí y ahora</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="juntos" onCheckedChange={(checked) => handleCheckboxChange('juntos', checked)} checked={formData.categorias.includes('juntos')} />
                  <Label htmlFor="juntos">Estar juntos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="experiencias" onCheckedChange={(checked) => handleCheckboxChange('experiencias', checked)} checked={formData.categorias.includes('experiencias')} />
                  <Label htmlFor="experiencias">Experiencias</Label>
                </div>
              </div>
               <div>
                <Label htmlFor="subcategorias" className="font-bold">SUBCATEGORÍA(S):</Label>
                <Textarea id="subcategorias" className="mt-1" rows={2} value={formData.subcategorias} onChange={handleInputChange}></Textarea>
              </div>
              <div>
                <Label htmlFor="metasAprendizaje" className="font-bold">META(S) DE APRENDIZAJE:</Label>
                <Textarea id="metasAprendizaje" className="mt-1" rows={3} value={formData.metasAprendizaje} onChange={handleInputChange}></Textarea>
              </div>
              <div>
                <Label htmlFor="productoEsperado" className="font-bold">PRODUCTO ESPERADO DE LA PROGRESIÓN:</Label>
                <Textarea id="productoEsperado" className="mt-1" rows={3} value={formData.productoEsperado} onChange={handleInputChange}></Textarea>
              </div>
               <div>
                <Label htmlFor="recursosSociocognitivos" className="font-bold">RECURSOS SOCIOCOGNITIVOS (Opcional):</Label>
                <Textarea id="recursosSociocognitivos" className="mt-1" rows={3} value={formData.recursosSociocognitivos} onChange={handleInputChange} placeholder="Pega aquí los recursos sociocognitivos del plan de estudios..."></Textarea>
              </div>
               <div>
                <Label htmlFor="conceptosCentrales" className="font-bold">CONCEPTOS CENTRALES (Opcional):</Label>
                <Textarea id="conceptosCentrales" className="mt-1" rows={3} value={formData.conceptosCentrales} onChange={handleInputChange} placeholder="Pega aquí los conceptos centrales del plan de estudios..."></Textarea>
              </div>
              <div>
                <Label htmlFor="conceptosTransversales" className="font-bold">CONCEPTOS TRANSVERSALES (Opcional):</Label>
                <Textarea id="conceptosTransversales" className="mt-1" rows={3} value={formData.conceptosTransversales} onChange={handleInputChange} placeholder="Pega aquí los conceptos transversales del plan de estudios..."></Textarea>
              </div>
            </div>

            <div className="bg-gray-200 text-center font-bold p-1">
              C) TRANSVERSALIDAD
            </div>
            <Table className="mb-4 border">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-bold" colSpan={2}>EJES DE LA TRANSVERSALIDAD</TableHead>
                </TableRow>
                 <TableRow>
                  <TableHead className="text-center font-bold border-r">MULTIDISCIPLINARIEDAD</TableHead>
                  <TableHead className="text-center font-bold">PRODUCTO/DESEMPEÑO/CONOCIMIENTO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className='border-r'><Textarea defaultValue="UAC 1" className='min-h-0 p-1 h-8'/></TableCell><TableCell><Textarea defaultValue="" className='min-h-0 p-1 h-8'/></TableCell></TableRow>
                <TableRow><TableCell className='border-r'><Textarea defaultValue="UAC 2" className='min-h-0 p-1 h-8'/></TableCell><TableCell><Textarea defaultValue="" className='min-h-0 p-1 h-8'/></TableCell></TableRow>
              </TableBody>
              <TableHeader>
                 <TableRow>
                   <TableHead className="text-center font-bold border-r">INTERDISCIPLINARIEDAD</TableHead>
                   <TableHead className="text-center font-bold">Semana</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className='border-r'><Textarea defaultValue="Nombre del PAEC:" className='min-h-0 p-1 h-8'/></TableCell><TableCell><Textarea defaultValue="" className='min-h-0 p-1 h-8'/></TableCell></TableRow>
              </TableBody>
               <TableHeader>
                 <TableRow>
                   <TableHead className="text-center font-bold border-r">SOCIAL</TableHead>
                   <TableHead className="text-center font-bold">PRODUCTO/DESEMPEÑO/CONOCIMIENTO</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className='border-r'><Textarea defaultValue="Problema o necesidad:" className='min-h-0 p-1 h-8'/></TableCell><TableCell><Textarea defaultValue="" className='min-h-0 p-1 h-8'/></TableCell></TableRow>
              </TableBody>
            </Table>
            
            <div className="bg-gray-200 text-center font-bold p-1 mt-4">
              D) ACTIVIDADES DE APRENDIZAJE
            </div>
            <Table className="mb-4 border">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold w-[35%]">ACTIVIDADES DE ENSEÑANZA-APRENDIZAJE-EVALUACIÓN</TableHead>
                  <TableHead className="font-bold text-center w-[25%]">INSTRUMENTOS DE EVALUACIÓN</TableHead>
                  <TableHead className="font-bold text-center w-[25%]">EVIDENCIA(S) DE APRENDIZAJE (PRODUCTO/DESEMPEÑO/CONOCIMIENTO)</TableHead>
                  <TableHead className="font-bold text-center w-[15%]">PONDERACIÓN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border-r">
                    <Label htmlFor="actividadApertura" className='font-bold'>APERTURA:</Label>
                    <Textarea id="actividadApertura" className='mt-1' rows={3} value={formData.actividadApertura} onChange={handleInputChange}></Textarea>
                  </TableCell>
                  <TableCell className="border-r"><Textarea id="tecnicaApertura" className='h-full' value={formData.tecnicaApertura} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell className="border-r"><Textarea id="evidenciaApertura" className='h-full' value={formData.evidenciaApertura} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell><Textarea id="evaluacionApertura" className='h-full' value={formData.evaluacionApertura} onChange={handleInputChange}></Textarea></TableCell>
                </TableRow>
                <TableRow>
                   <TableCell className="border-r">
                    <Label htmlFor="actividadDesarrollo" className='font-bold'>DESARROLLO:</Label>
                    <Textarea id="actividadDesarrollo" className='mt-1' rows={5} value={formData.actividadDesarrollo} onChange={handleInputChange}></Textarea>
                  </TableCell>
                  <TableCell className="border-r"><Textarea id="tecnicaDesarrollo" className='h-full' value={formData.tecnicaDesarrollo} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell className="border-r"><Textarea id="evidenciaDesarrollo" className='h-full' value={formData.evidenciaDesarrollo} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell><Textarea id="evaluacionDesarrollo" className='h-full' value={formData.evaluacionDesarrollo} onChange={handleInputChange}></Textarea></TableCell>
                </TableRow>
                 <TableRow>
                   <TableCell className="border-r">
                    <Label htmlFor="actividadCierre" className='font-bold'>CIERRE:</Label>
                    <Textarea id="actividadCierre" className='mt-1' rows={3} value={formData.actividadCierre} onChange={handleInputChange}></Textarea>
                  </TableCell>
                  <TableCell className="border-r"><Textarea id="tecnicaCierre" className='h-full' value={formData.tecnicaCierre} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell className="border-r"><Textarea id="evidenciaCierre" className='h-full' value={formData.evidenciaCierre} onChange={handleInputChange}></Textarea></TableCell>
                  <TableCell><Textarea id="evaluacionCierre" className='h-full' value={formData.evaluacionCierre} onChange={handleInputChange}></Textarea></TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="bg-gray-200 text-center font-bold p-1">
              E) RECURSOS DIDÁCTICOS
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
              F) VALIDACIÓN
            </div>
             <Table className="mb-4 border">
               <TableBody>
                <TableRow>
                  <TableCell className="border-r w-1/3 text-center"><p className='font-bold'>Elabora</p><br/><br/><hr className='border-black'/><p>Docente(s)</p></TableCell>
                  <TableCell className="border-r w-1/3 text-center"><p className='font-bold'>Valida</p><br/><br/><hr className='border-black'/><p>Presidente de Academia</p></TableCell>
                  <TableCell className="w-1/3 text-center"><p className='font-bold'>Autoriza</p><br/><br/><hr className='border-black'/><p>Subdirector Académico</p></TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    <div className="flex gap-4 justify-center">
                        <div>
                            <Label htmlFor="lugar">LUGAR</Label>
                            <Input id="lugar" value={formData.lugar} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label htmlFor="fecha_validacion">FECHA DE VALIDACIÓN</Label>
                            <Input id="fecha_validacion" value={formData.fecha} onChange={handleInputChange} />
                        </div>
                    </div>
                  </TableCell>
                </TableRow>
               </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

    