// Valida la jugada, publica en Kafka y responde. El cliente no puede inventar un nivel completado.
import { usuarioActual } from '@/lib/auth';
import { area as buscarArea, estadoInicial, type EstadoPartida, type JuegoId } from '@/lib/contenido';
import { intentarBajada, type EstadoBajada } from '@/lib/juegos/bajada';
import { intentarCaso, type EstadoCaso } from '@/lib/juegos/caso';
import { intentarTablero, type EstadoTablero } from '@/lib/juegos/tablero';
import { db } from '@/lib/db';
import { publicar } from '@/lib/kafka';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Tipo = 'nivel_iniciado' | 'intento' | 'nivel_abandonado';
type Evento = {
  eventId: string;
  alumnoId: string;
  tipo: Tipo | 'nivel_completado';
  area: string;
  areaNombre: string;
  nivel: number;
  totalNiveles: number;
  acierto?: boolean;
  cerca?: boolean;
  rareza?: string;
  ts: number;
};

export async function POST(req: Request) {
  const u = await usuarioActual();
  if (u?.rol !== 'alumno') return Response.json({ error: 'Solo los alumnos envían eventos' }, { status: 401 });

  const b = await req.json().catch(() => null);
  const area = buscarArea(b?.area);
  const nivel = Number(b?.nivel);
  const tipo = b?.tipo as Tipo;
  if (!area || !UUID.test(b?.eventId ?? '') || !['nivel_iniciado', 'intento', 'nivel_abandonado'].includes(tipo)
    || !Number.isInteger(nivel) || nivel < 1 || nivel > area.niveles.length) {
    return Response.json({ error: 'Evento inválido' }, { status: 400 });
  }

  const base = {
    alumnoId: u.id, area: area.slug, areaNombre: area.nombre, nivel, totalNiveles: area.niveles.length, ts: Date.now(),
  };
  const cx = await db.connect();
  try {
    await cx.query('begin');
    const ya = await cx.query('select payloads, respuesta, status from eventos_salida where event_id = $1', [b.eventId]);
    if (ya.rows[0]) {
      await cx.query('commit');
      await publicar(ya.rows[0].payloads);
      return Response.json(ya.rows[0].respuesta, { status: ya.rows[0].status });
    }

    const guardada = await cx.query('select estado from partida where alumno_id = $1 and area = $2 and nivel = $3 for update', [u.id, area.slug, nivel]);
    let estado = (guardada.rows[0]?.estado ?? estadoInicial(area.juegoId)) as EstadoPartida;
    const payloads: Evento[] = [];
    let cuerpo: Record<string, unknown> = {};
    let status = 202;

    if (tipo === 'nivel_iniciado') {
      payloads.push({ eventId: b.eventId, tipo, ...base });
      cuerpo = { ok: true };
    } else if (tipo === 'nivel_abandonado') {
      payloads.push({ eventId: b.eventId, tipo, ...base });
      estado = estadoInicial(area.juegoId);
      cuerpo = { ok: true };
    } else {
      const jugada = jugar(area.juegoId, nivel, b, estado) as {
        publicar: boolean; acierto?: boolean; cerca?: boolean; rareza?: string; completado: boolean;
        estado: EstadoPartida; cuerpo: Record<string, unknown>;
      } | null;
      if (!jugada) {
        await cx.query('rollback');
        return Response.json({ error: 'Intento inválido' }, { status: 400 });
      }
      estado = jugada.estado;
      cuerpo = jugada.cuerpo;
      if (jugada.publicar) {
        payloads.push({
          eventId: b.eventId, tipo: 'intento', ...base, acierto: jugada.acierto,
          ...(jugada.cerca !== undefined && { cerca: jugada.cerca }),
          ...(jugada.rareza && { rareza: jugada.rareza }),
        });
        if (jugada.completado) {
          payloads.push({ eventId: `${b.eventId}:ok`, tipo: 'nivel_completado', ...base });
        }
      } else {
        status = 200;
      }
    }

    await cx.query(
      `insert into partida (alumno_id, area, nivel, estado) values ($1, $2, $3, $4)
       on conflict (alumno_id, area, nivel) do update set estado = excluded.estado`,
      [u.id, area.slug, nivel, JSON.stringify(estado)]);
    if (tipo === 'nivel_abandonado') await cx.query('delete from partida where alumno_id = $1 and area = $2 and nivel = $3', [u.id, area.slug, nivel]);
    await cx.query('insert into eventos_salida (event_id, payloads, respuesta, status) values ($1, $2, $3, $4)', [b.eventId, JSON.stringify(payloads), JSON.stringify(cuerpo), status]);
    await cx.query('commit');
    await publicar(payloads);
    return Response.json(cuerpo, { status });
  } catch (e) {
    await cx.query('rollback');
    throw e;
  } finally {
    cx.release();
  }
}

function jugar(juego: JuegoId, nivel: number, b: { respuesta?: string; situacion?: string; estante?: string }, estado: EstadoPartida) {
  if (juego === 'caso') {
    if (typeof b.respuesta !== 'string') return null;
    return intentarCaso(nivel, b.respuesta, estado as EstadoCaso);
  }
  if (juego === 'bajada') {
    if (typeof b.respuesta !== 'string') return null;
    return intentarBajada(nivel, b.respuesta, estado as EstadoBajada);
  }
  if (typeof b.situacion !== 'string' || typeof b.estante !== 'string') return null;
  return intentarTablero(nivel, b.situacion, b.estante, estado as EstadoTablero);
}
