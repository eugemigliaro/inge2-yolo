// Datos de prueba: dos semanas de historial de Juana, publicadas en Kafka como si vinieran del juego.
// Los ids son fijos, así que correrlo de nuevo no duplica nada.
import { kafka, TOPICO, type EventoJuego } from './comun.ts';

const JUANA = '11111111-1111-4111-8111-111111111111';
const AREAS: Record<string, string> = { medicina: 'Medicina', sistemas: 'Sistemas', derecho: 'Derecho' };
const DIA = 86_400_000;
const hoy = new Date(new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }) + 'T18:00:00-03:00').getTime();

// [días atrás, área, nivel, resultado]
const partidas: [number, string, number, 'completado' | 'abandonado'][] = [
  [13, 'medicina', 1, 'completado'], [13, 'sistemas', 1, 'abandonado'],
  [11, 'medicina', 2, 'completado'],
  [9, 'derecho', 1, 'abandonado'], [8, 'sistemas', 1, 'completado'],
  [6, 'medicina', 3, 'completado'], [4, 'sistemas', 2, 'completado'],
];

const eventos: EventoJuego[] = [];
partidas.forEach(([dias, area, nivel, resultado], i) => {
  const t0 = hoy - dias * DIA + i * 5 * 60_000;
  const base = { alumnoId: JUANA, area, areaNombre: AREAS[area], nivel, totalNiveles: 3 };
  const ev = (j: number, tipo: EventoJuego['tipo'], ts: number, correcta?: boolean) =>
    eventos.push({ eventId: `seed-juana-${i}-${j}`, tipo, ts, ...base, ...(correcta === undefined ? {} : { correcta }) });
  ev(0, 'nivel_iniciado', t0);
  ev(1, 'decision', t0 + 40_000, true);
  if (resultado === 'completado') {
    ev(2, 'decision', t0 + 80_000, i % 2 === 0); // juega 100 s en total
    ev(3, 'nivel_completado', t0 + 100_000);
  } else {
    ev(2, 'nivel_abandonado', t0 + 70_000); // juega 70 s y abandona
  }
});

const producer = kafka.producer({ kafkaJS: { idempotent: true } });
await producer.connect();
await producer.send({ topic: TOPICO, messages: eventos.map((e) => ({ key: e.alumnoId, value: JSON.stringify(e) })) });
await producer.disconnect();
console.log(`seed: ${eventos.length} eventos de Juana publicados en ${TOPICO}`);
