import { db } from './db';

type Consultable = { query: typeof db.query };

// El último nivel completado por área. `partida` lo escribe el servidor al validar la jugada, así que
// no espera al proyector. `progreso_area` cubre el historial que llega solo por Kafka, como el seed.
export async function nivelesCompletados(alumnoId: string, cx: Consultable = db): Promise<Record<string, number>> {
  const { rows } = await cx.query(
    `select area, max(nivel)::int as nivel from (
       select area, nivel from partida where alumno_id = $1 and (estado->>'completado')::boolean
       union all
       select area, nivel_max from progreso_area where alumno_id = $1
     ) t group by area`, [alumnoId]);
  return Object.fromEntries(rows.map((r) => [r.area, r.nivel as number]));
}

export const desbloqueado = (completados: Record<string, number>, area: string, nivel: number) =>
  nivel <= (completados[area] ?? 0) + 1;
