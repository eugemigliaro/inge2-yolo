// Lógica pura de los dos consumidores, separada para poder probarla sin Kafka ni Postgres.
import type { EventoJuego } from './comun.ts';

// ---- Proyector: tiempo efectivo y sesiones (event stream processing) ----

export const INACTIVIDAD_MS = 2 * 60_000; // un hueco mayor dentro de un nivel no cuenta como juego
export const NUEVA_SESION_MS = 30 * 60_000;
const DENTRO_DE_NIVEL = new Set(['nivel_iniciado', 'decision']);

export type Estado = { ultimoTs: number; ultimoTipo: string; ultimaArea: string; sesiones: number };

// El tiempo entre dos eventos se cuenta solo si el alumno estaba dentro de un nivel y no se fue.
export function tiempoEfectivo(prev: Estado | undefined, ts: number): { area: string; ms: number } | null {
  if (!prev || !DENTRO_DE_NIVEL.has(prev.ultimoTipo)) return null;
  const hueco = ts - prev.ultimoTs;
  if (hueco <= 0 || hueco > INACTIVIDAD_MS) return null;
  return { area: prev.ultimaArea, ms: hueco };
}

export function siguienteEstado(prev: Estado | undefined, ev: EventoJuego): Estado {
  if (prev && ev.ts < prev.ultimoTs) return prev; // evento atrasado (reintento): no mueve el reloj hacia atrás
  const nueva = !prev || ev.ts - prev.ultimoTs > NUEVA_SESION_MS;
  return { ultimoTs: ev.ts, ultimoTipo: ev.tipo, ultimaArea: ev.area, sesiones: (prev?.sesiones ?? 0) + (nueva ? 1 : 0) };
}

export const dia = (ts: number) => new Date(ts).toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });

// ---- Alertas ----

// Interés (un solo evento): completó el último nivel de un área.
export const descubrioInteres = (ev: EventoJuego) => ev.tipo === 'nivel_completado' && ev.nivel === ev.totalNiveles;

// Frustración (patrón sobre varios eventos): 3 abandonos seguidos, sin completar nada en el medio, dentro de 1 minuto.
export const VENTANA_FRUSTRACION_MS = 60_000;

export function detectarFrustracion(abandonos: number[], ev: EventoJuego): { abandonos: number[]; frustrado: boolean } {
  if (ev.tipo === 'nivel_completado') return { abandonos: [], frustrado: false };
  if (ev.tipo !== 'nivel_abandonado') return { abandonos, frustrado: false };
  const recientes = [...abandonos, ev.ts].filter((t) => ev.ts - t < VENTANA_FRUSTRACION_MS).slice(-3);
  return recientes.length === 3 ? { abandonos: [], frustrado: true } : { abandonos: recientes, frustrado: false };
}
