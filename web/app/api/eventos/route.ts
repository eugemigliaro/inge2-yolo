// Ingesta: valida el evento del juego, lo enriquece y lo publica en Kafka. Responde sin esperar el procesamiento.
import { usuarioActual } from '@/lib/auth';
import { area as buscarArea } from '@/lib/contenido';
import { productor, TOPICO } from '@/lib/kafka';

const TIPOS = new Set(['nivel_iniciado', 'decision', 'nivel_completado', 'nivel_abandonado']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const entero = (n: unknown, max: number): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) < max;

export async function POST(req: Request) {
  const u = await usuarioActual();
  if (u?.rol !== 'alumno') return Response.json({ error: 'Solo los alumnos envían eventos' }, { status: 401 });

  const b = await req.json().catch(() => null);
  const area = buscarArea(b?.area);
  const nivel = area && entero(b.nivel - 1, area.niveles.length) ? area.niveles[b.nivel - 1] : undefined;
  const situacion = nivel && b.tipo === 'decision' && entero(b.situacion, nivel.situaciones.length) ? nivel.situaciones[b.situacion] : undefined;
  if (!area || !nivel || !TIPOS.has(b.tipo) || !UUID.test(b.eventId ?? '')
    || (b.tipo === 'decision' && !(situacion && entero(b.opcion, situacion.opciones.length)))) {
    return Response.json({ error: 'Evento inválido' }, { status: 400 });
  }

  const evento = {
    eventId: b.eventId,
    alumnoId: u.id, // sale de la sesión, nunca del cuerpo del pedido
    tipo: b.tipo,
    area: area.slug,
    areaNombre: area.nombre,
    nivel: b.nivel,
    totalNiveles: area.niveles.length,
    ...(situacion && { correcta: b.opcion === situacion.correcta }),
    ts: Date.now(),
  };
  // La clave es el alumno: todos sus eventos van a la misma partición y se procesan en orden.
  await (await productor()).send({ topic: TOPICO, messages: [{ key: u.id, value: JSON.stringify(evento) }] });
  return new Response(null, { status: 202 });
}
