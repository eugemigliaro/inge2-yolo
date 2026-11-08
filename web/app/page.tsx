import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';

export default async function Inicio() {
  const u = await usuarioActual();
  if (!u) redirect('/onboarding');
  redirect(u.rol === 'alumno' ? '/jugar' : '/tutor');
}
