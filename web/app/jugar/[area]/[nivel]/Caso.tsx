'use client';
import Link from 'next/link';
import { useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { EstadoCaso, Ficha } from '@/lib/juegos/caso';
import { normalizar } from '@/lib/texto';
import { enviar, useNivel } from './cliente';

type Intento = EstadoCaso['intentos'][number];

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
  catalogo: string[]; inicial: EstadoCaso;
}) {
  const salir = useNivel(area, nivel, inicial.completado);
  const lista = useId();
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  // El más reciente arriba. El servidor los guarda en orden de llegada.
  const [intentos, setIntentos] = useState<Intento[]>(() => [...inicial.intentos].reverse());
  const [aviso, setAviso] = useState('');
  const [fin, setFin] = useState(inicial.completado);
  const [ocupado, setOcupado] = useState(false);
  const [pista, setPista] = useState('Urgencia');

  const ideas = texto.trim().length === 0 ? [] : catalogo.filter((nombre) => {
    const clave = normalizar(nombre);
    return clave.includes(normalizar(texto)) && !intentos.some((i) => normalizar(i.nombre) === clave);
  }).slice(0, 6);
  const mostrarIdeas = abierto && ideas.length > 0;

  async function probar(respuesta: string) {
    if (ocupado || fin || !respuesta.trim()) return;
    setOcupado(true);
    setAbierto(false);
    const { data, error } = await enviar({ tipo: 'intento', area, nivel, respuesta });
    setOcupado(false);
    if (error) {
      setAviso(error);
      return;
    }
    if (data.enCatalogo === false) {
      setAviso('Ese diagnóstico no está en el catálogo. No gasta un intento.');
      return;
    }
    const fichas = data.fichas as Ficha[];
    setIntentos((prev) => [{ nombre: String(data.nombre), fichas, acierto: Boolean(data.acierto) }, ...prev]);
    setTexto('');
    setAviso('');
    setPista(fichas.find((f) => f.resultado !== 'igual')?.nombre ?? 'Urgencia');
    if (data.completado) setFin(true);
  }

  function enviarFormulario(e: FormEvent) {
    e.preventDefault();
    void probar(activa >= 0 && mostrarIdeas ? ideas[activa] : texto);
  }

  function teclas(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setAbierto(false);
      setActiva(-1);
      return;
    }
    if (!ideas.length || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    setAbierto(true);
    setActiva((i) => (e.key === 'ArrowDown' ? (i + 1) % ideas.length : (i <= 0 ? ideas.length : i) - 1));
  }

  const tip = TIPS[pista] ?? TIPS.Urgencia;

  return (
    <section className="caso-spot">
      <p className="caso-meta">{areaNombre} · El caso · Nivel {nivel}: {titulo}</p>
      <div className="caso-tope">
        <h1>{fin ? 'Encontraste el cuadro' : '¿Qué cuadro es?'}</h1>
        <p>{fin ? `En ${intentos.length} ${intentos.length === 1 ? 'intento' : 'intentos'}` : `Intento ${intentos.length + 1}`}</p>
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
            onChange={(e) => { setTexto(e.target.value); setAbierto(true); setActiva(-1); setAviso(''); }}
            onFocus={() => setAbierto(true)}
            onBlur={() => setAbierto(false)}
            onKeyDown={teclas}
            placeholder="Escribí un diagnóstico"
            aria-label="Diagnóstico"
            role="combobox"
            aria-expanded={mostrarIdeas}
            aria-controls={lista}
            aria-autocomplete="list"
            aria-activedescendant={mostrarIdeas && activa >= 0 ? `${lista}-${activa}` : undefined}
          />
          <button className="caso-lupa" disabled={ocupado} aria-label="Probar">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
          {mostrarIdeas && (
            <ul className="caso-ideas" id={lista} role="listbox" aria-label="Diagnósticos del catálogo">
              {ideas.map((nombre, i) => (
                <li
                  key={nombre}
                  id={`${lista}-${i}`}
                  role="option"
                  aria-selected={i === activa}
                  className={i === activa ? 'activa' : undefined}
                  onMouseDown={(e) => { e.preventDefault(); void probar(nombre); }}
                >{nombre}</li>
              ))}
            </ul>
          )}
        </form>
      )}
      {aviso && <p className="caso-aviso" role="status">{aviso}</p>}
      <div className="caso-historial">
        {intentos.map((intento, i) => (
          <article key={`${intento.nombre}-${intentos.length - i}`} className={`caso-carta${intento.acierto ? ' acierto' : ''}`}>
            <h2>{intento.nombre}</h2>
            <div className="caso-fichas">
              {intento.fichas.map((f) => (
                <button
                  key={f.nombre}
                  type="button"
                  className={`caso-ficha ${f.resultado} ${pista === f.nombre ? 'activa' : ''}`}
                  aria-pressed={pista === f.nombre}
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
          <button type="button" className="boton secundario" onClick={salir}>Salir del nivel</button>
        </div>
      )}
    </section>
  );
}
