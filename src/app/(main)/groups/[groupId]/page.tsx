'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { groups, students as allStudents } from '@/lib/placeholder-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function GroupDetailsPage({
  params,
}: {
  params: { groupId: string };
}) {
  const group = groups.find((g) => g.id === params.groupId);

  if (!group) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/groups">
            <ArrowLeft />
            <span className="sr-only">Volver a grupos</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{group.subject}</h1>
          <p className="text-muted-foreground">
            Detalles del grupo y lista de estudiantes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estudiantes en el Grupo</CardTitle>
              <CardDescription>
                Actualmente hay {group.students.length} estudiantes en este
                grupo.
              </CardDescription>
            </div>
             <Button size="sm" className="gap-1">
                <UserPlus className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Agregar Estudiante
                </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Foto</span>
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>ID de Estudiante</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Nivel de Riesgo</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt="Foto del estudiante"
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={student.photo}
                      data-ai-hint="student photo"
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.id}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {student.email}
                  </TableCell>
                  <TableCell>
                    {student.riskLevel === 'high' && (
                      <Badge variant="destructive">Alto</Badge>
                    )}
                    {student.riskLevel === 'medium' && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-400 text-black"
                      >
                        Medio
                      </Badge>
                    )}
                    {student.riskLevel === 'low' && (
                      <Badge variant="secondary">Bajo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Ver Perfil Completo</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Quitar del Grupo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
