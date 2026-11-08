import type { EventoJuego } from './comun.ts';

const JUANA = '11111111-1111-4111-8111-111111111111';
const DIA = 86_400_000;

// Dos semanas de juego. Medicina cumple interés: completa dos niveles distintos.
// Sistemas y Derecho se abandonan con un solo fallo: no hay frustración.
export function historialJuana(ahora: number): EventoJuego[] {
  const eventos: EventoJuego[] = [];
  let n = 0;
  const push = (
    dias: number, area: string, areaNombre: string, nivel: number, tipo: EventoJuego['tipo'], offset: number,
    extra: Partial<EventoJuego> = {},
  ) => {
    eventos.push({
      eventId: `seed-juana-${n++}`, alumnoId: JUANA, area, areaNombre, nivel, totalNiveles: 3,
      tipo, ts: ahora - dias * DIA + offset, ...extra,
    });
  };

  push(13, 'medicina', 'Medicina', 1, 'nivel_iniciado', 0);
  push(13, 'medicina', 'Medicina', 1, 'intento', 50_000, { acierto: false, cerca: true });
  push(13, 'medicina', 'Medicina', 1, 'intento', 100_000, { acierto: true });
  push(13, 'medicina', 'Medicina', 1, 'nivel_completado', 110_000);

  push(8, 'sistemas', 'Sistemas', 1, 'nivel_iniciado', 0);
  push(8, 'sistemas', 'Sistemas', 1, 'intento', 30_000, { acierto: true, rareza: 'obvia' });
  push(8, 'sistemas', 'Sistemas', 1, 'intento', 60_000, { acierto: false });
  push(8, 'sistemas', 'Sistemas', 1, 'nivel_abandonado', 90_000);

  push(6, 'medicina', 'Medicina', 2, 'nivel_iniciado', 0);
  push(6, 'medicina', 'Medicina', 2, 'intento', 40_000, { acierto: false, cerca: true });
  push(6, 'medicina', 'Medicina', 2, 'intento', 80_000, { acierto: false, cerca: false });
  push(6, 'medicina', 'Medicina', 2, 'intento', 120_000, { acierto: true });
  push(6, 'medicina', 'Medicina', 2, 'nivel_completado', 130_000);

  push(4, 'derecho', 'Derecho', 1, 'nivel_iniciado', 0);
  push(4, 'derecho', 'Derecho', 1, 'intento', 20_000, { acierto: false });
  push(4, 'derecho', 'Derecho', 1, 'nivel_abandonado', 40_000);

  return eventos;
}
