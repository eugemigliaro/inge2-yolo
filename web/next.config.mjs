/** @type {import('next').NextConfig} */
export default {
  // Cliente nativo de Kafka (librdkafka): se carga desde node_modules, no se empaqueta.
  serverExternalPackages: ['@confluentinc/kafka-javascript'],
  env: {
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: '/',
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: '/onboarding',
  },
};
