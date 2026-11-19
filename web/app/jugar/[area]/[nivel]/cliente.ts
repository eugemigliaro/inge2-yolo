import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

let cola: Promise<unknown> = Promise.resolve();

export type Respuesta = { status: number; data: Record<string, unknown>; error: string | null };

function mensaje(status: number) {
  if (status < 400) return null;
  if (status === 401) return 'Tu sesión se cerró. Volvé a entrar para seguir jugando.';
  if (status === 403) return 'Este nivel todavía está bloqueado.';
  if (status < 500) return 'No pudimos registrar esa jugada.';
  return 'No pudimos guardar la jugada. Probá de nuevo en unos segundos.';
}

export function enviar(evento: object): Promise<Respuesta> {
  const body = JSON.stringify({ eventId: crypto.randomUUID(), ...evento });
  const hecho = cola.then(async () => {
    for (let intento = 1; intento <= 3; intento++) {
      try {
        const r = await fetch('/api/eventos', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true,
        });
        const data = await r.json().catch(() => ({}));
        if (r.status < 500) return { status: r.status, data, error: mensaje(r.status) };
      } catch { /* red caída: reintentar el mismo eventId */ }
      await new Promise((ok) => setTimeout(ok, 500 * intento));
    }
    return { status: 503, data: {}, error: mensaje(503) };
  });
  cola = hecho.then(() => undefined, () => undefined);
  return hecho;
}

// Abre la sesión del nivel una sola vez. Volver a mirar un nivel ya completado no cuenta como jugarlo.
export function useNivel(area: string, nivel: number, completadoAlEntrar: boolean) {
  const router = useRouter();
  const iniciado = useRef(completadoAlEntrar);
  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    void enviar({ tipo: 'nivel_iniciado', area, nivel });
  }, [area, nivel]);

  return async function salir() {
    await enviar({ tipo: 'nivel_abandonado', area, nivel });
    router.push('/jugar');
  };
}
