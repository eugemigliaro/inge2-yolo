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
  { id: 'sinusitis', nombre: 'Sinusitis', sistema: 'Respiratorio', urgencia: 2, edad: 'Adulto', lugar: 'Consultorio' },
  { id: 'bronquiolitis', nombre: 'Bronquiolitis', sistema: 'Respiratorio', urgencia: 3, edad: 'Niñez', lugar: 'Guardia' },
  { id: 'neumonia', nombre: 'Neumonía', sistema: 'Respiratorio', urgencia: 4, edad: 'Adulto', lugar: 'Guardia' },
  { id: 'asma', nombre: 'Crisis de asma', sistema: 'Respiratorio', urgencia: 4, edad: 'Niñez', lugar: 'Guardia' },
  { id: 'tendinitis', nombre: 'Tendinitis', sistema: 'Huesos y músculos', urgencia: 1, edad: 'Adulto', lugar: 'Consultorio' },
  { id: 'esguince', nombre: 'Esguince', sistema: 'Huesos y músculos', urgencia: 2, edad: 'Cualquiera', lugar: 'Guardia' },
  { id: 'fractura', nombre: 'Fractura', sistema: 'Huesos y músculos', urgencia: 3, edad: 'Cualquiera', lugar: 'Guardia' },
  { id: 'luxacion', nombre: 'Luxación de hombro', sistema: 'Huesos y músculos', urgencia: 3, edad: 'Adulto', lugar: 'Guardia' },
  { id: 'celiaquia', nombre: 'Celiaquía', sistema: 'Digestivo', urgencia: 1, edad: 'Cualquiera', lugar: 'Consultorio' },
  { id: 'reflujo', nombre: 'Reflujo', sistema: 'Digestivo', urgencia: 1, edad: 'Adulto', lugar: 'Consultorio' },
  { id: 'gastro', nombre: 'Gastroenteritis', sistema: 'Digestivo', urgencia: 2, edad: 'Cualquiera', lugar: 'Consultorio' },
  { id: 'intoxicacion', nombre: 'Intoxicación alimentaria', sistema: 'Digestivo', urgencia: 3, edad: 'Cualquiera', lugar: 'Guardia' },
  { id: 'ulcera', nombre: 'Úlcera gástrica', sistema: 'Digestivo', urgencia: 3, edad: 'Adulto', lugar: 'Consultorio' },
  { id: 'hernia', nombre: 'Hernia', sistema: 'Digestivo', urgencia: 3, edad: 'Adulto', lugar: 'Quirófano' },
  { id: 'pancreatitis', nombre: 'Pancreatitis', sistema: 'Digestivo', urgencia: 4, edad: 'Adulto', lugar: 'Guardia' },
  { id: 'colecistitis', nombre: 'Colecistitis', sistema: 'Digestivo', urgencia: 4, edad: 'Adulto', lugar: 'Quirófano' },
  { id: 'apendicitis', nombre: 'Apendicitis', sistema: 'Digestivo', urgencia: 5, edad: 'Cualquiera', lugar: 'Quirófano' },
  { id: 'hipertension', nombre: 'Hipertensión', sistema: 'Corazón', urgencia: 3, edad: 'Mayor', lugar: 'Consultorio' },
  { id: 'arritmia', nombre: 'Arritmia', sistema: 'Corazón', urgencia: 4, edad: 'Mayor', lugar: 'Guardia' },
  { id: 'infarto', nombre: 'Infarto', sistema: 'Corazón', urgencia: 5, edad: 'Mayor', lugar: 'Guardia' },
  { id: 'migrana', nombre: 'Migraña', sistema: 'Nervioso', urgencia: 2, edad: 'Adulto', lugar: 'Consultorio' },
  { id: 'conmocion', nombre: 'Conmoción cerebral', sistema: 'Nervioso', urgencia: 3, edad: 'Cualquiera', lugar: 'Guardia' },
  { id: 'meningitis', nombre: 'Meningitis', sistema: 'Nervioso', urgencia: 5, edad: 'Cualquiera', lugar: 'Guardia' },
  { id: 'acv', nombre: 'ACV', sistema: 'Nervioso', urgencia: 5, edad: 'Mayor', lugar: 'Guardia' },
  { id: 'otitis', nombre: 'Otitis', sistema: 'Oído', urgencia: 2, edad: 'Niñez', lugar: 'Consultorio' },
  { id: 'conjuntivitis', nombre: 'Conjuntivitis', sistema: 'Ojos', urgencia: 1, edad: 'Cualquiera', lugar: 'Consultorio' },
  { id: 'varicela', nombre: 'Varicela', sistema: 'Piel', urgencia: 2, edad: 'Niñez', lugar: 'Consultorio' },
  { id: 'quemadura', nombre: 'Quemadura', sistema: 'Piel', urgencia: 3, edad: 'Cualquiera', lugar: 'Guardia' },
  { id: 'urinaria', nombre: 'Infección urinaria', sistema: 'Urinario', urgencia: 2, edad: 'Adulto', lugar: 'Consultorio' },
  { id: 'calculo', nombre: 'Cálculo renal', sistema: 'Urinario', urgencia: 4, edad: 'Adulto', lugar: 'Guardia' },
  { id: 'anemia', nombre: 'Anemia', sistema: 'Sangre', urgencia: 2, edad: 'Cualquiera', lugar: 'Consultorio' },
  { id: 'diabetes', nombre: 'Diabetes', sistema: 'Hormonas', urgencia: 3, edad: 'Adulto', lugar: 'Consultorio' },
];

