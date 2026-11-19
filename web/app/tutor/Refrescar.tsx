'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const HORA: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' };

// El dashboard se vuelve a pedir cada 5 s: muestra lo que el proyector ya procesó.
export function Refrescar() {
  const router = useRouter();
  const [hora, setHora] = useState('');
  useEffect(() => {
    const marcar = () => setHora(new Date().toLocaleTimeString('es-AR', HORA));
    marcar();
    const id = setInterval(() => { router.refresh(); marcar(); }, 5000);
    return () => clearInterval(id);
  }, [router]);
  return <span className="tenue en-vivo">Actualizado {hora}</span>;
}
