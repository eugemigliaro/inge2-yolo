'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Ficha } from '@/lib/juegos/caso';
import { normalizar } from '@/lib/texto';
import { enviar } from './cliente';

type Intento = { nombre: string; fichas: Ficha[]; acierto: boolean };

const TIPS: Record<string, { texto: string; flechas?: boolean }> = {
  Sistema: { texto: 'El aparato del cuerpo. Verde si es el mismo que el del cuadro escondido.' },
  Urgencia: {
    texto: 'De 1, la más leve, a 5, la más grave. Amarillo si difiere en uno.',
    flechas: true,
  },
  Edad: { texto: 'Amarillo si la ficha es Adulto y el cuadro es Mayor, o al revés. El resto coincide o no.' },
  Dónde: { texto: 'Amarillo si la ficha es Guardia y el cuadro es Quirófano, o al revés.' },
};

export function Caso({ area, areaNombre, nivel, totalNiveles, titulo, catalogo, inicial }: {
  area: string; areaNombre: string; nivel: number; totalNiveles: number; titulo: string;
  catalogo: string[]; inicial: Intento[];
}) {
  const router = useRouter();
  const iniciado = useRef(false);
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [intentos, setIntentos] = useState<Intento[]>(inicial);
  const [aviso, setAviso] = useState('');
  const [fin, setFin] = useState(inicial.some((i) => i.acierto));
  const [ocupado, setOcupado] = useState(false);
  const [pista, setPista] = useState('Urgencia');

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    void enviar({ tipo: 'nivel_iniciado', area, nivel });
  }, [area, nivel]);

  const ideas = texto.trim().length === 0 ? [] : catalogo.filter((nombre) => {
    const clave = normalizar(nombre);
    return clave.includes(normalizar(texto)) && !intentos.some((i) => normalizar(i.nombre) === clave);
  }).slice(0, 6);

  async function probar(respuesta: string) {
    if (ocupado || fin || !respuesta.trim()) return;
    setOcupado(true);
    setAbierto(false);
    const { data } = await enviar({ tipo: 'intento', area, nivel, respuesta });
    setOcupado(false);
    if (data.enCatalogo === false) {
      setAviso('Ese diagnóstico no está en el catálogo. No gasta un intento.');
      return;
    }
    if (data.fichas) {
      setIntentos((prev) => [{ nombre: respuesta.trim(), fichas: data.fichas as Ficha[], acierto: Boolean(data.acierto) }, ...prev]);
      setTexto('');
      setAviso('');
      const fichas = data.fichas as Ficha[];
      setPista(fichas.find((f) => f.resultado !== 'igual')?.nombre ?? 'Urgencia');
    }
    if (data.completado) setFin(true);
  }

  function enviarFormulario(e: FormEvent) {
    e.preventDefault();
    void probar(texto);
  }

  async function abandonar() {
    await enviar({ tipo: 'nivel_abandonado', area, nivel });
    router.push('/jugar');
  }

  const tip = TIPS[pista] ?? TIPS.Urgencia;

  return (
    <section className="caso-spot">
      <p className="caso-meta">{areaNombre} · El caso · Nivel {nivel}: {titulo}</p>
      <div className="caso-tope">
        <h1>{fin ? 'Encontraste el cuadro' : '¿Qué cuadro es?'}</h1>
        <p>Intento {fin ? intentos.length : intentos.length + 1}</p>
      </div>
      {fin ? (
        <div className="acciones">
          {nivel < totalNiveles && <Link className="boton" href={`/jugar/${area}/${nivel + 1}`}>Siguiente nivel</Link>}
          <Link className="boton secundario" href="/jugar">Volver a la sala</Link>
        </div>
      ) : (
        <form className="caso-buscar" onSubmit={enviarFormulario} autoComplete="off">
          <input
            value={texto}
            onChange={(e) => { setTexto(e.target.value); setAbierto(true); setAviso(''); }}
            onFocus={() => setAbierto(true)}
            placeholder="Escribí un diagnóstico"
            aria-label="Diagnóstico"
          />
          <button className="caso-lupa" disabled={ocupado} aria-label="Probar">⌕</button>
          {abierto && ideas.length > 0 && (
            <ul className="caso-ideas">
              {ideas.map((nombre) => (
                <li key={nombre}>
                  <button type="button" onClick={() => void probar(nombre)}>{nombre}</button>
                </li>
              ))}
            </ul>
          )}
        </form>
      )}
      {aviso && <p className="caso-aviso" role="status">{aviso}</p>}
      <div className="caso-historial">
        {intentos.map((intento, i) => (
          <article key={`${intento.nombre}-${i}`} className="caso-carta">
            <h2>{intento.nombre}</h2>
            <div className="caso-fichas">
              {intento.fichas.map((f) => (
                <button
                  key={f.nombre}
                  type="button"
                  className={`caso-ficha ${f.resultado} ${pista === f.nombre ? 'activa' : ''}`}
                  onClick={() => setPista(f.nombre)}
                >
                  <span>{f.nombre}</span>
                  <strong>{f.valor}{f.flecha === 'más' ? ' ↑' : f.flecha === 'menos' ? ' ↓' : ''}</strong>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      <ul className="caso-leyenda">
        <li><i className="distinto" /> No coincide</li>
        <li><i className="cerca" /> Cerca</li>
        <li><i className="igual" /> Igual</li>
      </ul>
      <aside className="caso-tip">
        <p>Pista · <strong>{pista}</strong></p>
        <p>{tip.texto}</p>
        {tip.flechas && (
          <p className="caso-flechas">↑ el cuadro escondido es más grave.<br />↓ el cuadro escondido es menos grave.</p>
        )}
      </aside>
      {!fin && (
        <div className="acciones">
          <button type="button" className="boton secundario" onClick={abandonar}>Salir del nivel</button>
        </div>
      )}
    </section>
  );
}
