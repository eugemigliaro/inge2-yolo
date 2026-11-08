// Lógica pura de los dos consumidores, separada para poder probarla sin Kafka ni Postgres.
import type { EventoJuego } from './comun.ts';

// ---- Proyector: tiempo efectivo y sesiones (event stream processing) ----

export const INACTIVIDAD_MS = 2 * 60_000;
export const NUEVA_SESION_MS = 30 * 60_000;
const DENTRO_DE_NIVEL = new Set(['nivel_iniciado', 'intento']);

export type Estado = { ultimoTs: number; ultimoTipo: string; ultimaArea: string; sesiones: number };

export function tiempoEfectivo(prev: Estado | undefined, ts: number): { area: string; ms: number } | null {
  if (!prev || !DENTRO_DE_NIVEL.has(prev.ultimoTipo)) return null;
  const hueco = ts - prev.ultimoTs;
  if (hueco <= 0 || hueco > INACTIVIDAD_MS) return null;
  return { area: prev.ultimaArea, ms: hueco };
}

export function siguienteEstado(prev: Estado | undefined, ev: EventoJuego): Estado {
  if (prev && ev.ts < prev.ultimoTs) return prev;
  const nueva = !prev || ev.ts - prev.ultimoTs > NUEVA_SESION_MS;
  return { ultimoTs: ev.ts, ultimoTipo: ev.tipo, ultimaArea: ev.area, sesiones: (prev?.sesiones ?? 0) + (nueva ? 1 : 0) };
}

export function deltaRecorrido(prev: Estado | undefined, ev: EventoJuego) {
  return {
    estado: siguienteEstado(prev, ev),
    tiempo: tiempoEfectivo(prev, ev.ts),
    intentos: ev.tipo === 'intento' ? 1 : 0,
    aciertos: ev.tipo === 'intento' && ev.acierto ? 1 : 0,
    completados: ev.tipo === 'nivel_completado' ? 1 : 0,
    abandonos: ev.tipo === 'nivel_abandonado' ? 1 : 0,
    nivel: ev.tipo === 'nivel_completado' ? ev.nivel : 0,
  };
}

export const dia = (ts: number) => new Date(ts).toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });

// ---- Alertas: se calculan solo con el log, en orden ----

type AreaAlerta = { niveles: number[]; avisado: boolean };
type Visita = { salidas: number; conIntento: boolean };
export type EstadoAlertas = { areas: Record<string, AreaAlerta>; visitas: Record<string, Visita> };

export const estadoAlertasVacio = (): EstadoAlertas => ({ areas: {}, visitas: {} });

const vacia = (): AreaAlerta => ({ niveles: [], avisado: false });
const visitaVacia = (): Visita => ({ salidas: 0, conIntento: false });

export function aplicarEventoAlerta(prev: EstadoAlertas, ev: EventoJuego): { estado: EstadoAlertas; interes: boolean; frustracion: boolean } {
  const areas = structuredClone(prev.areas);
  const visitas = structuredClone(prev.visitas ?? {});
  const clave = `${ev.area}:${ev.nivel}`;
  let interes = false;
  let frustracion = false;

  if (ev.tipo === 'intento') {
    const v = visitas[clave] ?? visitaVacia();
    v.conIntento = true;
    visitas[clave] = v;
  }
  if (ev.tipo === 'nivel_completado') {
    const a = areas[ev.area] ?? vacia();
    a.niveles = [...a.niveles, ev.nivel];
    delete visitas[clave];
    if (!a.avisado && new Set(a.niveles).size >= 2) {
      a.avisado = true;
      interes = true;
    }
    areas[ev.area] = a;
  }
  if (ev.tipo === 'nivel_abandonado') {
    const v = visitas[clave] ?? visitaVacia();
    if (v.conIntento) v.salidas += 1;
    v.conIntento = false;
    if (v.salidas >= 2) {
      frustracion = true;
      v.salidas = 0;
    }
    visitas[clave] = v;
  }
  return { estado: { areas, visitas }, interes, frustracion };
}
