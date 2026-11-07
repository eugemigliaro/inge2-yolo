'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Nivel } from '@/lib/contenido';

// Los eventos salen en orden (uno detrás del otro) y cada reintento lleva el mismo eventId: el backend no duplica.
let cola: Promise<void> = Promise.resolve();
function enviar(evento: object) {
  const body = JSON.stringify({ eventId: crypto.randomUUID(), ...evento });
  cola = cola.then(async () => {
    for (let intento = 1; intento <= 3; intento++) {
      try {
        const r = await fetch('/api/eventos', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true });
        if (r.status < 500) return;
      } catch { /* red caída: reintentar */ }
      await new Promise((ok) => setTimeout(ok, 500 * intento));
    }
  });
  return cola;
}

type Props = Nivel & { area: string; areaNombre: string; nivel: number; totalNiveles: number };

export function Juego({ area, areaNombre, nivel, totalNiveles, titulo, situaciones }: Props) {
  const router = useRouter();
  const iniciado = useRef(false);
  const [i, setI] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [fin, setFin] = useState(false);

  useEffect(() => {
    if (iniciado.current) return; // React en desarrollo monta dos veces
    iniciado.current = true;
    enviar({ tipo: 'nivel_iniciado', area, nivel });
  }, [area, nivel]);

  const s = situaciones[i];

  function elegir(opcion: number) {
    if (elegida !== null) return;
    setElegida(opcion);
    if (opcion === s.correcta) setAciertos((a) => a + 1);
    enviar({ tipo: 'decision', area, nivel, situacion: i, opcion });
  }

  function seguir() {
    if (i + 1 < situaciones.length) {
      setI(i + 1);
      setElegida(null);
    } else {
      setFin(true);
      enviar({ tipo: 'nivel_completado', area, nivel });
    }
  }

  async function abandonar() {
    await enviar({ tipo: 'nivel_abandonado', area, nivel });
    router.push('/jugar');
  }

  if (fin) {
    return (
      <section className="tarjeta juego">
        <p className="tenue">{areaNombre} · Nivel {nivel}</p>
        <h1>¡Nivel completado!</h1>
        <p>Acertaste {aciertos} de {situaciones.length} decisiones.</p>
        <div className="acciones">
          {nivel < totalNiveles && <Link className="boton" href={`/jugar/${area}/${nivel + 1}`}>Siguiente nivel</Link>}
          <Link className="boton secundario" href="/jugar">Volver a las áreas</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="tarjeta juego">
      <p className="tenue">{areaNombre} · Nivel {nivel}: {titulo} · Situación {i + 1} de {situaciones.length}</p>
      <h1>{s.pregunta}</h1>
      <div className="opciones">
        {s.opciones.map((op, j) => (
          <button key={j} onClick={() => elegir(j)} disabled={elegida !== null}
            className={`opcion ${elegida !== null && j === s.correcta ? 'bien' : ''} ${elegida === j && j !== s.correcta ? 'mal' : ''}`}>
            {op}
          </button>
        ))}
      </div>
      {elegida !== null && (
        <p className="explicacion" role="status">{elegida === s.correcta ? '✓ ¡Bien!' : '✗ No era esa.'} {s.explicacion}</p>
      )}
      <div className="acciones">
        {elegida !== null && <button className="boton" onClick={seguir}>{i + 1 < situaciones.length ? 'Seguir' : 'Terminar nivel'}</button>}
        <button className="boton secundario" onClick={abandonar}>Salir del nivel</button>
      </div>
    </section>
  );
}
