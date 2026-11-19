import { NIVELES as CASOS, estadoCaso, nuevosEn, opcionesDe, type EstadoCaso } from './juegos/caso';
import { NIVELES as BAJADAS, PARA_COMPLETAR, estadoBajada, type EstadoBajada } from './juegos/bajada';
import { NIVELES as TABLEROS, estadoTablero, vistaTablero, type EstadoTablero } from './juegos/tablero';

export type JuegoId = 'caso' | 'bajada' | 'tablero';
export type Area = { slug: string; nombre: string; juego: string; juegoId: JuegoId; descripcion: string; niveles: { titulo: string }[] };

export const AREAS: Area[] = [
  {
    slug: 'medicina', nombre: 'Medicina', juego: 'El caso', juegoId: 'caso',
    descripcion: 'Adiviná el diagnóstico del paciente. Cada intento te muestra en qué se parece al correcto, y cada nivel trae más opciones y más parecidas.',
    niveles: CASOS.map((n) => ({ titulo: n.titulo })),
  },
  {
    slug: 'sistemas', nombre: 'Sistemas', juego: 'La bajada', juegoId: 'bajada',
    descripcion: 'La consigna admite un banco enorme de respuestas. Alcanzan tres. No hay reloj.',
    niveles: BAJADAS.map((n) => ({ titulo: n.consigna.replace(/\.$/, '') })),
  },
  {
    slug: 'derecho', nombre: 'Derecho', juego: 'El tablero', juegoId: 'tablero',
    descripcion: 'Llevá cada situación a la rama del derecho que le toca. Cada nivel es más difícil que el anterior.',
    niveles: TABLEROS.map((n) => ({ titulo: n.titulo })),
  },
];

export const area = (slug: string) => AREAS.find((a) => a.slug === slug);

export type EstadoPartida = EstadoCaso | EstadoBajada | EstadoTablero;

export function estadoInicial(juego: JuegoId): EstadoPartida {
  if (juego === 'caso') return estadoCaso();
  if (juego === 'bajada') return estadoBajada();
  return estadoTablero();
}

export function vistaNivel(slug: string, nivel: number) {
  const a = area(slug);
  if (!a || nivel < 1 || nivel > a.niveles.length) return null;
  if (a.juegoId === 'caso') return { juego: 'caso' as const, catalogo: opcionesDe(nivel).map((d) => d.nombre), nuevos: nuevosEn(nivel) };
  if (a.juegoId === 'bajada') {
    const nivelBajada = BAJADAS[nivel - 1];
    return { juego: 'bajada' as const, consigna: nivelBajada.consigna, exige: nivelBajada.exige ?? null, tamano: nivelBajada.banco.length, paraCompletar: PARA_COMPLETAR };
  }
  return { juego: 'tablero' as const, ...vistaTablero(nivel) };
}
