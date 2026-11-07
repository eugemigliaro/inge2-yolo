import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { EventoJuego } from './comun.ts';
import { detectarFrustracion, descubrioInteres, siguienteEstado, tiempoEfectivo } from './reglas.ts';

const ev = (tipo: EventoJuego['tipo'], ts: number, nivel = 1): EventoJuego =>
  ({ eventId: `e${ts}`, alumnoId: 'a', tipo, area: 'medicina', areaNombre: 'Medicina', nivel, totalNiveles: 3, ts });

test('cuenta el tiempo dentro de un nivel y descuenta la inactividad', () => {
  let s = siguienteEstado(undefined, ev('nivel_iniciado', 0));
  assert.deepEqual(tiempoEfectivo(s, 40_000), { area: 'medicina', ms: 40_000 });
  assert.equal(tiempoEfectivo(s, 10 * 60_000), null); // se fue 10 minutos
  s = siguienteEstado(s, ev('nivel_completado', 40_000));
  assert.equal(tiempoEfectivo(s, 60_000), null); // entre niveles no se juega
});

test('un evento atrasado no suma tiempo ni mueve el reloj', () => {
  const s = siguienteEstado(undefined, ev('nivel_iniciado', 50_000));
  assert.equal(tiempoEfectivo(s, 20_000), null);
  assert.equal(siguienteEstado(s, ev('decision', 20_000)), s);
});

test('cuenta una sesión nueva después de 30 minutos sin eventos', () => {
  let s = siguienteEstado(undefined, ev('nivel_iniciado', 0));
  s = siguienteEstado(s, ev('decision', 60_000));
  assert.equal(s.sesiones, 1);
  s = siguienteEstado(s, ev('nivel_iniciado', 60_000 + 31 * 60_000));
  assert.equal(s.sesiones, 2);
});

test('interés: solo al completar el último nivel', () => {
  assert.equal(descubrioInteres(ev('nivel_completado', 0, 2)), false);
  assert.equal(descubrioInteres(ev('nivel_completado', 0, 3)), true);
  assert.equal(descubrioInteres(ev('nivel_abandonado', 0, 3)), false);
});

test('frustración: 3 abandonos seguidos en menos de un minuto', () => {
  let r = detectarFrustracion([], ev('nivel_abandonado', 0));
  r = detectarFrustracion(r.abandonos, ev('nivel_abandonado', 20_000));
  assert.equal(r.frustrado, false);
  r = detectarFrustracion(r.abandonos, ev('nivel_abandonado', 50_000));
  assert.equal(r.frustrado, true);
  assert.deepEqual(r.abandonos, []); // no vuelve a dispararse con el cuarto
});

test('frustración: un nivel completado o la ventana vencida cortan la racha', () => {
  let r = detectarFrustracion([], ev('nivel_abandonado', 0));
  r = detectarFrustracion(r.abandonos, ev('nivel_abandonado', 10_000));
  r = detectarFrustracion(r.abandonos, ev('nivel_completado', 15_000));
  r = detectarFrustracion(r.abandonos, ev('nivel_abandonado', 20_000));
  assert.equal(r.frustrado, false);
  r = detectarFrustracion([0, 10_000], ev('nivel_abandonado', 70_000));
  assert.equal(r.frustrado, false);
});
