import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { Formulario } from './Formulario';

export const metadata: Metadata = { title: 'Tu rol' };

export default async function Onboarding() {
  const sesion = await auth();
  if (!sesion.userId) redirect('/sign-in');
  const u = await usuarioActual();
  if (u) redirect(u.rol === 'alumno' ? '/jugar' : '/tutor');

  return (
    <section className="tarjeta angosta">
      <h1>¿Cómo vas a usar YOLO?</h1>
      <p className="tenue">El rol queda en tu cuenta. Después no se cambia desde acá.</p>
      <Formulario />
    </section>
  );
}
