// Consumidor "alertas": lee el mismo tópico que el proyector, en otro grupo, y avisa al tutor por email.
import nodemailer from 'nodemailer';
import { consumir, db, type EventoJuego } from './comun.ts';
import { descubrioInteres, detectarFrustracion } from './reglas.ts';

const mail = nodemailer.createTransport({ host: process.env.SMTP_HOST ?? 'localhost', port: Number(process.env.SMTP_PORT ?? 1025) });

// shortcut: la racha de abandonos vive en memoria y se pierde si el proceso reinicia; persistirla si la alerta pasa a ser crítica.
const rachas = new Map<string, number[]>();

async function alertar(id: string, ev: EventoJuego, tipo: 'interes' | 'frustracion', mensaje: string) {
  const nueva = await db.query(
    'insert into alertas (id, alumno_id, tipo, area, mensaje, creada) values ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0)) on conflict do nothing',
    [id, ev.alumnoId, tipo, ev.area, mensaje, ev.ts]);
  if (nueva.rowCount === 0) return; // ya se avisó (reproceso o reenvío)
  // shortcut: si el email falla después del insert, la alerta queda en el dashboard pero sin email; usar un outbox si el email se vuelve crítico.

  // Los datos personales se resuelven recién acá, fuera del canal de eventos.
  const { rows } = await db.query(
    `select t.email, t.nombre as tutor, a.nombre as alumno from tutor_alumno ta
     join usuarios t on t.id = ta.tutor_id join usuarios a on a.id = ta.alumno_id where ta.alumno_id = $1`, [ev.alumnoId]);
  for (const r of rows) {
    await mail.sendMail({
      from: 'YOLO <avisos@yolo.test>',
      to: r.email,
      subject: tipo === 'interes' ? `${r.alumno} descubrió un interés en ${ev.areaNombre}` : `${r.alumno} podría estar frustrado/a`,
      text: `Hola ${r.tutor}:\n\n${r.alumno} ${mensaje}\n\nPodés ver su recorrido completo en el dashboard de YOLO.`,
    });
  }
}

await consumir('alertas-tutor', async (ev) => {
  if (descubrioInteres(ev)) {
    await alertar(`interes:${ev.alumnoId}:${ev.area}`, ev, 'interes',
      `completó los ${ev.totalNiveles} niveles de ${ev.areaNombre}. Es un buen momento para conversar sobre esa área.`);
  }
  const r = detectarFrustracion(rachas.get(ev.alumnoId) ?? [], ev);
  rachas.set(ev.alumnoId, r.abandonos);
  if (r.frustrado) {
    await alertar(`frustracion:${ev.eventId}`, ev, 'frustracion',
      `abandonó 3 niveles seguidos en menos de un minuto (el último, de ${ev.areaNombre}). Puede que el contenido no lo/la esté enganchando.`);
  }
});
