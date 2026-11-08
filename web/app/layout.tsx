import { esES } from '@clerk/localizations';
import { ClerkProvider, UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { usuarioActual, type Rol } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = { title: 'YOLO', description: 'Explorá carreras jugando' };

const ROL: Record<Rol, string> = { alumno: 'Alumno', padre: 'Padre', profesor: 'Profesor' };

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const u = userId ? await usuarioActual() : null;
  return (
    <ClerkProvider localization={esES}>
      <html lang="es">
        <body>
          <header className="barra">
            <span className="logo">YOLO</span>
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
