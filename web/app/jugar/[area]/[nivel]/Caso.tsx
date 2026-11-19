'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { EstadoCaso, Ficha } from '@/lib/juegos/caso';
import { normalizar } from '@/lib/texto';
import { enviar, useNivel } from './cliente';

type Intento = EstadoCaso['intentos'][number];

const RESULTADO: Record<Ficha['resultado'], string> = { igual: 'Igual', cerca: 'Cerca', distinto: 'No coincide' };

function detalle(f: Ficha) {
  if (f.flecha === 'más') return `${RESULTADO[f.resultado]} · el correcto es más grave ↑`;
  if (f.flecha === 'menos') return `${RESULTADO[f.resultado]} · el correcto es menos grave ↓`;
  return RESULTADO[f.resultado];
}

// El alumno toca un diagnóstico de la lista y ve, dato por dato, en qué se parece al correcto.
export function Caso({ area, areaNombre, nivel, totalNiveles, titulo, catalogo, inicial }: {
  area: string; areaNombre: string; nivel: number; totalNiveles: number; titulo: string;
  catalogo: string[]; inicial: EstadoCaso;
}) {
  const salir = useNivel(area, nivel, inicial.completado);
  // El más reciente arriba. El servidor los guarda en orden de llegada.
  const [intentos, setIntentos] = useState<Intento[]>(() => [...inicial.intentos].reverse());
  const [aviso, setAviso] = useState('');
  const [fin, setFin] = useState(inicial.completado);
  const [probando, setProbando] = useState<string | null>(null);

  const probados = new Map(intentos.map((i) => [normalizar(i.nombre), i.acierto]));
  const correcto = intentos.find((i) => i.acierto)?.nombre;
  const cuantos = `${intentos.length} ${intentos.length === 1 ? 'intento' : 'intentos'}`;

  async function probar(respuesta: string) {
    if (probando || fin) return;
    setProbando(respuesta);
    const { data, error } = await enviar({ tipo: 'intento', area, nivel, respuesta });
    setProbando(null);
    if (error) {
      setAviso(error);
      return;
    }
    if (data.enCatalogo === false) {
      setAviso('Ese diagnóstico no está en la lista.');
      return;
    }
    setIntentos((prev) => [{ nombre: String(data.nombre), fichas: data.fichas as Ficha[], acierto: Boolean(data.acierto) }, ...prev]);
    setAviso('');
    if (data.completado) setFin(true);
  }

  return (
    <section className="tarjeta juego juego-area tono-medicina caso">
      <p className="tenue">{areaNombre} · El caso · Nivel {nivel} de {totalNiveles}: {titulo}</p>
      <div className="caso-tope">
        <h1>{fin ? '¡Diagnóstico correcto!' : '¿Qué tiene el paciente?'}</h1>
        <span className="contador">{fin ? cuantos : `Intento ${intentos.length + 1}`}</span>
      </div>

      {fin ? (
        <>
          <p>Era <strong>{correcto}</strong>. Lo encontraste en {cuantos}.</p>
          <div className="acciones">
            {nivel < totalNiveles && <Link className="boton" href={`/jugar/${area}/${nivel + 1}`}>Siguiente nivel</Link>}
            <Link className="boton secundario" href="/jugar">Volver a la sala</Link>
          </div>
        </>
      ) : (
        <>
          <div className="caso-ayuda">
            <p>
              El paciente tiene uno de los diagnósticos de abajo. Tocá uno para probarlo: te mostramos, dato por dato,
              en qué se parece al correcto. Con esas pistas descartá y volvé a probar. No hay límite de intentos.
            </p>
            <ul className="caso-leyenda">
              <li><i className="igual" /> <span><strong>Igual:</strong> ese dato coincide con el del diagnóstico correcto.</span></li>
              <li><i className="cerca" /> <span><strong>Cerca:</strong> se parece, por ejemplo una gravedad a un punto de distancia.</span></li>
              <li><i className="distinto" /> <span><strong>No coincide:</strong> por ahí no es.</span></li>
            </ul>
          </div>

          <h2>Diagnósticos posibles</h2>
          <div className="catalogo">
            {catalogo.map((nombre) => {
              const resultado = probados.get(normalizar(nombre));
              const ya = resultado !== undefined;
              return (
                <button
                  key={nombre}
                  type="button"
                  className={`diagnostico${resultado ? ' acierto' : ''}${probando === nombre ? ' probando' : ''}`}
                  disabled={ya || probando !== null}
                  aria-label={ya ? `${nombre}, ya probado` : `Probar ${nombre}`}
                  onClick={() => void probar(nombre)}
                >{nombre}</button>
              );
            })}
          </div>
          <p role="status" className="aviso mal">{aviso}</p>
        </>
      )}

      {intentos.length > 0 && (
        <>
          <h2>{fin ? 'Tu recorrido' : 'Tus intentos'}</h2>
          <div className="caso-historial">
            {intentos.map((intento, i) => (
              <article key={`${intento.nombre}-${intentos.length - i}`} className={`caso-carta${intento.acierto ? ' acierto' : ''}`}>
                <h3>{intento.nombre}{intento.acierto && ' ✓'}</h3>
                <div className="caso-fichas">
                  {intento.fichas.map((f) => (
                    <div key={f.nombre} className={`caso-ficha ${f.resultado}`}>
                      <span>{f.nombre}</span>
                      <strong>{f.nombre === 'Gravedad' ? `${f.valor} de 5` : f.valor}</strong>
                      <small>{detalle(f)}</small>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {!fin && (
        <div className="acciones">
          <button type="button" className="boton secundario" onClick={salir}>Salir del nivel</button>
        </div>
      )}
    </section>
  );
}
