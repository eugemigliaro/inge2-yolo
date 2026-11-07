// Consumidor "proyector": convierte el flujo de eventos en el modelo de lectura del dashboard.
// Cada evento se aplica en una transacción junto con su id, así un reenvío o un reproceso no duplica nada.
import { consumir, db, type EventoJuego } from './comun.ts';
import { dia, siguienteEstado, tiempoEfectivo, type Estado } from './reglas.ts';

async function proyectar(ev: EventoJuego) {
  const cx = await db.connect();
  try {
    await cx.query('begin');
    const nuevo = await cx.query('insert into eventos_procesados (event_id) values ($1) on conflict do nothing', [ev.eventId]);
    if (nuevo.rowCount === 0) return void (await cx.query('rollback'));

    const { rows } = await cx.query('select * from recorrido_estado where alumno_id = $1 for update', [ev.alumnoId]);
    const prev: Estado | undefined = rows[0] && {
      ultimoTs: Number(rows[0].ultimo_ts), ultimoTipo: rows[0].ultimo_tipo, ultimaArea: rows[0].ultima_area, sesiones: rows[0].sesiones,
    };

    const t = tiempoEfectivo(prev, ev.ts);
    if (t) {
      await cx.query(
        `insert into progreso_area (alumno_id, area, tiempo_ms) values ($1, $2, $3)
         on conflict (alumno_id, area) do update set tiempo_ms = progreso_area.tiempo_ms + $3`,
        [ev.alumnoId, t.area, t.ms]);
      await cx.query(
        `insert into actividad_diaria (alumno_id, dia, area, tiempo_ms) values ($1, $2, $3, $4)
         on conflict (alumno_id, dia, area) do update set tiempo_ms = actividad_diaria.tiempo_ms + $4`,
        [ev.alumnoId, dia(ev.ts), t.area, t.ms]);
    }

    const es = (tipo: EventoJuego['tipo']) => (ev.tipo === tipo ? 1 : 0);
    await cx.query(
      `insert into progreso_area (alumno_id, area, decisiones, aciertos, completados, abandonos, nivel_max, ultima_actividad)
       values ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8 / 1000.0))
       on conflict (alumno_id, area) do update set
         decisiones = progreso_area.decisiones + excluded.decisiones,
         aciertos = progreso_area.aciertos + excluded.aciertos,
         completados = progreso_area.completados + excluded.completados,
         abandonos = progreso_area.abandonos + excluded.abandonos,
         nivel_max = greatest(progreso_area.nivel_max, excluded.nivel_max),
         ultima_actividad = greatest(progreso_area.ultima_actividad, excluded.ultima_actividad)`,
      [ev.alumnoId, ev.area, es('decision'), ev.correcta ? 1 : 0, es('nivel_completado'), es('nivel_abandonado'),
        es('nivel_completado') * ev.nivel, ev.ts]);

    const s = siguienteEstado(prev, ev);
    await cx.query(
      `insert into recorrido_estado values ($1, $2, $3, $4, $5)
       on conflict (alumno_id) do update set ultimo_ts = $2, ultimo_tipo = $3, ultima_area = $4, sesiones = $5`,
      [ev.alumnoId, s.ultimoTs, s.ultimoTipo, s.ultimaArea, s.sesiones]);
    await cx.query('commit');
  } catch (e) {
    await cx.query('rollback');
    throw e; // el consumidor reintenta el mismo mensaje
  } finally {
    cx.release();
  }
}

await consumir('dashboard-proyector', proyectar);
