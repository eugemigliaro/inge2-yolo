import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { elegirRol } from './acciones';

const ERRORES: Record<string, string> = {
  rol: 'Elegí cómo vas a usar YOLO.',
  vacio: 'Si sos padre, escribí el código de al menos un hijo.',
  codigo: 'Alguno de esos códigos no es de un alumno.',
  curso: 'Ese código no es de un curso.',
  email: 'Tu cuenta no tiene un email.',
};

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sesion = await auth();
  if (!sesion.userId) redirect('/sign-in');
  const u = await usuarioActual();
  if (u) redirect(u.rol === 'alumno' ? '/jugar' : '/tutor');
  const error = ERRORES[(await searchParams).error ?? ''];

  return (
    <section className="tarjeta login">
      <h1>¿Cómo vas a usar YOLO?</h1>
      <p className="tenue">El rol queda en tu cuenta. Después no se cambia desde acá.</p>
      <form action={elegirRol}>
        <fieldset className="roles">
          <legend className="tenue">Rol</legend>
          <label><input type="radio" name="rol" value="alumno" required /> Alumno</label>
          <label><input type="radio" name="rol" value="padre" /> Padre</label>
          <label><input type="radio" name="rol" value="profesor" /> Profesor o personal del colegio</label>
        </fieldset>
        <label>
          Códigos
          <textarea name="codigos" rows={3} placeholder="Padre: un código de hijo por línea. Profesor: el código del curso." />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="boton">Continuar</button>
      </form>
    </section>
  );
}
