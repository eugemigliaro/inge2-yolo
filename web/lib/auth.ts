import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';

const COOKIE = 'yolo_sesion';
export type Usuario = { id: string; nombre: string; rol: 'alumno' | 'tutor' };

function passwordValida(password: string, hash: string) {
  const [salt, esperado] = hash.split(':');
  return timingSafeEqual(scryptSync(password, salt, 32), Buffer.from(esperado, 'hex'));
}

export async function iniciarSesion(email: string, password: string): Promise<Usuario | null> {
  const { rows: [u] } = await db.query('select id, nombre, rol, password_hash from usuarios where email = $1', [email.trim().toLowerCase()]);
  if (!u || !passwordValida(password, u.password_hash)) return null;
  const token = randomBytes(32).toString('hex');
  await db.query("insert into sesiones_web (token, usuario_id, expira) values ($1, $2, now() + interval '7 days')", [token, u.id]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true', maxAge: 7 * 86_400, path: '/',
  });
  return u;
}

export async function cerrarSesion() {
  const jar = await cookies();
  await db.query('delete from sesiones_web where token = $1', [jar.get(COOKIE)?.value ?? '']);
  jar.delete(COOKIE);
}

export async function usuarioActual(): Promise<Usuario | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const { rows: [u] } = await db.query(
    'select u.id, u.nombre, u.rol from sesiones_web s join usuarios u on u.id = s.usuario_id where s.token = $1 and s.expira > now()',
    [token]);
  return u ?? null;
}

export async function exigirRol(rol: Usuario['rol']): Promise<Usuario> {
  const u = await usuarioActual();
  if (u?.rol !== rol) redirect('/');
  return u;
}
