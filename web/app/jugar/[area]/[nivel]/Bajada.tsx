'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import type { Aceptada, Rareza } from '@/lib/juegos/bajada';
import { enviar, useNivel } from './cliente';

const RAREZA: Record<Rareza, string> = { obvia: 'obvia', comun: 'común', rara: 'rara' };
const PLURAL: Record<Rareza, string> = { obvia: 'obvias', comun: 'comunes', rara: 'raras' };
type Aviso = { texto: string; tono: 'bien' | 'mal' };

function resumen(aceptadas: Aceptada[]) {
  const partes = (['obvia', 'comun', 'rara'] as Rareza[])
    .map((r) => [r, aceptadas.filter((a) => a.rareza === r).length] as const)
    .filter(([, n]) => n > 0)
    .map(([r, n]) => `${n} ${n === 1 ? RAREZA[r] : PLURAL[r]}`);
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}` : partes[0];
}

const Etiqueta = ({ rareza }: { rareza: Rareza }) => <span className={`etiqueta-rareza ${rareza}`}>{RAREZA[rareza]}</span>;

export function Bajada({ area, areaNombre, nivel, totalNiveles, titulo, consigna, ejemplo, noObvias, tamano, paraCompletar, inicial }: {
  area: string; areaNombre: string; nivel: number; totalNiveles: number; titulo: string; consigna: string; ejemplo: string;
  noObvias: number; tamano: number; paraCompletar: number;
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
      setAviso({ texto: `Esa ya la sumaste${data.texto ? ` («${data.texto}»)` : ''}.`, tono: 'mal' });
      return;
    }
    if (data.acierto === false) {
      setAviso({ texto: 'Esa no la tenemos en la lista. Probá con otra: no te resta.', tono: 'mal' });
      setTexto('');
      return;
    }
    if (Array.isArray(data.aceptadas)) setAceptadas(data.aceptadas as Aceptada[]);
    setTexto('');
    setAviso(data.rareza ? { texto: `Cuenta como «${data.texto}». Es una respuesta ${RAREZA[data.rareza as Rareza]}.`, tono: 'bien' } : null);
    if (data.completado) setFin(true);
  }

  const llenas = Math.min(aceptadas.length, paraCompletar);
  const hechas = Math.min(aceptadas.filter((a) => a.rareza !== 'obvia').length, noObvias);

  return (
    <section className="tarjeta juego juego-area tono-sistemas bajada">
      <p className="tenue">{areaNombre} · La bajada · Nivel {nivel} de {totalNiveles}: {titulo}</p>

      {fin ? (
        <>
          <h1>¡Nivel completado!</h1>
          <p className="tenue">{consigna}</p>
          <p>Juntaste {aceptadas.length} respuestas: {resumen(aceptadas)}.</p>
          <div className="acciones">
            {nivel < totalNiveles && <Link className="boton" href={`/jugar/${area}/${nivel + 1}`}>Siguiente nivel</Link>}
            <Link className="boton secundario" href="/jugar">Volver a la sala</Link>
          </div>
        </>
      ) : (
        <>
          <h1>{consigna}</h1>
          <p className="tenue">
            Escribí respuestas cortas, de a una. Según cuánta gente la dice, cada una que entra se marca
            como <Etiqueta rareza="obvia" /> <Etiqueta rareza="comun" /> o <Etiqueta rareza="rara" />. Hay {tamano} posibles,
            y si una no está en nuestra lista no te resta.
          </p>

          <div className="bajada-progreso">
            <span className="meta-segmentos" role="img" aria-label={`${llenas} de ${paraCompletar} respuestas`}>
              {Array.from({ length: paraCompletar }, (_, i) => <span key={i} className={i < llenas ? 'lleno' : undefined} />)}
            </span>
            <span>{aceptadas.length} de {paraCompletar}</span>
            {noObvias > 0 && (
              <span className={`requisito${hechas === noObvias ? ' hecho' : ''}`}>
                {hechas === noObvias ? '✓' : '○'}{' '}
                {noObvias === 1 ? 'Al menos una que no sea obvia' : `Al menos ${noObvias} que no sean obvias (${hechas} de ${noObvias})`}
              </span>
            )}
          </div>

          <form onSubmit={probar}>
            <div className="fila-juego">
              <input className="entrada bajada-input" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={`Por ejemplo: ${ejemplo}`} aria-label="Respuesta" autoComplete="off" />
              <button className="boton" disabled={ocupado}>Sumar</button>
            </div>
          </form>
          <p role="status" className={`aviso ${aviso?.tono ?? ''}`}>{aviso?.texto}</p>
        </>
      )}

      {aceptadas.length > 0 && (
        <>
          <h2>Tus respuestas</h2>
          <ul className="respuestas">
            {aceptadas.map((a) => (
              <li key={a.texto} className={`respuesta ${a.rareza}`}>{a.texto}<Etiqueta rareza={a.rareza} /></li>
            ))}
          </ul>
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
