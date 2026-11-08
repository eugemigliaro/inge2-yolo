// Crea o actualiza las cinco cuentas de demo, o imprime un token de sesión.
// Uso: bun scripts/clerk.mjs
//      bun scripts/clerk.mjs token tomas+clerk_test@example.com
import { existsSync, readFileSync } from 'node:fs';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const SECRET = process.env.CLERK_SECRET_KEY;
if (!SECRET) {
  console.error('Falta CLERK_SECRET_KEY. Copiá .env.example a .env y completá las claves.');
  process.exit(1);
}

const USUARIOS = [
  { email: 'juana+clerk_test@example.com', nombre: 'Juana', rol: 'alumno' },
  { email: 'tomas+clerk_test@example.com', nombre: 'Tomás', rol: 'alumno' },
  { email: 'lucia+clerk_test@example.com', nombre: 'Lucía', rol: 'alumno' },
  { email: 'ana+clerk_test@example.com', nombre: 'Ana', rol: 'padre' },
  { email: 'pablo+clerk_test@example.com', nombre: 'Pablo', rol: 'profesor' },
];

async function api(method, path, body) {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return json;
}

async function usuario(email) {
  const lista = await api('GET', `/users?email_address=${encodeURIComponent(email)}`);
  const filas = Array.isArray(lista) ? lista : lista?.data ?? [];
  return filas[0];
}

async function guardarRol(id, rol) {
  await api('PATCH', `/users/${id}/metadata`, { public_metadata: { rol } });
}

async function sembrar() {
  for (const u of USUARIOS) {
    const ya = await usuario(u.email);
    if (ya) {
      await api('PATCH', `/users/${ya.id}`, {
        first_name: u.nombre,
        password: 'yolo-demo-2026!',
        skip_password_checks: true,
      });
      await guardarRol(ya.id, u.rol);
      console.log(`actualizado ${u.email}`);
    } else {
      const creado = await api('POST', '/users', {
        email_address: [u.email],
        password: 'yolo-demo-2026!',
        first_name: u.nombre,
        skip_password_checks: true,
      });
      await guardarRol(creado.id, u.rol);
      console.log(`creado ${u.email}`);
    }
  }
}

async function token(email) {
  const u = await usuario(email);
  if (!u) throw new Error(`No existe ${email} en Clerk. Corré: bun scripts/clerk.mjs`);
  const sesion = await api('POST', '/sessions', { user_id: u.id });
  const jwt = await api('POST', `/sessions/${sesion.id}/tokens`, { expires_in_seconds: 3600 });
  process.stdout.write(jwt.jwt ?? jwt.token ?? '');
}

const [comando, email] = process.argv.slice(2);
if (comando === 'token') await token(email);
else await sembrar();
