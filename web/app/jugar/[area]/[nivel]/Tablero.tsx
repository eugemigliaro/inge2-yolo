'use client';
import Link from 'next/link';
import { useRef, useState, type PointerEvent as EventoPuntero } from 'react';
import type { Puesta } from '@/lib/juegos/tablero';
import { enviar, useNivel } from './cliente';

type Aviso = { texto: string; tono: 'bien' | 'mal' };

// Cada situación se lleva a un estante arrastrándola, o tocándola y después tocando el estante.
export function Tablero({ area, areaNombre, nivel, totalNiveles, titulo, situaciones, estantes, inicial }: {
  area: string; areaNombre: string; nivel: number; totalNiveles: number; titulo: string;
  situaciones: { id: string; texto: string }[]; estantes: { id: string; nombre: string }[];
  inicial: { completado: boolean; correctas: string[]; puestas?: Puesta[] };
}) {
  const salir = useNivel(area, nivel, inicial.completado);
  const origen = useRef<{ id: string; x: number; y: number; activo: boolean } | null>(null);
  const huboArrastre = useRef(false);
  const [puestas, setPuestas] = useState<Puesta[]>(inicial.puestas ?? []);
  const [correctas, setCorrectas] = useState(inicial.correctas);
  const [elegida, setElegida] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [fin, setFin] = useState(inicial.completado);
  const [ocupado, setOcupado] = useState(false);

  async function asignar(situacion: string, estante: string) {
    if (ocupado || fin) return;
    setOcupado(true);
    setElegida(null);
    const { data, error } = await enviar({ tipo: 'intento', area, nivel, situacion, estante });
    setOcupado(false);
    if (error) {
      setAviso({ texto: error, tono: 'mal' });
      return;
    }
    if (Array.isArray(data.correctas)) setCorrectas(data.correctas as string[]);
    if (Array.isArray(data.puestas)) setPuestas(data.puestas as Puesta[]);
    setAviso(data.acierto ? { texto: 'Quedó en ese estante.', tono: 'bien' } : { texto: 'Ese estante no es. Probá con otro.', tono: 'mal' });
    if (data.completado) setFin(true);
  }

  function empezar(e: EventoPuntero, id: string) {
    if (fin || ocupado || e.button !== 0) return;
    huboArrastre.current = false;
    window.getSelection()?.removeAllRanges();
    origen.current = { id, x: e.clientX, y: e.clientY, activo: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function mover(e: EventoPuntero) {
    const o = origen.current;
    if (!o) return;
    if (!o.activo && Math.hypot(e.clientX - o.x, e.clientY - o.y) < 6) return;
    o.activo = true;
    window.getSelection()?.removeAllRanges();
    setArrastrando(o.id);
    setPos({ x: e.clientX, y: e.clientY });
    const bajo = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-estante]');
    setSobre(bajo?.getAttribute('data-estante') ?? null);
  }

  function terminar() {
    const o = origen.current;
    origen.current = null;
    if (o?.activo) {
      huboArrastre.current = true;
      if (sobre) void asignar(o.id, sobre);
    }
    setArrastrando(null);
    setSobre(null);
    setPos(null);
  }

  function tocarFicha(id: string) {
    if (huboArrastre.current) {
      huboArrastre.current = false;
      return;
    }
    setElegida((actual) => (actual === id ? null : id));
    setAviso(null);
  }

  const pendientes = situaciones.filter((s) => !correctas.includes(s.id));
  const textoDe = (id: string | null) => situaciones.find((s) => s.id === id)?.texto;
  const textoArrastre = textoDe(arrastrando);

  const zonas = (
    <div className={`zonas${fin ? ' zonas-final' : ''}`}>
      {estantes.map((e) => (
        <button
          key={e.id}
          type="button"
          className={`estante-zona ${sobre === e.id ? 'sobre' : ''}${elegida ? ' destino' : ''}`}
          data-estante={e.id}
          disabled={fin || ocupado || !elegida}
          aria-label={elegida ? `Poner en ${e.nombre}` : e.nombre}
          onClick={() => elegida && void asignar(elegida, e.id)}
        >
          <strong>{e.nombre}</strong>
          {puestas.filter((p) => p.estante === e.id).map((p) => (
            <span key={p.id} className="puesta">{textoDe(p.id)}</span>
          ))}
        </button>
      ))}
    </div>
  );

  return (
    <section className={`tarjeta juego juego-ancho juego-area tono-derecho${arrastrando ? ' esta-arrastrando' : ''}`}>
      <p className="tenue">{areaNombre} · El tablero · Nivel {nivel} de {totalNiveles}: {titulo}</p>
      <h1>{fin ? 'El tablero quedó armado' : 'Llevá cada situación a su estante'}</h1>
      {fin ? (
        <>
          <div className="acciones">
            {nivel < totalNiveles && <Link className="boton" href={`/jugar/${area}/${nivel + 1}`}>Siguiente nivel</Link>}
            <Link className="boton secundario" href="/jugar">Volver a la sala</Link>
          </div>
          {zonas}
        </>
      ) : (
        <>
          <div className="tablero">
            <div>
              <h2>Situaciones</h2>
              <div className="opciones">
                {pendientes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`opcion ficha-arrastre${arrastrando === s.id ? ' arrastrando' : ''}${elegida === s.id ? ' elegida' : ''}`}
                    aria-pressed={elegida === s.id}
                    disabled={ocupado}
                    onClick={() => tocarFicha(s.id)}
                    onPointerDown={(e) => empezar(e, s.id)}
                    onPointerMove={mover}
                    onPointerUp={terminar}
                    onPointerCancel={terminar}
                  >{s.texto}</button>
                ))}
              </div>
            </div>
            <div>
              <h2>Estantes</h2>
              {zonas}
            </div>
          </div>
          <p role="status" className={`aviso ${aviso?.tono ?? ''}`}>
            {aviso?.texto ?? (elegida ? 'Ahora tocá el estante.' : '')}
          </p>
          <div className="acciones">
            <button type="button" className="boton secundario" onClick={salir}>Salir del nivel</button>
          </div>
        </>
      )}
      {textoArrastre && pos && <div className="fantasma" style={{ left: pos.x, top: pos.y }}>{textoArrastre}</div>}
    </section>
  );
}
