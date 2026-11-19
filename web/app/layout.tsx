import { esUY } from '@clerk/localizations';
import { ClerkProvider, UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { usuarioActual, type Rol } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'YOLO', template: '%s · YOLO' },
  description: 'Explorá carreras jugando',
};

const ROL: Record<Rol, string> = { alumno: 'Alumno', padre: 'Familia', profesor: 'Profesor' };

const apariencia = { variables: { colorPrimary: '#2a78d6', borderRadius: '0.5rem' } };

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const u = userId ? await usuarioActual() : null;
  return (
    // esUY usa voseo, como el resto de la app.
    <ClerkProvider localization={esUY} appearance={apariencia}>
      <html lang="es">
        <body>
          <header className="barra">
            <Link href="/" className="logo">YOLO</Link>
            {userId && (
              <div className="usuario">
                {u && <span>{u.nombre} · {ROL[u.rol]}</span>}
                <UserButton />
              </div>
            )}
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
