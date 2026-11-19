export type Situacion = { id: string; texto: string; estante: string };
export type Puesta = { id: string; estante: string };
export type EstadoTablero = { completado: boolean; correctas: string[]; puestas: Puesta[] };

export const ESTANTES = [
  { id: 'contrato', nombre: 'Contrato' },
  { id: 'falta', nombre: 'Falta' },
  { id: 'familia', nombre: 'Familia' },
  { id: 'trabajo', nombre: 'Trabajo' },
  { id: 'consumo', nombre: 'Consumo' },
  { id: 'estado', nombre: 'Estado' },
];

type Nivel = { titulo: string; estantes: string[]; situaciones: Situacion[] };
const CUATRO = ['contrato', 'falta', 'familia', 'trabajo'];

// La dificultad sube de a un paso por nivel:
// 1. Tres situaciones evidentes. 2. Una por estante. 3. El sueldo impago parece una falta, y es trabajo.
// 4. El doble de situaciones. 5. Todas tienen una palabra que lleva al estante equivocado.
// 6. Aparecen Consumo y Estado, que se confunden con Contrato y con Falta.
export const NIVELES: Nivel[] = [
  {
    titulo: 'Tres casos claros', estantes: CUATRO, situaciones: [
      { id: 'alquiler', texto: 'Firmás el alquiler de un departamento.', estante: 'contrato' },
      { id: 'mochila', texto: 'Te roban la mochila en la calle.', estante: 'falta' },
      { id: 'divorcio', texto: 'Tus padres deciden divorciarse.', estante: 'familia' },
    ],
  },
  {
    titulo: 'Uno por estante', estantes: CUATRO, situaciones: [
      { id: 'auto', texto: 'Comprás un auto usado y firmás los papeles.', estante: 'contrato' },
      { id: 'ventana', texto: 'En una pelea rompen la ventana de un negocio.', estante: 'falta' },
      { id: 'adopcion', texto: 'Una pareja empieza un trámite para adoptar.', estante: 'familia' },
      { id: 'sueldo', texto: 'Empezás a trabajar y te tienen que pagar el sueldo.', estante: 'trabajo' },
    ],
  },
  {
    titulo: 'El que parece otra cosa', estantes: CUATRO, situaciones: [
      { id: 'local', texto: 'Reservás un local y firmás el contrato.', estante: 'contrato' },
      { id: 'celular', texto: 'Alguien se lleva un celular que no es suyo.', estante: 'falta' },
      { id: 'tenencia', texto: 'Se discute con quién viven los hijos.', estante: 'familia' },
      { id: 'impago', texto: 'El jefe deja de pagarte el sueldo.', estante: 'trabajo' },
    ],
  },
  {
    titulo: 'Dos por estante', estantes: CUATRO, situaciones: [
      { id: 'bici', texto: 'Le vendés tu bici a un vecino y acuerdan el precio.', estante: 'contrato' },
      { id: 'salon', texto: 'Alquilás un salón para un cumpleaños.', estante: 'contrato' },
      { id: 'tele', texto: 'Entran a una casa y se llevan la tele.', estante: 'falta' },
      { id: 'amenaza', texto: 'Alguien te amenaza para que le des la plata.', estante: 'falta' },
      { id: 'casamiento', texto: 'Tus tíos se casan en el Registro Civil.', estante: 'familia' },
      { id: 'reconocimiento', texto: 'Un padre reconoce a su hijo y le da el apellido.', estante: 'familia' },
      { id: 'vacaciones', texto: 'Trabajás en un bar y te corresponden vacaciones pagas.', estante: 'trabajo' },
      { id: 'despido', texto: 'Te despiden después de tres años en una empresa.', estante: 'trabajo' },
    ],
  },
  {
    titulo: 'Las apariencias engañan', estantes: CUATRO, situaciones: [
      { id: 'contrato-laboral', texto: 'Firmás un contrato para entrar a trabajar en una empresa.', estante: 'trabajo' },
      { id: 'licencia', texto: 'Nace tu hija y pedís días de licencia en el trabajo.', estante: 'trabajo' },
      { id: 'divorcio-acuerdo', texto: 'Una pareja firma de común acuerdo cómo se divorcia.', estante: 'familia' },
      { id: 'deuda', texto: 'Un amigo no te devuelve la plata que le prestaste.', estante: 'contrato' },
      { id: 'deposito', texto: 'El dueño del departamento no te devuelve el depósito.', estante: 'contrato' },
      { id: 'billetera', texto: 'Encontrás una billetera en la calle y te la quedás.', estante: 'falta' },
    ],
  },
  {
    titulo: 'Dos estantes nuevos', estantes: ESTANTES.map((e) => e.id), situaciones: [
      { id: 'celular-roto', texto: 'Comprás un celular en un negocio, no anda y no te lo quieren cambiar.', estante: 'consumo' },
      { id: 'internet', texto: 'La empresa de internet te cobra un servicio que no pediste.', estante: 'consumo' },
      { id: 'bici-usada', texto: 'Le comprás la bici usada a un compañero y le pagás en cuotas.', estante: 'contrato' },
      { id: 'dni', texto: 'Sacás el DNI por primera vez.', estante: 'estado' },
      { id: 'habilitacion', texto: 'La municipalidad no te habilita un local para abrir un kiosco.', estante: 'estado' },
      { id: 'coima', texto: 'Un empleado público te pide plata para aprobar un trámite.', estante: 'falta' },
      { id: 'in-itinere', texto: 'Te accidentás en el camino de tu casa al trabajo.', estante: 'trabajo' },
      { id: 'abuela', texto: 'Una abuela pide que la dejen ver a sus nietos.', estante: 'familia' },
    ],
  },
];

export const estadoTablero = (): EstadoTablero => ({ completado: false, correctas: [], puestas: [] });

export function vistaTablero(nivel: number) {
  const datos = NIVELES[nivel - 1];
  const situaciones = (datos?.situaciones ?? []).map(({ id, texto }) => ({ id, texto }));
  return { situaciones, estantes: ESTANTES.filter((e) => datos?.estantes.includes(e.id)) };
}

export function intentarTablero(nivel: number, situacionId: string, estanteId: string, estado: EstadoTablero) {
  const datos = NIVELES[nivel - 1];
  const nivelDatos = datos?.situaciones ?? [];
  const situacion = nivelDatos.find((s) => s.id === situacionId);
  const estante = datos?.estantes.includes(estanteId) ? ESTANTES.find((e) => e.id === estanteId) : undefined;
  if (!situacion || !estante) {
    return { publicar: false, completado: false, estado, cuerpo: { acierto: false, completado: false, correctas: estado.correctas } };
  }
  if (estado.correctas.includes(situacion.id)) {
    return { publicar: false, completado: false, estado, cuerpo: { acierto: true, yaEstaba: true, completado: estado.completado, correctas: estado.correctas } };
  }
  const acierto = situacion.estante === estante.id;
  const previas = estado.puestas ?? [];
  const correctas = acierto ? [...estado.correctas, situacion.id] : estado.correctas;
  const puestas = acierto ? [...previas, { id: situacion.id, estante: estante.id }] : previas;
  const completo = correctas.length === nivelDatos.length;
  const completado = completo && !estado.completado;
  const siguiente: EstadoTablero = { correctas, puestas, completado: estado.completado || completo };
  return {
    publicar: true,
    acierto,
    completado,
    estado: siguiente,
    cuerpo: { acierto, correctas, puestas, completado: siguiente.completado },
  };
}
