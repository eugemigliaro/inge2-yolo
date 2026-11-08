import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from './db';

export type Rol = 'alumno' | 'padre' | 'profesor';
export type Usuario = { id: string; nombre: string; rol: Rol; codigo: string | null; email: string };

const ROLES = new Set<Rol>(['alumno', 'padre', 'profesor']);

export async function usuarioActual(): Promise<Usuario | null> {
  const sesion = await auth({ acceptsToken: 'session_token' });
  const userId = sesion.userId;
  if (!userId) return null;

  const porClerk = await db.query('select id, nombre, rol, codigo, email from usuarios where clerk_id = $1', [userId]);
  if (porClerk.rows[0]) return porClerk.rows[0];

  const cu = await (await clerkClient()).users.getUser(userId);
  const email = cu.emailAddresses[0]?.emailAddress?.toLowerCase();
  if (!email) return null;

  const porEmail = await db.query('select id, nombre, rol, codigo, email from usuarios where email = $1', [email]);
  if (!porEmail.rows[0]) return null;
  await db.query('update usuarios set clerk_id = $1 where id = $2 and clerk_id is null', [userId, porEmail.rows[0].id]);
  return porEmail.rows[0];
}

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === 'string' && ROLES.has(valor as Rol);
}

export async function exigirRol(rol: Rol | Rol[]): Promise<Usuario> {
  const permitidos = new Set(Array.isArray(rol) ? rol : [rol]);
  const sesion = await auth({ acceptsToken: 'session_token' });
  if (!sesion.userId) redirect('/sign-in');
  const u = await usuarioActual();
  if (!u) redirect('/onboarding');
  if (!permitidos.has(u.rol)) redirect(u.rol === 'alumno' ? '/jugar' : '/tutor');
  return u;
}
