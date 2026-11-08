import type { Usuario } from './auth';
import { db } from './db';

export async function alumnosDe(u: Usuario): Promise<{ id: string; nombre: string }[]> {
  if (u.rol === 'padre') {
    const { rows } = await db.query(
      `select u.id, u.nombre from vinculo_padre v
       join usuarios u on u.id = v.alumno_id
       where v.padre_id = $1 order by u.nombre`, [u.id]);
    return rows;
  }
  if (u.rol === 'profesor') {
    const { rows } = await db.query(
      `select distinct u.id, u.nombre from profesor_curso pc
       join alumno_curso ac on ac.curso_id = pc.curso_id
       join usuarios u on u.id = ac.alumno_id
       where pc.profesor_id = $1 order by u.nombre`, [u.id]);
    return rows;
  }
  return [];
}
