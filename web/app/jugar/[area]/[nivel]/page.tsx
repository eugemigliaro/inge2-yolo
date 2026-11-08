import { notFound } from 'next/navigation';
import { exigirRol } from '@/lib/auth';
import { area as buscarArea, estadoInicial, vistaNivel } from '@/lib/contenido';
import { db } from '@/lib/db';
import { Bajada } from './Bajada';
import { Caso } from './Caso';
import { Tablero } from './Tablero';

export default async function PaginaNivel({ params }: { params: Promise<{ area: string; nivel: string }> }) {
  const u = await exigirRol('alumno');
  const p = await params;
  const area = buscarArea(p.area);
  const nivel = Number(p.nivel);
  const vista = area && vistaNivel(area.slug, nivel);
  if (!area || !vista) notFound();

  const { rows } = await db.query('select estado from partida where alumno_id = $1 and area = $2 and nivel = $3', [u.id, area.slug, nivel]);
  const estado = rows[0]?.estado ?? estadoInicial(area.juegoId);
  const titulo = area.niveles[nivel - 1].titulo;
  const props = { area: area.slug, areaNombre: area.nombre, nivel, totalNiveles: area.niveles.length, titulo };

  if (vista.juego === 'caso' && 'intentos' in estado) return <Caso {...props} catalogo={vista.catalogo} inicial={estado.intentos} />;
  if (vista.juego === 'bajada' && 'aceptadas' in estado) return <Bajada {...props} consigna={vista.consigna} exige={vista.exige} tamano={vista.tamano} paraCompletar={vista.paraCompletar} inicial={estado} />;
  if (vista.juego === 'tablero' && 'correctas' in estado) return <Tablero {...props} situaciones={vista.situaciones} estantes={vista.estantes} inicial={estado} />;
  notFound();
}
