import type { Metadata } from 'next';
import Link from 'next/link';
import { exigirRol } from '@/lib/auth';
import { AREAS } from '@/lib/contenido';
import { nivelesCompletados } from '@/lib/progreso';

export const metadata: Metadata = { title: 'Sala de juegos' };

export default async function Sala() {
  const u = await exigirRol('alumno');
  const completado = await nivelesCompletados(u.id);

  return (
    <>
      <h1>Hola, {u.nombre}</h1>
      <p className="tenue">Tres juegos distintos, uno por carrera. Completar un nivel abre el siguiente de esa carrera, no de otra.</p>
      {u.codigo && <p>Tu código para un padre: <strong>{u.codigo}</strong></p>}
      <div className="grilla">
        {AREAS.map((a) => (
          <section key={a.slug} className={`tarjeta puerta puerta-${a.slug}`}>
            <h2><span className={`punto area-${a.slug}`} /> {a.juego}</h2>
            <p>{a.nombre}</p>
            <p className="tenue">{a.descripcion}</p>
            <ol className="niveles">
              {a.niveles.map((n, i) => {
                const nivel = i + 1;
                const hecho = nivel <= (completado[a.slug] ?? 0);
                const abierto = nivel <= (completado[a.slug] ?? 0) + 1;
                const estado = hecho ? 'hecho' : abierto ? 'abierto' : 'bloqueado';
                const contenido = <><span className="marca" aria-hidden /><span>Nivel {nivel}: {n.titulo}</span></>;
                return (
                  <li key={nivel} className={`nivel nivel-${estado}`}>
                    {abierto
                      ? <Link href={`/jugar/${a.slug}/${nivel}`} aria-label={`Nivel ${nivel}: ${n.titulo}${hecho ? ', completado' : ''}`}>{contenido}</Link>
                      : <span aria-label={`Nivel ${nivel}: ${n.titulo}, bloqueado`}>{contenido}</span>}
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
