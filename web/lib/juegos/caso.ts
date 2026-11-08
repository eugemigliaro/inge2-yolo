import { normalizar } from '../texto';

export type Diagnostico = {
  id: string;
  nombre: string;
  sistema: string;
  urgencia: number;
  edad: string;
  lugar: string;
};

export const CATALOGO: Diagnostico[] = [
  { id: 'resfrio', nombre: 'Resfrío', sistema: 'Respiratorio', urgencia: 1, edad: 'Cualquiera', lugar: 'Consultorio' },
  { id: 'faringitis', nombre: 'Faringitis', sistema: 'Respiratorio', urgencia: 2, edad: 'Cualquiera', lugar: 'Consultorio' },
  { id: 'neumonia', nombre: 'Neumonía', sistema: 'Respiratorio', urgencia: 4, edad: 'Adulto', lugar: 'Guardia' },
  { id: 'asma', nombre: 'Crisis de asma', sistema: 'Respiratorio', urgencia: 4, edad: 'Niñez', lugar: 'Guardia' },
  { id: 'esguince', nombre: 'Esguince', sistema: 'Huesos', urgencia: 2, edad: 'Cualquiera', lugar: 'Guardia' },
  { id: 'fractura', nombre: 'Fractura', sistema: 'Huesos', urgencia: 3, edad: 'Cualquiera', lugar: 'Guardia' },
  { id: 'apendicitis', nombre: 'Apendicitis', sistema: 'Digestivo', urgencia: 5, edad: 'Cualquiera', lugar: 'Quirófano' },
  { id: 'gastro', nombre: 'Gastroenteritis', sistema: 'Digestivo', urgencia: 2, edad: 'Cualquiera', lugar: 'Consultorio' },
  { id: 'infarto', nombre: 'Infarto', sistema: 'Corazón', urgencia: 5, edad: 'Mayor', lugar: 'Guardia' },
  { id: 'hipertension', nombre: 'Hipertensión', sistema: 'Corazón', urgencia: 3, edad: 'Mayor', lugar: 'Consultorio' },
  { id: 'otitis', nombre: 'Otitis', sistema: 'Oído', urgencia: 2, edad: 'Niñez', lugar: 'Consultorio' },
  { id: 'migrana', nombre: 'Migraña', sistema: 'Nervioso', urgencia: 2, edad: 'Adulto', lugar: 'Consultorio' },
];

// Nivel 1 se descarta de a grupos (la urgencia 1 es única). Nivel 2 comparte sistema y lugar.
// Nivel 3 se diferencia de la neumonía solo por la edad.
const SECRETOS = ['resfrio', 'fractura', 'asma'];

const EDAD_CERCA: Record<string, string> = { Adulto: 'Mayor', Mayor: 'Adulto' };
const LUGAR_CERCA: Record<string, string> = { Guardia: 'Quirófano', 'Quirófano': 'Guardia' };

export type ResultadoFicha = 'igual' | 'cerca' | 'distinto';
export type Ficha = { nombre: string; valor: string; resultado: ResultadoFicha; flecha?: 'más' | 'menos' };
export type EstadoCaso = { completado: boolean; intentos: { nombre: string; fichas: Ficha[]; acierto: boolean }[] };

export const estadoCaso = (): EstadoCaso => ({ completado: false, intentos: [] });

export function secretoDe(nivel: number) {
  return CATALOGO.find((d) => d.id === SECRETOS[nivel - 1]);
}

function fichaCat(nombre: string, secreto: string, guess: string, cercaDe: Record<string, string>): Ficha {
  const resultado: ResultadoFicha = secreto === guess ? 'igual' : cercaDe[secreto] === guess ? 'cerca' : 'distinto';
  return { nombre, valor: guess, resultado };
}

export function comparar(secreto: Diagnostico, guess: Diagnostico): Ficha[] {
  const urgencia: Ficha = {
    nombre: 'Urgencia',
    valor: String(guess.urgencia),
    resultado: secreto.urgencia === guess.urgencia ? 'igual' : Math.abs(secreto.urgencia - guess.urgencia) === 1 ? 'cerca' : 'distinto',
  };
  if (secreto.urgencia !== guess.urgencia) urgencia.flecha = secreto.urgencia > guess.urgencia ? 'más' : 'menos';
  return [
    fichaCat('Sistema', secreto.sistema, guess.sistema, {}),
    urgencia,
    fichaCat('Edad', secreto.edad, guess.edad, EDAD_CERCA),
    fichaCat('Dónde', secreto.lugar, guess.lugar, LUGAR_CERCA),
  ];
}

export function intentarCaso(nivel: number, respuesta: string, estado: EstadoCaso) {
  const secreto = secretoDe(nivel);
  const guess = CATALOGO.find((d) => normalizar(d.nombre) === normalizar(respuesta));
  if (!secreto || !guess) {
    return { publicar: false, completado: false, estado, cuerpo: { enCatalogo: false, acierto: false, completado: false } };
  }
  const fichas = comparar(secreto, guess);
  const acierto = guess.id === secreto.id;
  const cerca = !acierto && fichas.some((f) => f.resultado !== 'distinto');
  const completado = acierto && !estado.completado;
  const siguiente: EstadoCaso = {
    completado: estado.completado || acierto,
    intentos: [...estado.intentos, { nombre: guess.nombre, fichas, acierto }],
  };
  return {
    publicar: true,
    acierto,
    cerca,
    completado,
    estado: siguiente,
    cuerpo: { enCatalogo: true, acierto, cerca, fichas, completado: siguiente.completado },
  };
}
