'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Aceptada, Rareza } from '@/lib/juegos/bajada';
import { enviar } from './cliente';

const RAREZA: Record<Rareza, string> = { obvia: 'obvia', comun: 'común', rara: 'rara' };

export function Bajada({ area, areaNombre, nivel, totalNiveles, consigna, exige, tamano, paraCompletar, inicial }: {
  area: string; areaNombre: string; nivel: number; totalNiveles: number; consigna: string;
  exige: Rareza | null; tamano: number; paraCompletar: number;
  inicial: { completado: boolean; aceptadas: Aceptada[] };
}) {
  const router = useRouter();
  const iniciado = useRef(false);
  const [texto, setTexto] = useState('');
  const [aceptadas, setAceptadas] = useState(inicial.aceptadas);
  const [aviso, setAviso] = useState('');
  const [fin, setFin] = useState(inicial.completado);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    void enviar({ tipo: 'nivel_iniciado', area, nivel });
  }, [area, nivel]);

  async function probar(e: FormEvent) {
    e.preventDefault();
    if (ocupado || fin || !texto.trim()) return;
    setOcupado(true);
    const { data } = await enviar({ tipo: 'intento', area, nivel, respuesta: texto });
    setOcupado(false);
    if (data.repetida) {
      setAviso('Esa ya la dijiste.');
      return;
    }
    if (data.acierto === false) {
      setAviso('No está en el banco. Podés seguir intentando.');
      setTexto('');
      return;
    }
    if (Array.isArray(data.aceptadas)) setAceptadas(data.aceptadas as Aceptada[]);
    setTexto('');
    setAviso(data.rareza ? `Cuenta. Es una respuesta ${RAREZA[data.rareza as Rareza]}.` : '');
    if (data.completado) setFin(true);
  }

  async function abandonar() {
    await enviar({ tipo: 'nivel_abandonado', area, nivel });
    router.push('/jugar');
  }

  const falta = exige === 'rara' ? 'Al menos una tiene que ser rara.' : exige === 'comun' ? 'Al menos una tiene que ser común.' : 'Alcanza con tres, aunque sean obvias.';
  const huecos = Math.max(paraCompletar, aceptadas.length);

  return (
    <section className="tarjeta juego bajada">
      <p className="tenue">{areaNombre} · La bajada · Nivel {nivel} de {totalNiveles}</p>
      <h1>{consigna}</h1>
      <p className="bajada-banco">El banco tiene {tamano} respuestas. {fin ? 'Listo.' : `Llevás ${aceptadas.length} de ${paraCompletar}. ${falta}`}</p>
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
            <input className="bajada-input" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí cualquiera que entre" autoComplete="off" />
            <button className="boton" disabled={ocupado}>Sumar</button>
          </div>
          {aviso && <p role="status">{aviso}</p>}
          <div className="acciones">
            <button type="button" className="boton secundario" onClick={abandonar}>Salir del nivel</button>
          </div>
        </form>
      )}
    </section>
  );
}
