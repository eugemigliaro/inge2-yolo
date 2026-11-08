'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type PointerEvent as EventoPuntero } from 'react';
import type { Puesta } from '@/lib/juegos/tablero';
import { enviar } from './cliente';

export function Tablero({ area, areaNombre, nivel, totalNiveles, titulo, situaciones, estantes, inicial }: {
  area: string; areaNombre: string; nivel: number; totalNiveles: number; titulo: string;
  situaciones: { id: string; texto: string }[]; estantes: { id: string; nombre: string }[];
  inicial: { completado: boolean; correctas: string[]; puestas?: Puesta[] };
}) {
  const router = useRouter();
  const iniciado = useRef(false);
  const origen = useRef<{ id: string; x: number; y: number; activo: boolean } | null>(null);
  const [puestas, setPuestas] = useState<Puesta[]>(inicial.puestas ?? []);
  const [correctas, setCorrectas] = useState(inicial.correctas);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [aviso, setAviso] = useState('');
  const [fin, setFin] = useState(inicial.completado);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    void enviar({ tipo: 'nivel_iniciado', area, nivel });
  }, [area, nivel]);

  async function asignar(situacion: string, estante: string) {
    if (ocupado || fin) return;
    setOcupado(true);
    const { data } = await enviar({ tipo: 'intento', area, nivel, situacion, estante });
    setOcupado(false);
    if (Array.isArray(data.correctas)) setCorrectas(data.correctas as string[]);
    if (Array.isArray(data.puestas)) setPuestas(data.puestas as Puesta[]);
    setAviso(data.acierto ? 'Quedó en ese estante.' : 'Ese estante no es. Volvé a arrastrarla.');
    if (data.completado) setFin(true);
  }

  function empezar(e: EventoPuntero, id: string) {
    if (fin || ocupado) return;
    e.preventDefault();
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
    if (o?.activo && sobre) void asignar(o.id, sobre);
    setArrastrando(null);
    setSobre(null);
    setPos(null);
  }

  async function abandonar() {
    await enviar({ tipo: 'nivel_abandonado', area, nivel });
    router.push('/jugar');
  }

  const pendientes = situaciones.filter((s) => !correctas.includes(s.id));
  const textoArrastre = situaciones.find((s) => s.id === arrastrando)?.texto;

  return (
    <section className={`tarjeta juego juego-ancho${arrastrando ? ' esta-arrastrando' : ''}`}>
      <p className="tenue">{areaNombre} · El tablero · Nivel {nivel}: {titulo}</p>
      <h1>{fin ? 'El tablero quedó armado' : 'Arrastrá cada situación a su estante'}</h1>
      {fin ? (
        <div className="acciones">
          {nivel < totalNiveles && <Link className="boton" href={`/jugar/${area}/${nivel + 1}`}>Siguiente nivel</Link>}
          <Link className="boton secundario" href="/jugar">Volver a la sala</Link>
        </div>
      ) : (
        <>
          <div className="tablero">
            <div>
              <h2>Situaciones</h2>
              <div className="opciones">
                {pendientes.map((s) => (
                  <div
                    key={s.id}
                    className={`opcion ficha-arrastre ${arrastrando === s.id ? 'arrastrando' : ''}`}
                    onPointerDown={(e) => empezar(e, s.id)}
                    onPointerMove={mover}
                    onPointerUp={terminar}
                    onPointerCancel={terminar}
                  >{s.texto}</div>
                ))}
                {pendientes.length === 0 && <p className="tenue">No queda ninguna suelta.</p>}
              </div>
            </div>
            <div>
              <h2>Estantes</h2>
              <div className="zonas">
                {estantes.map((e) => (
                  <div key={e.id} className={`estante-zona ${sobre === e.id ? 'sobre' : ''}`} data-estante={e.id}>
                    <strong>{e.nombre}</strong>
                    {puestas.filter((p) => p.estante === e.id).map((p) => (
                      <p key={p.id}>{situaciones.find((s) => s.id === p.id)?.texto}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {aviso && <p role="status">{aviso}</p>}
          <div className="acciones">
            <button type="button" className="boton secundario" onClick={abandonar}>Salir del nivel</button>
          </div>
        </>
      )}
      {textoArrastre && pos && <div className="fantasma" style={{ left: pos.x, top: pos.y }}>{textoArrastre}</div>}
    </section>
  );
}
