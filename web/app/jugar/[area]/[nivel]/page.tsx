import { notFound } from 'next/navigation';
import { exigirRol } from '@/lib/auth';
import { area as buscarArea } from '@/lib/contenido';
import { Juego } from './Juego';

export default async function PaginaNivel({ params }: { params: Promise<{ area: string; nivel: string }> }) {
  await exigirRol('alumno');
  const p = await params;
  const area = buscarArea(p.area);
  const nivel = Number(p.nivel);
  const datos = area?.niveles[nivel - 1];
  if (!area || !datos) notFound();
  return <Juego area={area.slug} areaNombre={area.nombre} nivel={nivel} totalNiveles={area.niveles.length} {...datos} />;
}
