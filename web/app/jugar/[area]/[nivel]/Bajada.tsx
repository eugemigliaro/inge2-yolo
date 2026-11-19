'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import type { Aceptada, Rareza } from '@/lib/juegos/bajada';
import { enviar, useNivel } from './cliente';

const RAREZA: Record<Rareza, string> = { obvia: 'obvia', comun: 'común', rara: 'rara' };
type Aviso = { texto: string; tono: 'bien' | 'mal' };

export function Bajada({ area, areaNombre, nivel, totalNiveles, consigna, exige, tamano, paraCompletar, inicial }: {
  area: string; areaNombre: string; nivel: number; totalNiveles: number; consigna: string;
  exige: Rareza | null; tamano: number; paraCompletar: number;
  inicial: { completado: boolean; aceptadas: Aceptada[] };
}) {
  const salir = useNivel(area, nivel, inicial.completado);
  const [texto, setTexto] = useState('');
  const [aceptadas, setAceptadas] = useState(inicial.aceptadas);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [fin, setFin] = useState(inicial.completado);
  const [ocupado, setOcupado] = useState(false);

  async function probar(e: FormEvent) {
    e.preventDefault();
    if (ocupado || fin || !texto.trim()) return;
    setOcupado(true);
    const { data, error } = await enviar({ tipo: 'intento', area, nivel, respuesta: texto });
    setOcupado(false);
    if (error) {
      setAviso({ texto: error, tono: 'mal' });
      return;
    }
    if (data.repetida) {
      setAviso({ texto: 'Esa ya la dijiste.', tono: 'mal' });
      return;
    }
    if (data.acierto === false) {
      setAviso({ texto: 'No está en el banco. Podés seguir intentando.', tono: 'mal' });
      setTexto('');
      return;
    }
    if (Array.isArray(data.aceptadas)) setAceptadas(data.aceptadas as Aceptada[]);
    setTexto('');
    setAviso(data.rareza ? { texto: `Cuenta. Es una respuesta ${RAREZA[data.rareza as Rareza]}.`, tono: 'bien' } : null);
    if (data.completado) setFin(true);
  }

  const falta = exige === 'rara' ? 'Al menos una tiene que ser rara.' : exige === 'comun' ? 'Al menos una tiene que ser común.' : 'Alcanza con tres, aunque sean obvias.';
  const huecos = Math.max(paraCompletar, aceptadas.length);

  return (
    <section className="tarjeta juego bajada">
      <p className="tenue">{areaNombre} · La bajada · Nivel {nivel} de {totalNiveles}</p>
      <h1>{consigna}</h1>
      <p className="bajada-banco">
        {fin ? <strong className="logrado">Completaste el nivel.</strong> : `Llevás ${aceptadas.length} de ${paraCompletar}. ${falta}`}
        {' '}El banco tiene {tamano} respuestas.
      </p>
      <div className="bajada-slots" aria-label="Respuestas aceptadas">
        {Array.from({ length: huecos }, (_, i) => {
          const a = aceptadas[i];
          return (
            <div key={i} className={a ? `slot ${a.rareza}` : 'slot vacio'}>
              {a ? <><strong>{a.texto}</strong><span>{RAREZA[a.rareza]}</span></> : <span>Respuesta {i + 1}</span>}
            </div>
          );
        })}
      </div>
      {fin ? (
        <div className="acciones">
          {nivel < totalNiveles && <Link className="boton" href={`/jugar/${area}/${nivel + 1}`}>Siguiente nivel</Link>}
          <Link className="boton secundario" href="/jugar">Volver a la sala</Link>
        </div>
      ) : (
        <form onSubmit={probar}>
          <div className="fila-juego">
            <input className="entrada bajada-input" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí cualquiera que entre" aria-label="Respuesta" autoComplete="off" />
            <button className="boton" disabled={ocupado}>Sumar</button>
          </div>
          {aviso && <p role="status" className={`aviso ${aviso.tono}`}>{aviso.texto}</p>}
          <div className="acciones">
            <button type="button" className="boton secundario" onClick={salir}>Salir del nivel</button>
          </div>
        </form>
      )}
    </section>
  );
}
