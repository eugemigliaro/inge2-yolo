import kafkaPkg from '@confluentinc/kafka-javascript';

export const TOPICO = 'juego.eventos';

const kafka = new kafkaPkg.KafkaJS.Kafka({ kafkaJS: { brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',') } });
let conectado: Promise<kafkaPkg.KafkaJS.Producer> | undefined;

// Un solo productor por proceso. Idempotente: un reintento interno del cliente no duplica el mensaje en el log.
export async function publicar(eventos: { alumnoId: string }[]) {
  if (eventos.length === 0) return;
  const p = await productor();
  await p.send({ topic: TOPICO, messages: eventos.map((e) => ({ key: e.alumnoId, value: JSON.stringify(e) })) });
}

export function productor() {
  conectado ??= (async () => {
    const p = kafka.producer({ kafkaJS: { idempotent: true } });
    await p.connect();
    return p;
  })().catch((e) => {
    conectado = undefined; // el próximo pedido vuelve a intentar
    throw e;
  });
  return conectado;
}
