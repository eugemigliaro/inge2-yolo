import { normalizar } from '../texto';

export type Rareza = 'obvia' | 'comun' | 'rara';
type Entrada = { texto: string; rareza: Rareza };
export type Aceptada = { texto: string; rareza: Rareza };
export type EstadoBajada = { completado: boolean; aceptadas: Aceptada[] };

// noObvias: cuántas de las respuestas tienen que ser comunes o raras.
type Nivel = { titulo: string; consigna: string; ejemplo: string; meta: number; noObvias?: number; banco: Entrada[] };

// Cada entrada acepta variantes separadas por «|». La primera es la que se muestra.
const entrada = (rareza: Rareza, textos: string[]): Entrada[] => textos.map((texto) => ({ texto, rareza }));

// Obvia: lo que dice casi todo el mundo. Común: hace falta pensarlo un poco. Rara: vocabulario de la profesión.
// Las raras suman y se festejan, pero ningún nivel las exige: el juego mide la exploración, no lo que ya se sabe.
// La dificultad sube por la cantidad de respuestas, por cuántas no pueden ser obvias y por consignas menos cotidianas.
export const NIVELES: Nivel[] = [
  {
    titulo: 'Adentro de un servidor', meta: 3, ejemplo: 'disco',
    consigna: 'Nombrá algo que hay en un servidor, la computadora que atiende a una app o a un juego online.',
    banco: [
      ...entrada('obvia', ['disco|disco duro|disco rigido', 'memoria|memoria ram|ram', 'procesador|cpu|micro|microprocesador', 'archivos', 'cables', 'ventilador|cooler', 'fuente|fuente de poder|fuente de alimentacion', 'placa madre|motherboard|mother|placa', 'sistema operativo|linux|ubuntu|windows', 'programas|software', 'internet|conexion a internet|red']),
      ...entrada('comun', ['base de datos|datos', 'usuarios|cuentas', 'contraseñas|claves', 'backup|copia de seguridad|respaldo', 'partidas guardadas|partidas|mundos|mapas', 'mensajes|chats', 'fotos|imagenes|videos', 'logs|registros', 'dirección ip|ip', 'firewall|cortafuegos', 'ssd|disco solido', 'placa de red|tarjeta de red', 'dns', 'certificado|ssl|https', 'ssh', 'proxy', 'caché', 'procesos|servicios', 'puertos', 'raid', 'cron|tareas programadas']),
      ...entrada('rara', ['hipervisor', 'máquina virtual|vm', 'contenedor|docker', 'kernel|nucleo', 'balanceador de carga|balanceador|load balancer', 'swap', 'inode', 'cgroup', 'namespace', 'ipmi', 'numa', 'iscsi', 'kubernetes|k8s']),
    ],
  },
  {
    titulo: 'Una app de mensajes', meta: 3, ejemplo: 'mandar fotos',
    consigna: 'Nombrá algo que tiene que hacer una app de mensajes, como WhatsApp.',
    banco: [
      ...entrada('obvia', ['mandar mensajes|enviar mensajes|escribir mensajes|mensajes|chatear|chat', 'recibir mensajes', 'mandar fotos|enviar fotos|fotos|imagenes|mandar imagenes', 'mandar audios|audios|notas de voz|mensajes de voz', 'llamadas|llamar|hacer llamadas|videollamadas', 'grupos|crear grupos', 'stickers|emojis', 'estados|historias', 'contactos|agregar contactos', 'notificaciones|avisar|avisos|notificar|que te avise|avise|avisa|avisar cuando te escriben']),
      ...entrada('comun', ['guardar los mensajes|guardar chats|historial', 'mostrar si se leyó|tildes|doble tilde|tilde azul|visto|confirmacion de lectura', 'mostrar si está en línea|en linea|ultima conexion|ultima vez', 'mostrar que está escribiendo|escribiendo', 'verificar el número|codigo por sms|codigo de verificacion|verificacion', 'backup|copia de seguridad|respaldo', 'bloquear contactos|bloquear', 'comprimir las fotos|comprimir|bajar la calidad', 'sincronizar|varios dispositivos|whatsapp web', 'ordenar los mensajes|orden de los mensajes', 'reenviar cuando vuelve internet|mensajes sin conexion|reintentar', 'borrar mensajes|eliminar mensajes', 'reportar spam|reportar|denunciar|spam']),
      ...entrada('rara', ['cifrado de extremo a extremo|cifrado|cifrar|encriptar|encriptacion|extremo a extremo', 'servidores|servidor', 'cola de mensajes|cola', 'notificaciones push|push', 'websockets|socket', 'replicación|replicar', 'clave pública|criptografia', 'protocolo|xmpp', 'base de datos', 'cdn']),
    ],
  },
  {
    titulo: '¿Por qué anda lenta?', meta: 3, noObvias: 1, ejemplo: 'mala conexión',
    consigna: 'Nombrá por qué una app o un juego online se puede poner lento.',
    banco: [
      ...entrada('obvia', ['mala conexión|internet lento|internet|mal internet|conexion lenta|conexion', 'mal wifi|wifi|wifi lento', 'mucha gente|muchos usuarios|muchas personas|muchos jugadores|demasiados usuarios', 'celular viejo|computadora vieja|compu vieja|pc vieja|dispositivo viejo', 'virus|malware', 'poca memoria|poca ram|memoria llena|falta de memoria', 'almacenamiento lleno|disco lleno|sin espacio|poco espacio', 'muchas apps abiertas|demasiadas pestañas|muchas pestañas|muchos programas abiertos', 'descargas|actualizacion|actualizando', 'se colgó|se tildo|colgado|tildado']),
      ...entrada('comun', ['servidor saturado|servidor lento|servidor caido|servidor colapsado|el servidor', 'servidor lejos|servidor lejano|lejos|lag|ping alto|ping|latencia|distancia', 'base de datos lenta|base de datos|consultas lentas|consulta pesada|demasiadas consultas', 'falta un índice|sin indice|indice', 'imágenes pesadas|imagen pesada|archivos pesados|archivo grande|videos pesados', 'gráficos al máximo|graficos|calidad alta|graficos pesados', 'procesador al máximo|cpu al maximo|procesador saturado|cpu', 'código mal hecho|mal programado|codigo lento|codigo ineficiente|mala programacion|bugs|errores', 'bucle infinito|bucle|loop', 'falta de caché|sin cache|cache', 'bloqueos|bloqueo', 'timeout|tiempo de espera', 'ataque|ddos|hackeo', 'bots']),
      ...entrada('rara', ['locks', 'cold start', 'n+1', 'contención', 'thundering herd', 'serialización', 'latencia de disco', 'fsync', 'garbage collector|recolector de basura|gc', 'pool de conexiones|conexiones agotadas', 'memory leak|fuga de memoria|perdida de memoria', 'cuello de botella', 'deadlock|interbloqueo']),
    ],
  },
  {
    titulo: 'La base de un delivery', meta: 4, noObvias: 1, ejemplo: 'pedidos',
    consigna: 'Nombrá algo que una app de delivery tiene que guardar en su base de datos.',
    banco: [
      ...entrada('obvia', ['pedidos|ordenes', 'clientes|usuarios', 'direcciones|domicilio', 'restaurantes|locales|negocios|comercios', 'comidas|platos|productos|menu|carta', 'precios', 'repartidores|cadetes', 'nombres', 'teléfonos|celular|numero de telefono', 'tarjetas|tarjeta de credito']),
      ...entrada('comun', ['pagos|forma de pago|medio de pago|metodo de pago', 'estado del pedido|estado|seguimiento', 'ubicación del repartidor|ubicacion|gps', 'horarios|horario de apertura', 'calificaciones|puntuaciones|estrellas|reseñas|opiniones|comentarios', 'fecha y hora|fecha|hora del pedido|hora', 'tiempo de entrega|demora|tiempo estimado', 'propinas', 'cupones|descuentos|promociones|codigos de descuento', 'historial de pedidos|historial|pedidos anteriores', 'stock|disponibilidad', 'zona de entrega|zonas|radio de entrega', 'costo de envío|envio', 'contraseñas', 'emails|mail|correo', 'favoritos']),
      ...entrada('rara', ['identificadores|id|ids|clave primaria', 'claves foráneas|clave foranea|relaciones', 'índices', 'transacciones', 'auditoría|logs|registros', 'coordenadas|latitud|longitud', 'tokens', 'hash de contraseñas|hash|contraseñas hasheadas', 'facturas|cuit', 'timestamps']),
    ],
  },
  {
    titulo: 'Entradas para un recital', meta: 4, noObvias: 1, ejemplo: 'se cae la página',
    consigna: 'Nombrá algo que puede salir mal cuando miles de personas compran entradas para un recital al mismo tiempo.',
    banco: [
      ...entrada('obvia', ['se cae la página|se cae|se cayo|la pagina se cae|pagina caida|caida|se cae la app|se cae la web', 'se agotan las entradas|se agotan|agotado|sin entradas|no hay entradas', 'tarda mucho|lenta|pagina lenta|lentitud|anda lento|carga lenta', 'fila virtual|fila|cola|cola de espera|mucha espera|espera', 'da error|error|errores|no carga|no anda', 'falla el pago|no te deja pagar|error en el pago|pago rechazado|rechazan la tarjeta']),
      ...entrada('comun', ['vender la misma entrada dos veces|vender dos veces|misma entrada|entradas repetidas|entrada duplicada|sobreventa|vender de mas', 'cobrar dos veces|cobro doble|te cobran dos veces|doble cobro|cobrar de mas', 'pagar y no recibir la entrada|no llega la entrada|no llega el mail|no te llega el mail', 'revendedores|reventa', 'bots', 'se satura el servidor|se cae el servidor|servidor caido|servidor colapsado|colapsa|colapso|saturacion|se satura', 'se pierde la compra|se pierde el pedido|perder la compra|se borra el carrito', 'estafas|entradas falsas|paginas falsas|phishing', 'se corta la conexión|se corta internet|perder la conexion', 'perder el lugar en la fila|te sacan de la fila|perder el lugar', 'ataque|ddos|hackeo|hackers']),
      ...entrada('rara', ['condición de carrera|race condition', 'concurrencia', 'bloqueo|locks|lock', 'transacciones', 'idempotencia', 'escalar|escalabilidad|autoescalado|escalado', 'balanceador de carga|balanceador|load balancer', 'captcha', 'rate limit|limite de pedidos|limitar pedidos', 'base de datos saturada|base de datos', 'thundering herd', 'cola de mensajes|kafka']),
    ],
  },
  {
    titulo: 'Antes de lanzar', meta: 5, noObvias: 1, ejemplo: 'probarla',
    consigna: 'Nombrá algo que hace un equipo de programadores antes de lanzar una actualización de su app.',
    banco: [
      ...entrada('obvia', ['probarla|probar|pruebas|hacer pruebas|testear|tests|testing', 'revisarla|revisar|revisar todo|chequear|controlar', 'arreglar errores|arreglar bugs|corregir errores|arreglar|corregir|bugs|errores|debuggear', 'avisar a los usuarios|avisar|anunciar|comunicar', 'guardar los cambios|guardar|guardar todo', 'programar|escribir codigo|codear', 'diseñar|diseño', 'reunirse|reunion|reuniones']),
      ...entrada('comun', ['revisión de código|revisar el codigo|code review|que otro revise el codigo', 'probar en varios celulares|varios celulares|distintos celulares|probar en distintos dispositivos|varios dispositivos|distintos dispositivos|probar en iphone y android|iphone y android', 'backup|copia de seguridad|backup de la base|respaldo', 'versión beta|beta|beta testers|probadores', 'escribir las novedades|novedades|notas de la version|changelog|lista de cambios', 'documentar|documentacion', 'pedir opiniones|feedback|encuesta|preguntar a usuarios', 'demo|mostrar|presentar', 'checklist|lista de control', 'planificar|planear|plan|planificacion', 'subir a la tienda|aprobar en la tienda|play store|app store|publicar en la tienda', 'merge|unir cambios|juntar el codigo', 'entorno de prueba|staging|ambiente de pruebas|servidor de prueba', 'control de calidad|qa', 'linter|formatear', 'medir el rendimiento|rendimiento|velocidad|optimizar', 'revisar la seguridad|seguridad|chequear seguridad', 'número de versión|versionar|version']),
      ...entrada('rara', ['canary|canario|prueba canario', 'feature flags|feature flag', 'lanzamiento gradual|rollout|rollout gradual|de a poco', 'smoke test', 'blue green', 'dark launch', 'migración de la base|migracion|migraciones', 'integración continua|ci|pipeline|ci cd', 'monitoreo|observabilidad|monitorear|metricas', 'rollback|volver atras|plan de vuelta atras', 'tests automáticos|pruebas automaticas|tests unitarios|unit tests']),
    ],
  },
  {
    titulo: 'Un juego online', meta: 5, noObvias: 2, ejemplo: 'servidores',
    consigna: 'Nombrá algo que necesita un juego online para que miles de personas jueguen al mismo tiempo.',
    banco: [
      ...entrada('obvia', ['servidores|servidor|servers', 'internet|buena conexion|conexion', 'cuentas|usuarios|registrarse|login|iniciar sesion', 'partidas|salas|lobby', 'mapas|niveles|mundos', 'chat|chat de voz|chatear', 'personajes|skins|avatares', 'actualizaciones|parches|updates', 'tienda|compras|monedas', 'amigos|lista de amigos']),
      ...entrada('comun', ['base de datos', 'buscar rivales|emparejar jugadores|buscar partida|emparejamiento', 'ranking|rankings|clasificacion|tabla de posiciones|ranked', 'antitrampas|anticheat|anti trampas|detectar trampas|evitar trampas', 'moderadores|moderacion|reportar jugadores|reportes', 'guardar el progreso|guardar partidas|guardado en la nube|progreso', 'servidores en varios países|regiones|servidores por region|servidores cerca', 'poco lag|baja latencia|ping bajo|que no haya lag', 'sincronizar a los jugadores|sincronizar|sincronizacion|sincronizar posiciones', 'mantenimiento', 'proteger las cuentas|seguridad|proteger cuentas', 'soporte|atencion al cliente|ayuda', 'torneos|eventos|temporadas', 'más servidores cuando hay mucha gente|agregar servidores|mas servidores']),
      ...entrada('rara', ['matchmaking', 'balanceador de carga|balanceador|load balancer', 'autoescalado|escalado automatico|escalar|escalabilidad', 'tick rate|tickrate', 'netcode', 'predicción del cliente|prediccion|client side prediction', 'cdn', 'replicación|replicar', 'udp', 'websockets|socket', 'servidor autoritativo|autoritativo', 'sharding|shards|particiones', 'caché', 'cola de mensajes|colas']),
    ],
  },
  {
    titulo: 'La app del banco', meta: 6, noObvias: 2, ejemplo: 'contraseña',
    consigna: 'Nombrá algo que una app de banco tiene que hacer para que nadie te robe la plata.',
    banco: [
      ...entrada('obvia', ['contraseña|clave|contraseña segura|pin', 'huella|huella digital|huella dactilar', 'reconocimiento facial|cara|face id|foto de la cara', 'cerrar sesión|cerrar la sesion|logout', 'avisar cada movimiento|avisar movimientos|notificaciones|avisos|avisar cada compra|mandar un mail', 'antivirus', 'no compartir la clave|no compartir la contraseña|no dar la clave|no pasar la contraseña', 'usuario|nombre de usuario']),
      ...entrada('comun', ['verificación en dos pasos|verificacion en 2 pasos|2 pasos|doble factor|dos pasos|segundo factor|2fa|doble autenticacion', 'código por SMS|codigo por mensaje|codigo al celular|sms', 'token|token de seguridad|clave token', 'bloquear después de varios intentos|bloquear la cuenta|bloqueo|limitar intentos', 'límite de transferencias|limites|tope de transferencia|monto maximo', 'detectar fraude|detectar movimientos raros|antifraude|fraude', 'confirmar las transferencias|confirmar transferencias|confirmacion|pedir confirmacion', 'cerrar la sesión si no la usás|cerrar sesion por inactividad|tiempo de sesion|sesion que expira|timeout', 'conexión segura|https|candado', 'captcha|no soy un robot', 'avisar de estafas|alertas de phishing|phishing', 'actualizaciones de seguridad|actualizar la app', 'preguntas de seguridad', 'celular de confianza|registrar el celular|dispositivo de confianza|vincular dispositivo']),
      ...entrada('rara', ['cifrado|encriptar|encriptacion|cifrar', 'hash de contraseñas|hash|hashear contraseñas|contraseñas hasheadas', 'auditoría|logs|registros', 'tls|ssl|certificados', 'firma digital', 'biometría|biometria|biometrico', 'ofuscar el código|ofuscacion|ofuscar', 'detectar root|root|jailbreak', 'otp|clave de un solo uso', 'rate limit', 'pentest|test de penetracion|hackeo etico', 'mínimo privilegio|minimo privilegio', 'tokenización|tokenizacion|tokenizar']),
    ],
  },
  {
    titulo: 'Se cayó todo', meta: 6, noObvias: 3, ejemplo: 'buscar el error',
    consigna: 'Nombrá algo que hace un equipo cuando su app se cae un viernes a la noche.',
    banco: [
      ...entrada('obvia', ['buscar el error|buscar el problema|ver que paso|investigar', 'arreglarlo|arreglar|solucionarlo|corregir', 'reiniciar el servidor|reiniciar|apagar y prender|resetear', 'avisar a los usuarios|avisar|comunicar|publicar un aviso', 'llamar al equipo|llamar al jefe|llamar a todos|reunirse|juntarse', 'probar que ande|probar|testear', 'pedir disculpas|pedir perdon|disculparse', 'quedarse trabajando|trabajar de noche|no dormir']),
      ...entrada('comun', ['revisar los logs|logs|mirar los logs|registros', 'volver a la versión anterior|version anterior|deshacer el cambio|volver atras', 'revisar el último cambio|ultimo cambio|que se cambio', 'mirar las métricas|metricas|graficos|monitoreo|monitorear', 'agregar servidores|mas servidores|escalar', 'restaurar el backup|backup|copia de seguridad|restaurar', 'persona de guardia|guardia|on call|el que esta de guardia', 'página de estado|pagina de estado|status|estado del servicio', 'escribir qué pasó|informe|reporte|documentar', 'revisar la base de datos|base de datos', 'avisar al proveedor|llamar a la nube|soporte de la nube', 'apagar la función nueva|desactivar una funcion|apagar la funcion|desactivar', 'decidir qué arreglar primero|priorizar', 'revisar el servidor|servidor']),
      ...entrada('rara', ['rollback', 'post mortem|postmortem|retrospectiva', 'alertas|alerting', 'feature flags|feature flag', 'runbook|manual de incidentes|playbook', 'gestión de incidentes|incidente|comandante de incidente', 'sla|slo', 'failover|servidor de respaldo|pasar al servidor de respaldo', 'hotfix|parche urgente', 'causa raíz|causa raiz|root cause', 'tracing|trazas', 'circuit breaker', 'volver a desplegar|redeploy|desplegar de nuevo']),
    ],
  },
];

