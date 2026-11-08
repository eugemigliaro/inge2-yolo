import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { EventoJuego } from './comun.ts';
import { historialJuana } from './historial-juana.ts';
import {
  aplicarEventoAlerta, deltaRecorrido, dia, estadoAlertasVacio, siguienteEstado, tiempoEfectivo, type Estado,
} from './reglas.ts';

const ev = (tipo: EventoJuego['tipo'], ts: number, extra: Partial<EventoJuego> = {}): EventoJuego =>
  ({ eventId: `e${ts}-${tipo}`, alumnoId: 'a', tipo, area: 'medicina', areaNombre: 'Medicina', nivel: 1, totalNiveles: 3, ts, ...extra });

const intento = (ts: number, nivel = 1) => ev('intento', ts, { acierto: false, nivel });

test('cuenta el tiempo dentro de un nivel y descuenta la inactividad', () => {
  let s = siguienteEstado(undefined, ev('nivel_iniciado', 0));
  assert.deepEqual(tiempoEfectivo(s, 40_000), { area: 'medicina', ms: 40_000 });
  assert.equal(tiempoEfectivo(s, 10 * 60_000), null);
  s = siguienteEstado(s, ev('nivel_completado', 40_000));
  assert.equal(tiempoEfectivo(s, 60_000), null);
});

test('un evento atrasado no suma tiempo ni mueve el reloj', () => {
  const s = siguienteEstado(undefined, ev('nivel_iniciado', 50_000));
  assert.equal(tiempoEfectivo(s, 20_000), null);
  assert.equal(siguienteEstado(s, ev('intento', 20_000, { acierto: false })), s);
});

test('cuenta una sesión nueva después de 30 minutos sin eventos', () => {
  let s = siguienteEstado(undefined, ev('nivel_iniciado', 0));
  s = siguienteEstado(s, ev('intento', 60_000, { acierto: true }));
  assert.equal(s.sesiones, 1);
  s = siguienteEstado(s, ev('nivel_iniciado', 60_000 + 31 * 60_000));
  assert.equal(s.sesiones, 2);
});

function jugar(eventos: EventoJuego[]) {
  let alertas = estadoAlertasVacio();
  let reloj: Estado | undefined;
  const areas: Record<string, { tiempo: number; intentos: number; aciertos: number; completados: number; abandonos: number; nivel: number }> = {};
  const dias = new Set<string>();
  const avisos: string[] = [];
  for (const evento of eventos) {
    const d = deltaRecorrido(reloj, evento);
    reloj = d.estado;
    const area = areas[evento.area] ??= { tiempo: 0, intentos: 0, aciertos: 0, completados: 0, abandonos: 0, nivel: 0 };
    if (d.tiempo) {
      const destino = areas[d.tiempo.area] ??= { tiempo: 0, intentos: 0, aciertos: 0, completados: 0, abandonos: 0, nivel: 0 };
      destino.tiempo += d.tiempo.ms;
      dias.add(`${dia(evento.ts)}:${d.tiempo.area}`);
    }
    area.intentos += d.intentos;
    area.aciertos += d.aciertos;
    area.completados += d.completados;
    area.abandonos += d.abandonos;
    area.nivel = Math.max(area.nivel, d.nivel);
    const a = aplicarEventoAlerta(alertas, evento);
    alertas = a.estado;
    if (a.interes) avisos.push(`interes:${evento.area}`);
    if (a.frustracion) avisos.push(`frustracion:${evento.area}`);
  }
  return { areas, sesiones: reloj?.sesiones ?? 0, dias: dias.size, avisos };
}

test('interés: dos niveles distintos de la misma área, aunque sea en la misma sesión', () => {
  const base = 1_700_000_000_000;
  const dosNiveles = jugar([
    ev('nivel_completado', base, { nivel: 1 }),
    ev('nivel_completado', base + 5_000, { nivel: 2 }),
  ]);
  assert.deepEqual(dosNiveles.avisos, ['interes:medicina']);
  assert.deepEqual(jugar([
    ev('nivel_completado', base, { nivel: 1 }),
    ev('nivel_completado', base + 5_000, { nivel: 1 }),
  ]).avisos, []);
  assert.deepEqual(jugar([ev('nivel_completado', base, { nivel: 3 })]).avisos, []);
});

test('frustración: dos salidas del mismo nivel, cada una con un intento previo', () => {
  const base = 1_700_000_000_000;
  const salida = (desde: number, nivel: number) => [
    intento(desde, nivel),
    ev('nivel_abandonado', desde + 5_000, { nivel }),
  ];
  assert.deepEqual(jugar([...salida(base, 1), ...salida(base + 20_000, 1)]).avisos, ['frustracion:medicina']);
  assert.deepEqual(jugar([...salida(base, 1)]).avisos, []);
  assert.deepEqual(jugar([...salida(base, 1), ...salida(base + 20_000, 2)]).avisos, []);
  assert.deepEqual(jugar([
    ev('nivel_abandonado', base),
    ev('nivel_abandonado', base + 5_000),
  ]).avisos, []);
});

test('completar el nivel corta la racha y un acierto también cuenta como intento', () => {
  const base = 1_700_000_000_000;
  const cortada = jugar([
    intento(base),
    ev('nivel_abandonado', base + 5_000),
    ev('nivel_completado', base + 10_000),
    intento(base + 15_000),
    ev('nivel_abandonado', base + 20_000),
  ]);
  assert.deepEqual(cortada.avisos, []);
  assert.deepEqual(jugar([
    ev('intento', base, { acierto: true }),
    ev('nivel_abandonado', base + 5_000),
    ev('intento', base + 10_000, { acierto: true }),
    ev('nivel_abandonado', base + 15_000),
  ]).avisos, ['frustracion:medicina']);
});

test('el historial de Juana deja un interés en Medicina y los números del dashboard', () => {
  const ahora = new Date('2026-11-08T18:00:00-03:00').getTime();
  const r = jugar(historialJuana(ahora));
  assert.deepEqual(r.avisos, ['interes:medicina']);
  assert.equal(r.sesiones, 4);
  assert.equal(r.dias, 4);
  assert.equal(r.areas.medicina.tiempo, 240_000);
  assert.equal(r.areas.medicina.nivel, 2);
  assert.equal(r.areas.medicina.intentos, 5);
  assert.equal(r.areas.medicina.aciertos, 2);
  assert.equal(r.areas.medicina.abandonos, 0);
  assert.equal(r.areas.sistemas.tiempo, 90_000);
  assert.equal(r.areas.sistemas.nivel, 0);
  assert.equal(r.areas.sistemas.intentos, 2);
  assert.equal(r.areas.sistemas.aciertos, 1);
  assert.equal(r.areas.sistemas.abandonos, 1);
  assert.equal(r.areas.derecho.tiempo, 40_000);
  assert.equal(r.areas.derecho.intentos, 1);
  assert.equal(r.areas.derecho.aciertos, 0);
  assert.equal(r.areas.derecho.abandonos, 1);
});
