let cola: Promise<unknown> = Promise.resolve();

export function enviar(evento: object): Promise<{ status: number; data: Record<string, unknown> }> {
  const body = JSON.stringify({ eventId: crypto.randomUUID(), ...evento });
  const hecho = cola.then(async () => {
    for (let intento = 1; intento <= 3; intento++) {
      try {
        const r = await fetch('/api/eventos', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true,
        });
        const data = await r.json().catch(() => ({}));
        if (r.status < 500) return { status: r.status, data };
      } catch { /* red caída: reintentar el mismo eventId */ }
      await new Promise((ok) => setTimeout(ok, 500 * intento));
    }
    return { status: 500, data: {} };
  });
  cola = hecho.then(() => undefined, () => undefined);
  return hecho;
}
