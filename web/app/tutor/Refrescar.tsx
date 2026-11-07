'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// El dashboard se vuelve a pedir cada 5 s: muestra lo que el proyector ya procesó.
export function Refrescar() {
  const router = useRouter();
  const [hora, setHora] = useState('');
  useEffect(() => {
    const marcar = () => setHora(new Date().toLocaleTimeString('es-AR'));
    marcar();
    const id = setInterval(() => { router.refresh(); marcar(); }, 5000);
    return () => clearInterval(id);
  }, [router]);
  return <span className="tenue" aria-live="polite">Actualizado {hora}</span>;
}
