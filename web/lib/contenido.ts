// Contenido de los juegos como datos: un mismo motor de decisiones para todas las áreas.
export type Situacion = { pregunta: string; opciones: string[]; correcta: number; explicacion: string };
export type Nivel = { titulo: string; situaciones: Situacion[] };
export type Area = { slug: string; nombre: string; descripcion: string; niveles: Nivel[] };

export const AREAS: Area[] = [
  {
    slug: 'medicina',
    nombre: 'Medicina',
    descripcion: 'Una guardia de hospital: priorizar, diagnosticar y operar.',
    niveles: [
      {
        titulo: 'Primer día en la guardia',
        situaciones: [
          {
            pregunta: 'Llegan a la vez una persona con dolor en el pecho y otra con un corte en la mano. ¿A quién atendés primero?',
            opciones: ['A la que llegó primero', 'A la del dolor en el pecho', 'A la del corte en la mano'],
            correcta: 1,
            explicacion: 'En el triage se prioriza lo que pone en riesgo la vida: el dolor de pecho puede ser un infarto.',
          },
          {
            pregunta: 'Antes de revisar a un paciente, ¿qué hacés?',
            opciones: ['Me lavo las manos', 'Le pido el DNI', 'Le tomo la temperatura'],
            correcta: 0,
            explicacion: 'La higiene de manos es la medida más simple y efectiva para evitar infecciones.',
          },
        ],
      },
      {
        titulo: 'Diagnóstico',
        situaciones: [
          {
            pregunta: 'Un chico tiene fiebre, tos y le cuesta respirar. ¿Qué estudio pedís primero?',
            opciones: ['Un análisis de orina', 'Una resonancia de rodilla', 'Una radiografía de tórax'],
            correcta: 2,
            explicacion: 'Los síntomas apuntan a los pulmones: la radiografía puede mostrar una neumonía.',
          },
          {
            pregunta: 'El paciente te pregunta si es grave. ¿Qué le decís?',
            opciones: ['Que no se preocupe, que no es nada', 'Le explico lo que sabemos y lo que falta estudiar', 'Que le pregunte a otro médico'],
            correcta: 1,
            explicacion: 'Comunicar con honestidad y claridad también es parte del trabajo médico.',
          },
        ],
      },
      {
        titulo: 'Cirugía programada',
        situaciones: [
          {
            pregunta: 'Antes de operar, todo el equipo hace una pausa. ¿Para qué?',
            opciones: ['Para confirmar paciente, procedimiento y lado a operar', 'Para descansar un rato', 'Para esperar al director del hospital'],
            correcta: 0,
            explicacion: 'La lista de verificación quirúrgica de la OMS reduce errores evitables.',
          },
          {
            pregunta: 'Al final de la operación falta un instrumento en el conteo. ¿Qué hacés?',
            opciones: ['Cierro y aviso después', 'Lo ignoro, seguro se contó mal', 'Freno y lo busco antes de cerrar'],
            correcta: 2,
            explicacion: 'No se cierra hasta que el conteo coincide: dejar un objeto adentro es un error grave.',
          },
        ],
      },
    ],
  },
  {
    slug: 'sistemas',
    nombre: 'Sistemas',
    descripcion: 'Un equipo de desarrollo: encontrar errores, colaborar y escalar.',
    niveles: [
      {
        titulo: 'Tu primer bug',
        situaciones: [
          {
            pregunta: 'Una app de compras muestra mal el total del carrito. ¿Qué hacés primero?',
            opciones: ['Reescribo toda la app', 'Reproduzco el error con un caso concreto', 'Le digo al usuario que se equivocó'],
            correcta: 1,
            explicacion: 'Si no podés reproducir el error, tampoco vas a poder saber si lo arreglaste.',
          },
          {
            pregunta: 'Encontraste la causa: sumaba los precios como texto ("10" + "5" = "105"). ¿Cómo evitás que vuelva a pasar?',
            opciones: ['Agrego un test automático de la suma', 'Dejo un comentario en el código', 'No hago nada más'],
            correcta: 0,
            explicacion: 'Un test automático avisa si el error vuelve a aparecer.',
          },
        ],
      },
      {
        titulo: 'Trabajo en equipo',
        situaciones: [
          {
            pregunta: 'Dos personas modificaron el mismo archivo al mismo tiempo. ¿Qué herramienta las ayuda?',
            opciones: ['Mandarse el archivo por mail', 'Que una borre lo de la otra', 'Un control de versiones como Git'],
            correcta: 2,
            explicacion: 'Git registra cada cambio y ayuda a combinar el trabajo de varias personas.',
          },
          {
            pregunta: 'Una compañera te pide que revises su código. ¿Qué buscás?',
            opciones: ['Que funcione y se entienda', 'Que use mis nombres de variables favoritos', 'Nada, lo apruebo directamente'],
            correcta: 0,
            explicacion: 'La revisión de código busca errores y claridad, no gustos personales.',
          },
        ],
      },
      {
        titulo: 'La app crece',
        situaciones: [
          {
            pregunta: 'La app pasó de 100 a 100.000 usuarios y está lenta. ¿Qué hacés primero?',
            opciones: ['Compro el servidor más caro', 'La reescribo en otro lenguaje', 'Mido dónde se va el tiempo'],
            correcta: 2,
            explicacion: 'Optimizar sin medir es adivinar.',
          },
          {
            pregunta: 'Un usuario avisa que puede ver los datos de otra persona. ¿Qué tan urgente es?',
            opciones: ['Máxima prioridad: es un problema de seguridad', 'Puede esperar al mes que viene', 'No es un problema'],
            correcta: 0,
            explicacion: 'Una filtración de datos personales se corrige antes que cualquier otra cosa.',
          },
        ],
      },
    ],
  },
  {
    slug: 'derecho',
    nombre: 'Derecho',
    descripcion: 'Un estudio jurídico: asesorar, revisar contratos y litigar.',
    niveles: [
      {
        titulo: 'Consultorio jurídico',
        situaciones: [
          {
            pregunta: 'Una vecina dice que le cobraron de más en una compra. ¿Qué ley la protege?',
            opciones: ['El Código Aduanero', 'La Ley de Defensa del Consumidor', 'La ley de tránsito'],
            correcta: 1,
            explicacion: 'La Ley 24.240 protege a quienes compran bienes o contratan servicios.',
          },
          {
            pregunta: '¿Qué le pedís para empezar el reclamo?',
            opciones: ['Su fecha de nacimiento', 'Nada, alcanza con su palabra', 'El ticket o comprobante de la compra'],
            correcta: 2,
            explicacion: 'Las pruebas documentales son la base de cualquier reclamo.',
          },
        ],
      },
      {
        titulo: 'Contratos',
        situaciones: [
          {
            pregunta: 'Un amigo va a alquilar un departamento. ¿Qué le recomendás antes de firmar?',
            opciones: ['Leer todo el contrato y preguntar lo que no entienda', 'Firmar rápido para no perderlo', 'No firmar nunca nada'],
            correcta: 0,
            explicacion: 'Lo que se firma obliga: hay que entenderlo antes.',
          },
          {
            pregunta: 'Una cláusula dice que el inquilino paga todos los arreglos, incluso los del edificio. ¿Vale?',
            opciones: ['Sí, todo lo firmado vale siempre', 'Puede ser abusiva: hay que revisarla', 'Solo si está firmada en tinta azul'],
            correcta: 1,
            explicacion: 'Una cláusula abusiva puede declararse nula aunque esté firmada.',
          },
        ],
      },
      {
        titulo: 'En el juicio',
        situaciones: [
          {
            pregunta: 'Tu cliente quiere mentir en el juicio para ganar. ¿Qué hacés?',
            opciones: ['Lo ayudo a preparar la mentira', 'Abandono el caso sin decirle nada', 'Le explico que no puedo ayudarlo a mentir'],
            correcta: 2,
            explicacion: 'La ética profesional prohíbe presentar pruebas o testimonios falsos.',
          },
          {
            pregunta: 'El juez falla en contra de tu cliente. ¿Se termina todo?',
            opciones: ['No: se puede apelar ante un tribunal superior', 'Sí, siempre es definitivo', 'Se repite el juicio cuando uno quiera'],
            correcta: 0,
            explicacion: 'La apelación permite que otro tribunal revise la decisión.',
          },
        ],
      },
    ],
  },
];

export const area = (slug: string) => AREAS.find((a) => a.slug === slug);
