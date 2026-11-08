import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirRol } from '@/lib/auth';
import { AREAS } from '@/lib/contenido';
import { db } from '@/lib/db';
import { alumnosDe } from '@/lib/vinculos';
import { Refrescar } from './Refrescar';

const ZONA = 'America/Argentina/Buenos_Aires';
const DIAS = 14;

function duracion(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${s % 60 ? `${s % 60} s` : ''}`.trim();
  return `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`;
}
const nombreArea = (slug: string) => AREAS.find((a) => a.slug === slug)?.nombre ?? slug;

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ alumno?: string }> }) {
  const adulto = await exigirRol(['padre', 'profesor']);
  const alumnos = await alumnosDe(adulto);
  if (alumnos.length === 0) return <p>Todavía no tenés alumnos vinculados.</p>;

  const pedido = (await searchParams).alumno ?? alumnos[0].id;
  const alumno = alumnos.find((a) => a.id === pedido);
  if (!alumno) notFound();

  const [progreso, diaria, alertas, estado] = await Promise.all([
    db.query('select * from progreso_area where alumno_id = $1', [alumno.id]),
    db.query(`select dia::text, area, tiempo_ms from actividad_diaria where alumno_id = $1 and dia > current_date - ${DIAS + 1}`, [alumno.id]),
    db.query('select * from alertas where alumno_id = $1 order by creada desc limit 8', [alumno.id]),
    db.query('select sesiones from recorrido_estado where alumno_id = $1', [alumno.id]),
  ]);

  const porArea = AREAS.map((a) => {
    const p = progreso.rows.find((r) => r.area === a.slug);
    return {
      ...a, tiempo: Number(p?.tiempo_ms ?? 0), nivelMax: p?.nivel_max ?? 0, abandonos: p?.abandonos ?? 0,
      intentos: p?.intentos ?? 0, aciertos: p?.aciertos ?? 0,
    };
  });
  const total = porArea.reduce((s, a) => s + a.tiempo, 0);
  const maxTiempo = Math.max(1, ...porArea.map((a) => a.tiempo));
  const exploradas = porArea.filter((a) => a.tiempo > 0 || a.nivelMax > 0).length;
  const niveles = porArea.reduce((s, a) => s + a.nivelMax, 0);
  const favorita = total > 0 ? porArea.reduce((m, a) => (a.tiempo > m.tiempo ? a : m)) : null;

  const hoy = Date.now();
  const dias = Array.from({ length: DIAS }, (_, k) => {
    const fecha = new Date(hoy - (DIAS - 1 - k) * 86_400_000);
    const iso = fecha.toLocaleDateString('sv-SE', { timeZone: ZONA });
    const partes = AREAS.map((a) => ({
      area: a.slug, ms: Number(diaria.rows.find((r) => r.dia === iso && r.area === a.slug)?.tiempo_ms ?? 0),
    }));
    return {
      iso, partes, total: partes.reduce((s, p) => s + p.ms, 0),
      etiqueta: fecha.toLocaleDateString('es-AR', { timeZone: ZONA, weekday: 'short', day: 'numeric', month: 'numeric' }),
    };
  });
  const maxDia = Math.max(1, ...dias.map((d) => d.total));

  return (
    <>
      <div className="encabezado">
        <h1>Recorrido de {alumno.nombre}</h1>
        <Refrescar />
      </div>
      {alumnos.length > 1 && (
        <nav className="pestanas" aria-label="Alumnos">
          {alumnos.map((a) => (
            <Link key={a.id} href={`/tutor?alumno=${a.id}`} aria-current={a.id === alumno.id ? 'page' : undefined}>{a.nombre}</Link>
          ))}
        </nav>
      )}

      <div className="tiles">
        <div className="tile"><span>Áreas exploradas</span><strong>{exploradas} de {AREAS.length}</strong></div>
        <div className="tile"><span>Tiempo efectivo de juego</span><strong>{duracion(total)}</strong></div>
        <div className="tile"><span>Niveles completados</span><strong>{niveles} de {AREAS.length * 3}</strong></div>
        <div className="tile"><span>Sesiones</span><strong>{estado.rows[0]?.sesiones ?? 0}</strong></div>
      </div>

      {favorita && (
        <p className="destacado">
          Donde más tiempo pasa: <strong>{favorita.nombre}</strong> ({Math.round((favorita.tiempo / total) * 100)} % de su tiempo de juego).
        </p>
      )}

      <div className="grilla">
        <section className="tarjeta">
          <h2>Tiempo efectivo por área</h2>
          <p className="tenue">Sin contar pausas de más de 2 minutos.</p>
          {porArea.map((a) => (
            <div key={a.slug} className="fila-barra">
              <span className="etiqueta">{a.nombre}</span>
              <div className="pista">
                <div className={`barra-h area-${a.slug}`} style={{ width: `${(a.tiempo / maxTiempo) * 100}%` }} />
                <span className="valor">{duracion(a.tiempo)}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="tarjeta">
          <h2>Profundidad por área</h2>
          <p className="tenue">Niveles completados, aciertos y abandonos.</p>
          {porArea.map((a) => (
            <div key={a.slug} className="fila-profundidad">
              <span className="etiqueta">{a.nombre}</span>
              <span className="segmentos" role="img" aria-label={`${a.nivelMax} de ${a.niveles.length} niveles`}>
                {a.niveles.map((_, k) => <span key={k} className={k < a.nivelMax ? `lleno area-${a.slug}` : 'vacio'} />)}
              </span>
              <span className="tenue">
                {a.nivelMax}/{a.niveles.length} · {a.intentos ? `${Math.round((a.aciertos / a.intentos) * 100)} % aciertos` : 'sin intentos'}
                {a.abandonos > 0 && ` · ${a.abandonos} abandono${a.abandonos > 1 ? 's' : ''}`}
              </span>
            </div>
          ))}
        </section>
      </div>

      <section className="tarjeta">
        <h2>Actividad de los últimos {DIAS} días</h2>
        <ul className="leyenda">
          {AREAS.map((a) => <li key={a.slug}><span className={`punto area-${a.slug}`} />{a.nombre}</li>)}
        </ul>
        <div className="columnas">
          {dias.map((d) => (
            <div key={d.iso} className="columna"
              title={`${d.etiqueta}: ${d.total ? d.partes.filter((p) => p.ms).map((p) => `${nombreArea(p.area)} ${duracion(p.ms)}`).join(', ') : 'sin actividad'}`}>
              <div className="pila" style={{ height: `${(d.total / maxDia) * 100}%` }}>
                {d.partes.filter((p) => p.ms).map((p) => (
                  <div key={p.area} className={`segmento area-${p.area}`} style={{ flexGrow: p.ms }} />
                ))}
              </div>
              <span className="dia">{Number(d.iso.slice(8))}</span>
            </div>
          ))}
        </div>
        <details>
          <summary>Ver como tabla</summary>
          <table>
            <thead><tr><th>Día</th>{AREAS.map((a) => <th key={a.slug}>{a.nombre}</th>)}</tr></thead>
            <tbody>
              {dias.filter((d) => d.total).map((d) => (
                <tr key={d.iso}><td>{d.etiqueta}</td>{d.partes.map((p) => <td key={p.area}>{p.ms ? duracion(p.ms) : '—'}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="tarjeta">
        <h2>Alertas</h2>
        {alertas.rows.length === 0 && <p className="tenue">Sin alertas por ahora.</p>}
        <ul className="alertas">
          {alertas.rows.map((a) => (
            <li key={a.id} className={a.tipo}>
              <span className="icono" aria-hidden>{a.tipo === 'interes' ? '★' : '!'}</span>
              <div>
                <strong>{a.tipo === 'interes' ? 'Descubrió un interés' : 'Señal de frustración'}</strong>
                <span className="tenue"> · {new Date(a.creada).toLocaleString('es-AR', { timeZone: ZONA, dateStyle: 'short', timeStyle: 'short' })}</span>
                <p>{alumno.nombre} {a.mensaje}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
