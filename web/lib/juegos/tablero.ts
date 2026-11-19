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
  { id: 'autor', nombre: 'Derechos de autor' },
  { id: 'ambiente', nombre: 'Ambiente' },
];

type Nivel = { titulo: string; estantes: string[]; situaciones: Situacion[] };
const CUATRO = ['contrato', 'falta', 'familia', 'trabajo'];
const SEIS = [...CUATRO, 'consumo', 'estado'];
const OCHO = [...SEIS, 'autor', 'ambiente'];

// La dificultad sube de a un paso por nivel:
// 1. Tres situaciones evidentes. 2. Una por estante. 3. El sueldo impago parece una falta, y es trabajo.
// 4. El doble de situaciones. 5. Todas tienen una palabra que lleva al estante equivocado.
// 6. Aparecen Consumo y Estado, que se confunden con Contrato y con Falta.
// 7. Aparecen Derechos de autor y Ambiente. 8. Diez situaciones en ocho estantes.
// 9. Cada situación toca dos ramas: va donde está el conflicto, no donde suena.
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
    titulo: 'Dos estantes nuevos', estantes: SEIS, situaciones: [
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
  {
    titulo: 'Ocho estantes', estantes: OCHO, situaciones: [
      { id: 'pelicula', texto: 'Subís a internet una película entera que no es tuya.', estante: 'autor' },
      { id: 'foto-ajena', texto: 'Una marca usa la foto de un fotógrafo en una publicidad sin pedirle permiso.', estante: 'autor' },
      { id: 'rio', texto: 'Una fábrica tira residuos tóxicos a un río.', estante: 'ambiente' },
      { id: 'bosque', texto: 'Desmontan un bosque nativo protegido para sembrar.', estante: 'ambiente' },
      { id: 'cuenta', texto: 'Alguien adivina tu contraseña y entra a tu cuenta para sacarte plata.', estante: 'falta' },
      { id: 'compra-online', texto: 'Comprás algo por internet, lo pagás y nunca llega.', estante: 'consumo' },
      { id: 'domingos', texto: 'Te hacen trabajar todos los domingos sin pagarte las horas extra.', estante: 'trabajo' },
      { id: 'cuota', texto: 'Una madre pide que el padre de su hijo pague una cuota alimentaria.', estante: 'familia' },
    ],
  },
  {
    titulo: 'Diez casos', estantes: OCHO, situaciones: [
      { id: 'remeras', texto: 'Un compañero vende remeras con un dibujo que hiciste vos, sin tu permiso.', estante: 'autor' },
      { id: 'humo', texto: 'Una empresa quema basura todos los días y el humo llega a todo el barrio.', estante: 'ambiente' },
      { id: 'agua', texto: 'Una minera usa tanta agua que el pueblo se queda sin.', estante: 'ambiente' },
      { id: 'heladera', texto: 'La heladera que compraste se rompe a los dos meses y no te la arreglan.', estante: 'consumo' },
      { id: 'licencia-conducir', texto: 'Te niegan la licencia de conducir porque no aprobaste el examen.', estante: 'estado' },
      { id: 'aguinaldo', texto: 'No te pagan el aguinaldo de diciembre.', estante: 'trabajo' },
      { id: 'herencia', texto: 'Dos hermanos discuten cómo repartir la casa que les dejó su madre.', estante: 'familia' },
      { id: 'premio-falso', texto: 'Te llaman por un premio falso y te sacan los datos de la tarjeta.', estante: 'falta' },
      { id: 'auto-prestado', texto: 'Le prestás el auto a un amigo y acuerdan que lo devuelve el lunes.', estante: 'contrato' },
      { id: 'carpinteria', texto: 'Contratás a un carpintero para que te haga una mesa por un precio cerrado.', estante: 'contrato' },
    ],
  },
  {
    titulo: 'Lo que más pesa', estantes: OCHO, situaciones: [
      { id: 'caja', texto: 'Una empleada se lleva plata de la caja del negocio donde trabaja.', estante: 'falta' },
      { id: 'casco', texto: 'En la fábrica no te dan casco y te lastimás trabajando.', estante: 'trabajo' },
      { id: 'embarazo', texto: 'Despiden a una empleada porque está embarazada.', estante: 'trabajo' },
      { id: 'curtiembre', texto: 'Una curtiembre contamina el arroyo y los vecinos se enferman.', estante: 'ambiente' },
      { id: 'alquiler-nuevo', texto: 'Después de divorciarse, tu mamá alquila un departamento.', estante: 'contrato' },
      { id: 'compras-juego', texto: 'Un juego del celular te cobra compras que hizo tu hermanito sin que nadie se diera cuenta.', estante: 'consumo' },
      { id: 'boliche', texto: 'Un boliche pasa música todas las noches sin pagarles a los autores.', estante: 'autor' },
      { id: 'tutela', texto: 'Un juez nombra a una tía para que cuide a un chico que se quedó sin padres.', estante: 'familia' },
      { id: 'impuestos', texto: 'El fisco te reclama los impuestos que no pagaste de tu emprendimiento.', estante: 'estado' },
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
