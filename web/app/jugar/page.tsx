import Link from 'next/link';
import { exigirRol } from '@/lib/auth';
import { AREAS } from '@/lib/contenido';
import { db } from '@/lib/db';

export default async function Areas() {
  const u = await exigirRol('alumno');
  const { rows } = await db.query('select area, nivel_max from progreso_area where alumno_id = $1', [u.id]);
  const completado = Object.fromEntries(rows.map((r) => [r.area, r.nivel_max as number]));

  return (
    <>
      <h1>Hola, {u.nombre}</h1>
      <p className="tenue">Elegí un área y jugá. Cada nivel que completás desbloquea el siguiente.</p>
      <div className="grilla">
        {AREAS.map((a) => (
          <section key={a.slug} className="tarjeta">
            <h2><span className={`punto area-${a.slug}`} /> {a.nombre}</h2>
            <p className="tenue">{a.descripcion}</p>
            <ol className="niveles">
              {a.niveles.map((n, i) => {
                const nivel = i + 1;
                const hecho = nivel <= (completado[a.slug] ?? 0);
                const abierto = nivel <= (completado[a.slug] ?? 0) + 1;
                return (
                  <li key={nivel}>
                    {abierto
                      ? <Link href={`/jugar/${a.slug}/${nivel}`}>{hecho ? '✓' : '▶'} Nivel {nivel}: {n.titulo}</Link>
                      : <span className="tenue">🔒 Nivel {nivel}: {n.titulo}</span>}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
