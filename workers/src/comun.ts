import kafkaPkg from '@confluentinc/kafka-javascript';
import pg from 'pg';

export const TOPICO = 'juego.eventos';

// Contrato del evento que circula por Kafka. No lleva el texto escrito ni datos personales.
export type EventoJuego = {
  eventId: string;
  alumnoId: string;
  tipo: 'nivel_iniciado' | 'intento' | 'nivel_completado' | 'nivel_abandonado';
  area: string;
  areaNombre: string;
  nivel: number;
  totalNiveles: number;
  acierto?: boolean; // solo en 'intento'
  cerca?: boolean; // El caso: alguna ficha coincidió o estuvo cerca
  rareza?: 'obvia' | 'comun' | 'rara'; // La bajada, solo si la respuesta entró al banco
  ts: number; // epoch ms, lo asigna el servidor al recibir el evento
};

export const kafka = new kafkaPkg.KafkaJS.Kafka({
  kafkaJS: { brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',') },
});

export const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Arranca un consumidor de su propio grupo: cada grupo recibe todos los eventos (publish–subscribe).
export async function consumir(groupId: string, procesar: (ev: EventoJuego) => Promise<void>) {
  const consumer = kafka.consumer({ kafkaJS: { groupId, fromBeginning: true } });
  await consumer.connect();
  await consumer.subscribe({ topics: [TOPICO] });
  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      const ev = JSON.parse(message.value!.toString()) as EventoJuego;
      await procesar(ev);
      console.log(`[${groupId}] p${partition}@${message.offset} ${ev.tipo} ${ev.area} n${ev.nivel}`);
    },
  });
  for (const senal of ['SIGTERM', 'SIGINT']) {
    process.once(senal, async () => {
      await consumer.disconnect();
      await db.end();
      process.exit(0);
    });
  }
}
