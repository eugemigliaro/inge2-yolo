'use server';
import { randomBytes, randomUUID } from 'node:crypto';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { esRol, usuarioActual } from '@/lib/auth';
import { db } from '@/lib/db';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function codigoNuevo() {
  const bytes = randomBytes(6);
  return [...bytes].map((b) => ALFABETO[b % ALFABETO.length]).join('');
}

function codigosDe(texto: string) {
  return [...new Set(texto.split(/[\s,;]+/).map((c) => c.trim().toUpperCase()).filter(Boolean))];
}

export async function elegirRol(form: FormData) {
  const sesion = await auth();
  if (!sesion.userId) redirect('/sign-in');
  if (await usuarioActual()) redirect('/');

  const rol = form.get('rol');
  if (!esRol(rol)) redirect('/onboarding?error=rol');
  const codigos = codigosDe(String(form.get('codigos') ?? ''));

  const cu = await (await clerkClient()).users.getUser(sesion.userId);
  const email = cu.emailAddresses[0]?.emailAddress?.toLowerCase();
  if (!email) redirect('/onboarding?error=email');
  const nombre = [cu.firstName, cu.lastName].filter(Boolean).join(' ') || email.split('@')[0];

  const cx = await db.connect();
  let error: string | null = null;
  try {
    await cx.query('begin');
    const id = randomUUID();
    if (rol === 'alumno') {
      let codigo = codigoNuevo();
      for (let i = 0; i < 5; i++) {
        const libre = await cx.query('select 1 from usuarios where codigo = $1', [codigo]);
        if (libre.rowCount === 0) break;
        codigo = codigoNuevo();
      }
      await cx.query(
        'insert into usuarios (id, clerk_id, email, nombre, rol, codigo) values ($1, $2, $3, $4, $5, $6)',
        [id, sesion.userId, email, nombre, rol, codigo]);
    } else if (rol === 'padre') {
      error = await vincularPadre(cx, id, sesion.userId, email, nombre, codigos);
    } else {
      error = await vincularProfesor(cx, id, sesion.userId, email, nombre, codigos);
    }
    if (error) await cx.query('rollback');
    else await cx.query('commit');
  } catch (e) {
    await cx.query('rollback');
    throw e;
  } finally {
    cx.release();
  }

  if (error) redirect(`/onboarding?error=${error}`);
  try {
    await (await clerkClient()).users.updateUser(sesion.userId, { publicMetadata: { rol } });
  } catch { /* el rol ya quedó en Postgres */ }
  redirect(rol === 'alumno' ? '/jugar' : '/tutor');
}

async function vincularPadre(
  cx: { query: typeof db.query }, id: string, clerkId: string, email: string, nombre: string, codigos: string[],
) {
  if (codigos.length === 0) return 'vacio';
  const { rows } = await cx.query('select id from usuarios where rol = $1 and codigo = any($2)', ['alumno', codigos]);
  if (rows.length !== codigos.length) return 'codigo';
  await cx.query('insert into usuarios (id, clerk_id, email, nombre, rol) values ($1, $2, $3, $4, $5)', [id, clerkId, email, nombre, 'padre']);
  for (const hijo of rows) await cx.query('insert into vinculo_padre values ($1, $2)', [id, hijo.id]);
  return null;
}

async function vincularProfesor(
  cx: { query: typeof db.query }, id: string, clerkId: string, email: string, nombre: string, codigos: string[],
) {
  if (codigos.length !== 1) return 'curso';
  const { rows } = await cx.query('select id from cursos where codigo = $1', [codigos[0]]);
  if (!rows[0]) return 'curso';
  await cx.query('insert into usuarios (id, clerk_id, email, nombre, rol) values ($1, $2, $3, $4, $5)', [id, clerkId, email, nombre, 'profesor']);
  await cx.query('insert into profesor_curso values ($1, $2)', [id, rows[0].id]);
  return null;
}
