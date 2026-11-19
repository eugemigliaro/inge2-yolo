// Chequea el contenido de los tres juegos. Correr con `cd web && bun test` después de tocar niveles.
import { describe, expect, test } from 'bun:test';
import { NIVELES as BAJADAS, buscar, claves, estadoBajada, intentarBajada, mostrar } from './bajada';
import { CATALOGO, NIVELES as CASOS, opcionesDe, secretoDe } from './caso';
import { ESTANTES, NIVELES as TABLEROS } from './tablero';

describe('El caso', () => {
  test('los ids del catálogo no se repiten', () => {
    expect(new Set(CATALOGO.map((d) => d.id)).size).toBe(CATALOGO.length);
  });

  CASOS.forEach((n, i) => {
    const nivel = i + 1;
    test(`nivel ${nivel}: el diagnóstico escondido está en la lista y se puede deducir`, () => {
      for (const id of n.opciones) expect(CATALOGO.some((d) => d.id === id)).toBe(true);
      expect(new Set(n.opciones).size).toBe(n.opciones.length);
      expect(n.opciones).toContain(n.secreto);
      // Ninguna otra opción comparte las cuatro fichas con el escondido.
      const clave = (d: (typeof CATALOGO)[number]) => [d.sistema, d.urgencia, d.edad, d.lugar].join('|');
      const secreto = secretoDe(nivel)!;
      const gemelos = opcionesDe(nivel).filter((d) => d.id !== secreto.id && clave(d) === clave(secreto));
      expect(gemelos.map((d) => d.id)).toEqual([]);
    });
  });
});

describe('El tablero', () => {
  test('los ids de las situaciones no se repiten entre niveles', () => {
    const ids = TABLEROS.flatMap((n) => n.situaciones.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  TABLEROS.forEach((n, i) => {
    test(`nivel ${i + 1}: cada situación va a un estante que existe en el nivel`, () => {
      for (const e of n.estantes) expect(ESTANTES.some((x) => x.id === e)).toBe(true);
      for (const s of n.situaciones) expect(n.estantes).toContain(s.estante);
    });
  });
});

describe('La bajada', () => {
  BAJADAS.forEach((n, i) => {
    const nivel = i + 1;
    test(`nivel ${nivel}: cada variante encuentra su propia respuesta y ninguna choca con otra`, () => {
      const vistas = new Map<string, string>();
      for (const e of n.banco) {
        for (const v of e.texto.split('|')) {
          const k = claves(v).join(' ');
          expect(k).not.toBe('');
          const otra = vistas.get(k);
          if (otra) expect(otra).toBe(e.texto);
          vistas.set(k, e.texto);
          expect(buscar(n.banco, v)).toBe(e);
        }
      }
    });

    test(`nivel ${nivel}: se completa sin raras y, si pide no obvias, no alcanza con obvias`, () => {
      const k = n.noObvias ?? 0;
      const obvias = n.banco.filter((e) => e.rareza === 'obvia');
      const comunes = n.banco.filter((e) => e.rareza === 'comun');
      let estado = estadoBajada();
      for (const e of [...obvias.slice(0, n.meta - k), ...comunes.slice(0, k)]) {
        estado = intentarBajada(nivel, mostrar(e), estado).estado;
      }
      expect(estado.completado).toBe(true);
      if (k > 0) {
        let soloObvias = estadoBajada();
        for (const e of obvias) soloObvias = intentarBajada(nivel, mostrar(e), soloObvias).estado;
        expect(soloObvias.completado).toBe(false);
      }
    });
  });
});