// Comparación tolerante: sin tildes, mayúsculas, signos, artículos ni plurales, y con un error de tipeo.
const RELLENO = new Set([
  'el', 'la', 'los', 'las', 'lo', 'un', 'una', 'unos', 'unas', 'al', 'del', 'de', 'en', 'a', 'y', 'o', 'con', 'para', 'por', 'porque', 'xq',
  'que', 'se', 'te', 'me', 'le', 'les', 'nos', 'su', 'sus', 'mi', 'mis', 'hay', 'muy', 'es', 'son', 'esta', 'estan',
]);
const raiz = (p: string) => {
  let r = p;
  if (r.length > 3 && r.endsWith('s')) r = r.slice(0, -1);
  if (r.length > 3 && r.endsWith('e')) r = r.slice(0, -1);
  return r;
};
export const claves = (texto: string) =>
  normalizar(texto).replace(/[^a-z0-9+ ]/g, ' ').split(' ').filter((p) => p && !RELLENO.has(p)).map(raiz);

function distancia(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const fila = [i];
    for (let j = 1; j <= b.length; j++) fila[j] = Math.min(previa[j] + 1, fila[j - 1] + 1, previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    previa = fila;
  }
  return previa[b.length];
}

const contiene = (todo: string[], parte: string[]) =>
  parte.length > 0 && todo.some((_, i) => parte.every((p, k) => todo[i + k] === p));

