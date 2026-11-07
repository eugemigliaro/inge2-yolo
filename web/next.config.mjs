/** @type {import('next').NextConfig} */
export default {
  // Cliente nativo de Kafka (librdkafka): se carga desde node_modules, no se empaqueta.
  serverExternalPackages: ['@confluentinc/kafka-javascript'],
};
