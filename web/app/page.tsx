import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { ingresar } from './acciones';

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const u = await usuarioActual();
  if (u) redirect(u.rol === 'tutor' ? '/tutor' : '/jugar');
  const { error } = await searchParams;
  return (
    <section className="tarjeta login">
      <h1>Ingresar</h1>
      <p className="tenue">Alumnos para jugar, tutores para ver el recorrido.</p>
      <form action={ingresar}>
        <label>Email<input name="email" type="email" required autoComplete="username" /></label>
        <label>Contraseña<input name="password" type="password" required autoComplete="current-password" /></label>
        {error && <p className="error" role="alert">Email o contraseña incorrectos.</p>}
        <button className="boton">Ingresar</button>
      </form>
    </section>
  );
}