const variantes = (e: Entrada) => e.texto.split('|');
export const mostrar = (e: Entrada) => variantes(e)[0];

const ORDEN: Record<Rareza, number> = { obvia: 0, comun: 1, rara: 2 };

// Busca la entrada del banco, en este orden: igual; contenida en la respuesta (más palabras, después más rara);
// o con un error de tipeo (dos si es larga).
export function buscar(banco: Entrada[], respuesta: string) {
  const r = claves(respuesta);
  const rTexto = r.join(' ');
  if (!rTexto) return null;
  const todas = banco.flatMap((e) => variantes(e).map((v) => ({ e, k: claves(v) })));
  const igual = todas.find(({ k }) => k.join(' ') === rTexto);
  if (igual) return igual.e;
  const contenidas = todas.filter(({ k }) => contiene(r, k));
  if (contenidas.length) {
    contenidas.sort((a, b) => b.k.length - a.k.length || ORDEN[b.e.rareza] - ORDEN[a.e.rareza] || b.k.join(' ').length - a.k.join(' ').length);
    return contenidas[0].e;
  }
  let cerca: { e: Entrada; d: number } | null = null;
  for (const { e, k } of todas) {
    const t = k.join(' ');
    const tolera = t.length >= 10 ? 2 : t.length >= 5 ? 1 : 0;
    const d = distancia(t, rTexto);
    if (tolera && d <= tolera && (!cerca || d < cerca.d)) cerca = { e, d };
  }
  return cerca?.e ?? null;
}

