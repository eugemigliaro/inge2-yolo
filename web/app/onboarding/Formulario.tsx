'use client';
import { startTransition, useActionState, useState, type FormEvent } from 'react';
import type { Rol } from '@/lib/auth';
import { elegirRol, type EstadoOnboarding } from './acciones';

const ROLES: { valor: Rol; nombre: string }[] = [
  { valor: 'alumno', nombre: 'Alumno' },
  { valor: 'padre', nombre: 'Padre, madre o tutor' },
  { valor: 'profesor', nombre: 'Profesor o personal del colegio' },
];

export function Formulario() {
  const [estado, accion, enviando] = useActionState<EstadoOnboarding, FormData>(elegirRol, null);
  const [rol, setRol] = useState<Rol | ''>('');
  const [codigos, setCodigos] = useState('');

  // Con <form action>, React resetea el formulario al terminar y desmarca el rol aunque haya error.
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => accion(datos));
  }

  return (
    <form onSubmit={enviar} className="formulario">
      <fieldset className="roles">
        <legend className="tenue">Rol</legend>
        {ROLES.map((r) => (
          <label key={r.valor} className="rol">
            <input type="radio" name="rol" value={r.valor} required checked={rol === r.valor} onChange={() => setRol(r.valor)} />
            {r.nombre}
          </label>
        ))}
      </fieldset>
      {(rol === 'padre' || rol === 'profesor') && (
        <label className="campo">
          {rol === 'padre' ? 'Códigos de tus hijos' : 'Código del curso'}
          <textarea
            className="entrada"
            name="codigos"
            rows={rol === 'padre' ? 3 : 1}
            required
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={rol === 'padre' ? 'Uno por línea' : 'Por ejemplo, 5TOB'}
            value={codigos}
            onChange={(e) => setCodigos(e.target.value)}
          />
        </label>
      )}
      {estado?.error && <p className="error" role="alert">{estado.error}</p>}
      <button className="boton" disabled={enviando}>{enviando ? 'Guardando…' : 'Continuar'}</button>
    </form>
  );
}
