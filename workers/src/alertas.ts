// Consumidor "alertas": lee el mismo tópico que el proyector, en otro grupo, y avisa por email.
// El estado de la racha queda en Postgres, así un reinicio o un replay no lo pierde.
import nodemailer from 'nodemailer';
import { consumir, db, type EventoJuego } from './comun.ts';
import { aplicarEventoAlerta, estadoAlertasVacio, type EstadoAlertas } from './reglas.ts';

const mail = nodemailer.createTransport({ host: process.env.SMTP_HOST ?? 'localhost', port: Number(process.env.SMTP_PORT ?? 1025) });

async function avisar(id: string, ev: EventoJuego, tipo: 'interes' | 'frustracion', mensaje: string) {
  const nueva = await db.query(
    'insert into alertas (id, alumno_id, tipo, area, mensaje, creada) values ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0)) on conflict do nothing',
    [id, ev.alumnoId, tipo, ev.area, mensaje, ev.ts]);
  if (nueva.rowCount === 0) return;
  // Si el email falla después del insert, la alerta queda en el dashboard pero sin email.

  const { rows } = await db.query(
    `select distinct t.email, t.nombre as tutor, a.nombre as alumno
     from usuarios a
     join (
       select padre_id as adulto from vinculo_padre where alumno_id = $1
       union
       select pc.profesor_id from profesor_curso pc
       join alumno_curso ac on ac.curso_id = pc.curso_id
       where ac.alumno_id = $1
     ) v on true
     join usuarios t on t.id = v.adulto
     where a.id = $1`, [ev.alumnoId]);
  for (const r of rows) {
    await mail.sendMail({
      from: 'YOLO <avisos@yolo.test>',
      to: r.email,
      subject: tipo === 'interes' ? `${r.alumno} descubrió un interés en ${ev.areaNombre}` : `${r.alumno} podría estar frustrado/a`,
      text: `Hola ${r.tutor}:\n\n${r.alumno} ${mensaje}\n\nPodés ver su recorrido completo en el dashboard de YOLO.`,
    });
  }
}

async function alertar(ev: EventoJuego) {
  const cx = await db.connect();
  let resultado: { interes: boolean; frustracion: boolean } = { interes: false, frustracion: false };
  try {
    await cx.query('begin');
    const nuevo = await cx.query('insert into alertas_procesadas (event_id) values ($1) on conflict do nothing', [ev.eventId]);
    if (nuevo.rowCount === 0) {
      await cx.query('rollback');
      return;
    }
    const { rows } = await cx.query('select estado from alerta_estado where alumno_id = $1 for update', [ev.alumnoId]);
    const prev = (rows[0]?.estado ?? estadoAlertasVacio()) as EstadoAlertas;
    const aplicado = aplicarEventoAlerta({ areas: prev.areas ?? {}, visitas: prev.visitas ?? {} }, ev);
    resultado = aplicado;
    await cx.query(
      `insert into alerta_estado (alumno_id, estado) values ($1, $2)
       on conflict (alumno_id) do update set estado = excluded.estado`,
      [ev.alumnoId, JSON.stringify(aplicado.estado)]);
    await cx.query('commit');
  } catch (e) {
    await cx.query('rollback');
    throw e;
  } finally {
    cx.release();
  }

  if (resultado.interes) {
    await avisar(`interes:${ev.alumnoId}:${ev.area}`, ev, 'interes',
      `completó dos niveles de ${ev.areaNombre}. Es un buen momento para conversar sobre esa área.`);
  }
  if (resultado.frustracion) {
    await avisar(`frustracion:${ev.eventId}`, ev, 'frustracion',
      `salió dos veces del mismo nivel de ${ev.areaNombre}, las dos después de haber intentado. Puede que ese nivel no lo esté enganchando.`);
  }
}

await consumir('alertas-tutor', alertar);
