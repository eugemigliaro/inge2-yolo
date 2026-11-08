import { normalizar } from '../texto';

export type Rareza = 'obvia' | 'comun' | 'rara';
type Entrada = { texto: string; rareza: Rareza };
export type Aceptada = { texto: string; rareza: Rareza };
export type EstadoBajada = { completado: boolean; aceptadas: Aceptada[] };

type Nivel = { consigna: string; banco: Entrada[]; exige?: 'comun' | 'rara' };

export const PARA_COMPLETAR = 3;

const entrada = (rareza: Rareza, textos: string[]): Entrada[] => textos.map((texto) => ({ texto, rareza }));

export const NIVELES: Nivel[] = [
  {
    consigna: 'Nombrá algo que hay en un servidor.',
    banco: [
      ...entrada('obvia', ['disco', 'memoria', 'procesador', 'cpu', 'linux', 'archivo', 'ram', 'ssd', 'ventilador', 'fuente', 'cable', 'puerto', 'placa', 'sistema operativo', 'ubuntu', 'windows']),
      ...entrada('comun', ['backup', 'registro', 'base de datos', 'usuario', 'dns', 'firewall', 'certificado', 'ssh', 'proxy', 'caché', 'cron', 'log', 'proceso', 'servicio', 'partición', 'raid', 'dirección ip', 'cola']),
      ...entrada('rara', ['hipervisor', 'balanceador', 'contenedor', 'kernel', 'inode', 'swap', 'kvm', 'cgroup', 'namespace', 'ipmi', 'numa', 'iscsi']),
    ],
  },
  {
    consigna: 'Nombrá por qué una aplicación se pone lenta.',
    exige: 'comun',
    banco: [
      ...entrada('obvia', ['internet', 'muchos usuarios', 'computadora vieja', 'virus', 'wifi', 'disco lleno', 'se colgó', 'navegador', 'demasiadas pestañas', 'poca ram', 'descarga', 'video']),
      ...entrada('comun', ['base de datos', 'falta un índice', 'memoria llena', 'demasiadas consultas', 'caché', 'red lenta', 'cpu al máximo', 'consulta pesada', 'bucle', 'archivo grande', 'imagen pesada', 'bloqueo', 'timeout', 'pool de conexiones']),
      ...entrada('rara', ['locks', 'cold start', 'n+1', 'contención', 'thundering herd', 'serialización', 'latencia de disco', 'fsync', 'garbage collector']),
    ],
  },
  {
    consigna: 'Nombrá algo que un equipo de desarrollo hace antes de publicar.',
    exige: 'rara',
    banco: [
      ...entrada('obvia', ['probar', 'revisar', 'avisar', 'guardar', 'mirar', 'comentar', 'mostrar', 'preguntar', 'anotar', 'leer el diff']),
      ...entrada('comun', ['revisión de código', 'test', 'documentar', 'prueba', 'checklist', 'merge', 'staging', 'qa', 'linter', 'demo', 'revisar logs', 'backup de la base']),
      ...entrada('rara', ['canary', 'feature flag', 'prueba canario', 'rollout', 'smoke test', 'changelog', 'observabilidad', 'blue green', 'dark launch', 'migración']),
    ],
  },
];

export const estadoBajada = (): EstadoBajada => ({ completado: false, aceptadas: [] });

const cumple = (aceptadas: Aceptada[], exige?: 'comun' | 'rara') =>
  aceptadas.length >= PARA_COMPLETAR && (!exige || aceptadas.some((a) => a.rareza === exige));

export function intentarBajada(nivel: number, respuesta: string, estado: EstadoBajada) {
  const datos = NIVELES[nivel - 1];
  const clave = normalizar(respuesta);
  if (!datos || !clave) {
    return { publicar: false, completado: false, estado, cuerpo: { enBanco: false, acierto: false, completado: false } };
  }
  if (estado.aceptadas.some((a) => normalizar(a.texto) === clave)) {
    return {
      publicar: false, completado: false, estado,
      cuerpo: { enBanco: true, repetida: true, acierto: false, aceptadas: estado.aceptadas, completado: estado.completado, falta: datos.exige ?? null },
    };
  }
  const entradaBanco = datos.banco.find((e) => normalizar(e.texto) === clave);
  if (!entradaBanco) {
    return {
      publicar: true, acierto: false, completado: false, estado,
      cuerpo: { enBanco: false, acierto: false, aceptadas: estado.aceptadas, completado: false, falta: datos.exige ?? null },
    };
  }
  const aceptadas = [...estado.aceptadas, { texto: entradaBanco.texto, rareza: entradaBanco.rareza }];
  const completado = !estado.completado && cumple(aceptadas, datos.exige);
  const siguiente: EstadoBajada = { aceptadas, completado: estado.completado || completado };
  return {
    publicar: true,
    acierto: true,
    rareza: entradaBanco.rareza,
    completado,
    estado: siguiente,
    cuerpo: {
      enBanco: true, acierto: true, rareza: entradaBanco.rareza, aceptadas, completado: siguiente.completado,
      falta: cumple(aceptadas, datos.exige) ? null : (datos.exige ?? null),
    },
  };
}