// Cada nivel tiene su propia lista: más larga y con diagnósticos más parecidos a medida que se avanza.
// En cada lista, las cuatro fichas del diagnóstico escondido no se repiten en ningún otro, así siempre se puede deducir.
// 1. Seis opciones bien distintas. 2. La fractura comparte parte del cuerpo y lugar con el esguince.
// 3. La crisis de asma se diferencia de la neumonía solo por la edad. 4. Partes del cuerpo nuevas: esa ficha casi no ayuda.
// 5. Todo es digestivo: la parte del cuerpo siempre da igual. 6. Pares casi gemelos: luxación y fractura difieren solo en la edad.
export const NIVELES: { titulo: string; secreto: string; opciones: string[] }[] = [
  { titulo: 'Primer paciente', secreto: 'resfrio', opciones: ['resfrio', 'conjuntivitis', 'otitis', 'fractura', 'apendicitis', 'infarto'] },
  {
    titulo: 'Se parece a otros', secreto: 'fractura',
    opciones: ['resfrio', 'faringitis', 'esguince', 'fractura', 'gastro', 'hipertension', 'otitis', 'migrana'],
  },
  {
    titulo: 'Una sola ficha distinta', secreto: 'asma',
    opciones: ['resfrio', 'faringitis', 'bronquiolitis', 'neumonia', 'asma', 'esguince', 'fractura', 'apendicitis', 'infarto', 'otitis'],
  },
  {
    titulo: 'Otras partes del cuerpo', secreto: 'diabetes',
    opciones: ['conjuntivitis', 'varicela', 'quemadura', 'urinaria', 'calculo', 'diabetes', 'anemia', 'conmocion', 'migrana', 'gastro', 'tendinitis', 'otitis'],
  },
  {
    titulo: 'Dolor de panza', secreto: 'ulcera',
    opciones: ['celiaquia', 'reflujo', 'gastro', 'intoxicacion', 'ulcera', 'hernia', 'pancreatitis', 'colecistitis', 'apendicitis'],
  },
  {
    titulo: 'Casi gemelos', secreto: 'luxacion',
    opciones: [
      'infarto', 'arritmia', 'hipertension', 'acv', 'meningitis', 'conmocion', 'migrana', 'fractura',
      'luxacion', 'esguince', 'faringitis', 'sinusitis', 'neumonia', 'asma', 'apendicitis', 'calculo',
    ],
  },
];

export const opcionesDe = (nivel: number) =>
  (NIVELES[nivel - 1]?.opciones ?? []).map((id) => CATALOGO.find((d) => d.id === id)!);

// Los que aparecen por primera vez en este nivel.
export const nuevosEn = (nivel: number) =>
  nivel === 1 ? [] : opcionesDe(nivel).filter((d) => !NIVELES.slice(0, nivel - 1).some((n) => n.opciones.includes(d.id))).map((d) => d.nombre);

const EDAD_CERCA: Record<string, string> = { Adulto: 'Mayor', Mayor: 'Adulto' };
const LUGAR_CERCA: Record<string, string> = { Guardia: 'Quirófano', 'Quirófano': 'Guardia' };

export type ResultadoFicha = 'igual' | 'cerca' | 'distinto';
export type Ficha = { nombre: string; valor: string; resultado: ResultadoFicha; flecha?: 'más' | 'menos' };
export type EstadoCaso = { completado: boolean; intentos: { nombre: string; fichas: Ficha[]; acierto: boolean }[] };

export const estadoCaso = (): EstadoCaso => ({ completado: false, intentos: [] });

export function secretoDe(nivel: number) {
  return CATALOGO.find((d) => d.id === NIVELES[nivel - 1]?.secreto);
}

function fichaCat(nombre: string, secreto: string, guess: string, cercaDe: Record<string, string>): Ficha {
  const resultado: ResultadoFicha = secreto === guess ? 'igual' : cercaDe[secreto] === guess ? 'cerca' : 'distinto';
  return { nombre, valor: guess, resultado };
}

export function comparar(secreto: Diagnostico, guess: Diagnostico): Ficha[] {
  const urgencia: Ficha = {
    nombre: 'Gravedad',
    valor: String(guess.urgencia),
    resultado: secreto.urgencia === guess.urgencia ? 'igual' : Math.abs(secreto.urgencia - guess.urgencia) === 1 ? 'cerca' : 'distinto',
  };
  if (secreto.urgencia !== guess.urgencia) urgencia.flecha = secreto.urgencia > guess.urgencia ? 'más' : 'menos';
  return [
    fichaCat('Parte del cuerpo', secreto.sistema, guess.sistema, {}),
    urgencia,
    fichaCat('Edad típica', secreto.edad, guess.edad, EDAD_CERCA),
    fichaCat('Dónde se atiende', secreto.lugar, guess.lugar, LUGAR_CERCA),
  ];
}

export function intentarCaso(nivel: number, respuesta: string, estado: EstadoCaso) {
  const secreto = secretoDe(nivel);
  const guess = opcionesDe(nivel).find((d) => normalizar(d.nombre) === normalizar(respuesta));
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
    cuerpo: { enCatalogo: true, nombre: guess.nombre, acierto, cerca, fichas, completado: siguiente.completado },
  };
}
