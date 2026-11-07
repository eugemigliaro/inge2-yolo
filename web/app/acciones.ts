'use server';
import { redirect } from 'next/navigation';
import { cerrarSesion, iniciarSesion } from '@/lib/auth';

export async function ingresar(form: FormData) {
  const u = await iniciarSesion(String(form.get('email') ?? ''), String(form.get('password') ?? ''));
  redirect(!u ? '/?error=1' : u.rol === 'tutor' ? '/tutor' : '/jugar');
}

export async function salir() {
  await cerrarSesion();
  redirect('/');
}
