import { SignIn } from '@clerk/nextjs';

export default function PaginaIngreso() {
  return (
    <section className="login clerk">
      <SignIn />
    </section>
  );
}
