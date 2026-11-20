'use client';
import { useEffect, useRef, useState } from 'react';
import { CLAVE_TEMA as CLAVE } from './tema';

type Tema = 'light' | 'dark' | 'system';
const OPCIONES: { valor: Tema; nombre: string }[] = [
  { valor: 'light', nombre: 'Claro' },
  { valor: 'dark', nombre: 'Oscuro' },
  { valor: 'system', nombre: 'Sistema' },
];

function aplicar(tema: Tema) {
  const oscuro = tema === 'dark' || (tema === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  const raiz = document.documentElement;
  raiz.classList.toggle('dark', oscuro);
  raiz.style.colorScheme = oscuro ? 'dark' : 'light';
}

function leer(): Tema {
  try {
    const t = localStorage.getItem(CLAVE);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

export function SelectorTema() {
  const [tema, setTema] = useState<Tema>('system');
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => setTema(leer()), []);

  // Con «Sistema», sigue los cambios del sistema operativo sin recargar.
  useEffect(() => {
    if (tema !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const cambio = () => aplicar('system');
    mq.addEventListener('change', cambio);
    return () => mq.removeEventListener('change', cambio);
  }, [tema]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => { if (!raiz.current?.contains(e.target as Node)) setAbierto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', tecla); };
  }, [abierto]);

  function elegir(t: Tema) {
    setTema(t);
    try { localStorage.setItem(CLAVE, t); } catch {}
    aplicar(t);
    setAbierto(false);
  }

  return (
    <div className="tema" ref={raiz}>
      <button type="button" className="tema-boton" aria-label="Cambiar tema" aria-haspopup="menu" aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}>
        <svg className="sol" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
        <svg className="luna" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </button>
      {abierto && (
        <ul className="tema-menu" role="menu">
          {OPCIONES.map((o) => (
            <li key={o.valor} role="none">
              <button type="button" role="menuitemradio" aria-checked={tema === o.valor} onClick={() => elegir(o.valor)}>
                {o.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
