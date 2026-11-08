export type Situacion = { id: string; texto: string; estante: string };
export type Puesta = { id: string; estante: string };
export type EstadoTablero = { completado: boolean; correctas: string[]; puestas: Puesta[] };

export const ESTANTES = [
  { id: 'contrato', nombre: 'Contrato' },
  { id: 'falta', nombre: 'Falta' },
  { id: 'familia', nombre: 'Familia' },
  { id: 'trabajo', nombre: 'Trabajo' },
];

// Nivel 1: cada situación entra en un estante evidente. Nivel 2: uno por estante.
// Nivel 3: el sueldo impago parece una falta, y es trabajo.
export const NIVELES: Situacion[][] = [
  [
    { id: 'alquiler', texto: 'Firmás el alquiler de un departamento.', estante: 'contrato' },
    { id: 'mochila', texto: 'Te roban la mochila en la calle.', estante: 'falta' },
    { id: 'divorcio', texto: 'Tus padres deciden divorciarse.', estante: 'familia' },
  ],
  [
    { id: 'auto', texto: 'Comprás un auto usado y firmás los papeles.', estante: 'contrato' },
    { id: 'ventana', texto: 'En una pelea rompen la ventana de un negocio.', estante: 'falta' },
    { id: 'adopcion', texto: 'Una pareja empieza un trámite para adoptar.', estante: 'familia' },
    { id: 'sueldo', texto: 'Empezás a trabajar y te tienen que pagar el sueldo.', estante: 'trabajo' },
  ],
  [
    { id: 'local', texto: 'Reservás un local y firmás el contrato.', estante: 'contrato' },
    { id: 'celular', texto: 'Alguien se lleva un celular que no es suyo.', estante: 'falta' },
    { id: 'tenencia', texto: 'Se discute con quién viven los hijos.', estante: 'familia' },
    { id: 'impago', texto: 'El jefe deja de pagarte el sueldo.', estante: 'trabajo' },
  ],
];

export const estadoTablero = (): EstadoTablero => ({ completado: false, correctas: [], puestas: [] });

export function vistaTablero(nivel: number) {
  const situaciones = (NIVELES[nivel - 1] ?? []).map(({ id, texto }) => ({ id, texto }));
  return { situaciones, estantes: ESTANTES };
}

export function intentarTablero(nivel: number, situacionId: string, estanteId: string, estado: EstadoTablero) {
  const nivelDatos = NIVELES[nivel - 1] ?? [];
  const situacion = nivelDatos.find((s) => s.id === situacionId);
  const estante = ESTANTES.find((e) => e.id === estanteId);
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
