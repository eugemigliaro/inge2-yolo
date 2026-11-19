import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'No encontrado' };

export default function NoEncontrado() {
  return (
    <section className="tarjeta angosta">
      <h1>No encontramos esta página</h1>
      <p className="tenue">El enlace puede estar mal o no tenés acceso a lo que muestra.</p>
      <div className="acciones">
        <Link className="boton" href="/">Volver al inicio</Link>
      </div>
    </section>
  );
}
