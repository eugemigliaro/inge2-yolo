import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { AREAS } from '@/lib/contenido';
import { IconoArea } from './iconos';

export const metadata: Metadata = { title: { absolute: 'YOLO · Probá las carreras jugando' } };

// Con sesión, cada rol va a su pantalla. Sin sesión, la portada pública.
export default async function Inicio() {
  const { userId } = await auth();
  if (userId) {
    const u = await usuarioActual();
    if (!u) redirect('/onboarding');
    redirect(u.rol === 'alumno' ? '/jugar' : '/tutor');
  }

  return (
    <div className="portada">
      <section className="portada-hero">
        <div>
          <p className="portada-etiqueta">Orientación vocacional, jugando</p>
          <h1>Probá las carreras <em>antes de elegir una</em>.</h1>
          <p className="portada-bajada">
            Tres juegos, uno por carrera. Vos jugás a tu ritmo; tu familia y tus profes ven qué exploraste,
            cuánto tiempo le dedicaste y hasta dónde llegaste, en tiempo real.
          </p>
          <div className="acciones">
            <Link className="boton boton-grande" href="/sign-up">Empezar a jugar</Link>
            <Link className="boton secundario boton-grande" href="/sign-in">Ya tengo cuenta</Link>
          </div>
        </div>
        <Vista />
      </section>

      <section className="portada-seccion" aria-labelledby="carreras">
        <h2 id="carreras">Tres carreras, tres juegos</h2>
        <p className="tenue">Ninguno depende de reflejos. Completar un nivel abre el siguiente de esa carrera.</p>
        <div className="grilla">
          {AREAS.map((a) => (
            <article key={a.slug} className={`tarjeta carrera tono-${a.slug}`}>
              <span className="icono-area"><IconoArea area={a.slug} /></span>
              <h3>{a.nombre}</h3>
              <p className="juego-nombre">{a.juego}</p>
              <p>{a.descripcion}</p>
              <p className="chip-niveles">{a.niveles.length} niveles</p>
            </article>
          ))}
        </div>
      </section>

      <section className="portada-seccion" aria-labelledby="como">
        <h2 id="como">Cómo funciona</h2>
        <ol className="pasos">
          <li><strong>Creás tu cuenta</strong>Elegís si sos alumno, familia o profe. Un código une al alumno con su familia o su curso.</li>
          <li><strong>Jugás</strong>Cada jugada se registra al instante. Podés dejar un nivel y volver cuando quieras.</li>
          <li><strong>Tu familia lo ve</strong>Tiempo por carrera, niveles, aciertos y alertas por mail cuando aparece un interés o una traba.</li>
        </ol>
      </section>

      <section className="no-test">
        <p>
          <strong>No es un test.</strong> YOLO no te dice qué estudiar: muestra cómo explorás, para que la charla
          con tu familia parta de lo que hiciste y no de una foto de un día.
        </p>
        <Link className="boton boton-grande" href="/sign-up">Crear cuenta</Link>
      </section>

      <footer className="pie">YOLO · Trabajo práctico integrador de Ingeniería de Software II · ITBA · 2026</footer>
    </div>
  );
}

// Una muestra estática de lo que ve la familia en el panel. No lee datos.
function Vista() {
  const barras = [
    { area: 'medicina', nombre: 'Medicina', ancho: 100, valor: '4 min 2 s' },
    { area: 'sistemas', nombre: 'Sistemas', ancho: 38, valor: '1 min 32 s' },
    { area: 'derecho', nombre: 'Derecho', ancho: 17, valor: '40 s' },
  ];
  return (
    <figure className="vista" aria-label="Ejemplo del panel que ve la familia">
      <div className="vista-tope">
        <span>Recorrido de Juana</span>
        <span className="en-vivo">En vivo</span>
      </div>
      <p className="tenue">Tiempo efectivo por carrera</p>
      {barras.map((b) => (
        <div key={b.area} className="fila-barra">
          <span className="etiqueta">{b.nombre}</span>
          <div className="pista">
            <div className={`barra-h area-${b.area}`} style={{ width: `${b.ancho * 0.7}%` }} />
            <span className="valor">{b.valor}</span>
          </div>
        </div>
      ))}
      <ul className="vista-feed">
        <li><span className="icono interes-fondo" aria-hidden>★</span><span><strong>Descubrió un interés</strong><br />Completó dos niveles de Medicina.</span></li>
        <li><span className="icono derecho-fondo" aria-hidden>▶</span><span><strong>Empezó Derecho</strong><br />Nivel 1 de El tablero · hace 12 s</span></li>
      </ul>
      <figcaption className="tenue">Así lo ve la familia, mientras el alumno juega.</figcaption>
    </figure>
  );
}
