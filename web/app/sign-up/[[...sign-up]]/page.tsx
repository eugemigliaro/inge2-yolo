import { SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default function PaginaRegistro() {
  return (
    <section className="clerk">
      <SignUp />
    </section>
  );
}
