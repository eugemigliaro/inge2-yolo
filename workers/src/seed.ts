// Datos de prueba: dos semanas de historial de Juana, publicadas en Kafka como si vinieran del juego.
// Los ids son fijos, así que correrlo de nuevo no duplica nada en el proyector.
import { kafka, TOPICO } from './comun.ts';
import { historialJuana } from './historial-juana.ts';

const hoy = new Date(new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }) + 'T18:00:00-03:00').getTime();
const eventos = historialJuana(hoy);

const producer = kafka.producer({ kafkaJS: { idempotent: true } });
await producer.connect();
await producer.send({ topic: TOPICO, messages: eventos.map((e) => ({ key: e.alumnoId, value: JSON.stringify(e) })) });
await producer.disconnect();
console.log(`seed: ${eventos.length} eventos de Juana publicados en ${TOPICO}`);
