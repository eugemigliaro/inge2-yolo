import { esUY } from '@clerk/localizations';
import { ClerkProvider, UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import Link from 'next/link';
import { usuarioActual, type Rol } from '@/lib/auth';
import { SelectorTema } from './SelectorTema';
import { SCRIPT_TEMA } from './tema';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'YOLO', template: '%s · YOLO' },
  description: 'Explorá carreras jugando',
};

const ROL: Record<Rol, string> = { alumno: 'Alumno', padre: 'Familia', profesor: 'Profesor' };

const montserrat = Montserrat({ subsets: ['latin'], variable: '--fuente', display: 'swap' });

const apariencia = {
  variables: {
    colorPrimary: 'var(--marca)', colorText: 'var(--texto)', colorTextSecondary: 'var(--texto-2)',
    colorBackground: 'var(--superficie)', colorInputBackground: 'var(--superficie)', colorInputText: 'var(--texto)',
    colorNeutral: 'var(--texto)', borderRadius: '0.375rem', fontFamily: 'var(--fuente), sans-serif',
  },
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const u = userId ? await usuarioActual() : null;
  return (
    // esUY usa voseo, como el resto de la app.
    <ClerkProvider localization={esUY} appearance={apariencia}>
      <html lang="es" className={montserrat.variable} suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        </head>
        <body>
          <header className="barra">
            <Link href="/" className="logo">YOLO</Link>
            {userId ? (
              <div className="usuario">
                {u && <span>{u.nombre} · {ROL[u.rol]}</span>}
                <SelectorTema />
                <UserButton />
              </div>
            ) : (
              <nav className="usuario" aria-label="Cuenta">
                <Link href="/sign-in" className="enlace-barra">Ingresar</Link>
                <Link href="/sign-up" className="boton-barra">Crear cuenta</Link>
                <SelectorTema />
              </nav>
            )}
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