export const estadoBajada = (): EstadoBajada => ({ completado: false, aceptadas: [] });

// Una común o una rara cuentan igual para noObvias: lo que importa es que no sean todas obvias.
const cumple = (aceptadas: Aceptada[], datos: Nivel) =>
  aceptadas.length >= datos.meta && aceptadas.filter((a) => a.rareza !== 'obvia').length >= (datos.noObvias ?? 0);

export function intentarBajada(nivel: number, respuesta: string, estado: EstadoBajada) {
  const datos = NIVELES[nivel - 1];
  if (!datos || !normalizar(respuesta)) {
    return { publicar: false, completado: false, estado, cuerpo: { enBanco: false, acierto: false, completado: false } };
  }
  const entradaBanco = buscar(datos.banco, respuesta);
  // Una respuesta que no está en el banco no se publica: el banco nunca es completo y no tiene que contar como fallo.
  if (!entradaBanco) {
    return {
      publicar: false, completado: false, estado,
      cuerpo: { enBanco: false, acierto: false, aceptadas: estado.aceptadas, completado: estado.completado },
    };
  }
  const texto = mostrar(entradaBanco);
  if (estado.aceptadas.some((a) => a.texto === texto)) {
    return {
      publicar: false, completado: false, estado,
      cuerpo: { enBanco: true, repetida: true, texto, acierto: false, aceptadas: estado.aceptadas, completado: estado.completado },
    };
  }
  const aceptadas = [...estado.aceptadas, { texto, rareza: entradaBanco.rareza }];
  const completado = !estado.completado && cumple(aceptadas, datos);
  const siguiente: EstadoBajada = { aceptadas, completado: estado.completado || completado };
  return {
    publicar: true,
    acierto: true,
    rareza: entradaBanco.rareza,
    completado,
    estado: siguiente,
    cuerpo: {
      enBanco: true, acierto: true, texto, rareza: entradaBanco.rareza, aceptadas, completado: siguiente.completado,
    },
  };
}
