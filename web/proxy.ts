import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// /api/eventos autentica adentro y responde 401: el middleware, en una API, devolvería 404.
const esPublica = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/eventos']);

export default clerkMiddleware(async (auth, req) => {
  if (!esPublica(req)) await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
