import type { Metadata } from 'next';
import { usuarioActual } from '@/lib/auth';
import { salir } from './acciones';
import './globals.css';

export const metadata: Metadata = { title: 'YOLO', description: 'Explorá carreras jugando' };

export default async function Layout({ children }: { children: React.ReactNode }) {
  const u = await usuarioActual();
  return (
    <html lang="es">
      <body>
        <header className="barra">
          <span className="logo">YOLO</span>
          {u && (
            <form action={salir} className="usuario">
              <span>{u.nombre} · {u.rol}</span>
              <button className="boton secundario">Salir</button>
            </form>
          )}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
