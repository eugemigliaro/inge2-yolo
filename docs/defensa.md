# Defensa del TPIF: guion y organización

Jueves 26/11/2026. Documento de trabajo del grupo: no es un entregable.

## Reglas del turno

Según el anuncio de la cátedra «Entregas y Defensas - TPI»:

| Bloque | Duración | Regla |
|---|---|---|
| Exposición del proyecto | 5 min **como máximo** | Pasarse penaliza |
| Demo funcional | 5 min **como máximo** | Pasarse penaliza |
| Preguntas y respuestas | 10 min **como mínimo** | Es la mitad de la defensa |

Cada grupo se presenta en su horario y se puede retirar al terminar.

| Grupo | Inicio | Fin |
|---|---|---|
| 2 | 16:00 | 16:20 |
| 7 | 16:25 | 16:45 |
| 4 | 16:50 | 17:10 |
| 1 | 17:15 | 17:35 |
| 5 | 17:40 | 18:00 |
| 6 | 18:05 | 18:25 |
| 3 | 18:30 | 18:50 |

**Pendiente:** marcar cuál es nuestro grupo. Entre turnos hay 5 minutos: la notebook tiene que llegar con todo abierto, lista para enchufar.

El enunciado pide que la exposición cubra cinco cosas: la presentación y justificación del producto, las funcionalidades principales, la arquitectura con diagramas y narración, el stack y lo que hace falta para llevarlo adelante (tiempo, recursos humanos y técnicos). [TPIF-2026, p. 7] El guion de abajo las cubre todas, en ese orden.

## La idea que tiene que quedar

> No elegimos Kafka por volumen ni por tiempo real: para eso alcanza Postgres. Lo elegimos para poder recalcular sobre toda la historia métricas que todavía no existen, y para que el juego siga aunque se caiga el mail.

Todo lo demás la sostiene: la exposición la enuncia, la demo la prueba (actos 3 y 4) y las preguntas vuelven a ella.

## Reparto

**Es una propuesta: falta que el grupo la confirme.** Está armada con un solo cambio de voz por bloque, porque cada traspaso cuesta segundos.

| Bloque | Quién | Por qué |
|---|---|---|
| Exposición, partes 1 y 2: producto y decisión | Franco | — |
| Exposición, partes 3 y 4: arquitectura, stack y recursos | Eugenio | Hizo la primera versión de la PoC |
| Demo, voz | Andy | Hizo los juegos: sabe qué pasa en cada pantalla |
| Demo, manos (navegador y terminal) | Fran Costa | Levantó el despliegue y tiene el acceso a la VM |
| Control del tiempo | El que no está hablando | Seña a los 4:00 y a los 4:30 de cada bloque |

En las preguntas hablan los cuatro, cada uno por su tema (ver [Preguntas](#preguntas-10-minutos-como-mínimo)).

## Exposición (5 minutos)

El texto tiene unas 640 palabras: dicho a ritmo normal son cerca de 4:20. Los 40 segundos que sobran son el margen para los traspasos y los nervios. Si en el ensayo pasa de 4:40, se recorta la parte 2, no se habla más rápido.

| Tiempo | Parte | En pantalla |
|---|---|---|
| 0:00 – 1:00 | 1. El problema y el producto | Portada, después problema y producto |
| 1:00 – 2:15 | 2. Funcionalidades y decisión | Funcionalidades, después la comparativa |
| 2:15 – 3:40 | 3. Arquitectura y stack | `docs/diagramas/arquitectura.svg` |
| 3:40 – 4:35 | 4. Qué hace falta y riesgo | Tiempo, equipo y costo |

### Parte 1. El problema y el producto (Franco, 1:00)

> Buenas tardes. Somos el grupo ___: Franco, Francisco, Andrés y Eugenio, y les presentamos YOLO.
>
> Elegir una carrera al terminar el secundario es una decisión grande que se toma con poca información. El test vocacional tradicional pregunta por actividades que el alumno nunca probó, mide lo que declara y saca una foto de un solo día. Y los padres y profesores, que acompañan esa decisión, ven a lo sumo el resultado del test.
>
> YOLO propone otra cosa: que el alumno explore las carreras jugando. Es una plataforma web con juegos por área, hoy Medicina, Sistemas y Derecho, con niveles que se van profundizando. No recomienda una carrera: registra cómo explora el alumno y lo convierte en información que un adulto entiende. Ese es el valor diferencial. El modelo de negocio es una suscripción mensual que las familias pagan a través del colegio.

### Parte 2. Funcionalidades y decisión (Franco, 1:15)

> El producto tiene seis funcionalidades principales. Cuatro están en la prueba de concepto: los juegos, el registro del recorrido, el dashboard para padres y profesores y las alertas. Las otras dos, los reportes por curso y la gestión de contenidos y suscripciones, todavía no están hechas.
>
> Para la prueba de concepto elegimos la historia central: como padre o profesor, quiero ver cuánto tiempo le dedica el alumno a cada área, hasta dónde llegó, y enterarme cuando descubre un interés o se frustra.
>
> Cada jugada es un evento, y ahí aparece la decisión. La alternativa seria a Kafka no era otro broker: era no usar ninguno y escribir directo en Postgres, que para un piloto alcanza y sobra. Entonces, ¿por qué Kafka? Porque Kafka guarda todo lo que pasó, y no solo el resultado. Hoy medimos tiempo y niveles. Mañana vamos a querer medir otra cosa, y con Kafka la calculamos sobre todo lo que los alumnos ya jugaron. Y además el juego queda separado del resto: si se cae el mail o el dashboard, el alumno sigue jugando.

La comparación con RabbitMQ y Airflow no se dice: queda en la diapositiva de la decisión y en las preguntas.

### Parte 3. Arquitectura y stack (Eugenio, 1:25)

Con el diagrama de arquitectura en pantalla, señalando cada caja al nombrarla.

> La arquitectura es publish–subscribe sobre un log. El alumno juega en la app web. Cada jugada llega a un endpoint que la valida: el servidor decide si el nivel se completó, el cliente no puede inventarlo. Después la publica en un tópico de Kafka. La clave del mensaje es el id del alumno, así que los eventos de cada alumno quedan en orden.
>
> De ese tópico leen dos grupos de consumidores que no se conocen entre sí. El proyector calcula el tiempo efectivo, las sesiones y la profundidad, y arma en Postgres el modelo de lectura que consulta el dashboard. El de alertas detecta patrones: dos niveles completados de un área es interés; dos salidas del mismo nivel después de intentar es frustración. Y manda el mail.
>
> Ahí están los tres tipos de procesamiento de eventos que vimos en la materia: single, stream y complex. Y para no contar nada dos veces, cada evento lleva un id y el consumidor es idempotente.
>
> El stack: Next.js y TypeScript, consumidores en Node, Kafka 4 en modo KRaft, Postgres, y Clerk para la identidad. Todo se levanta con docker compose, y ese mismo compose corre en una máquina virtual de Azure.

### Parte 4. Qué hace falta y riesgo (Eugenio, 0:55)

> ¿Qué hace falta para llevarlo a producción? Estimamos con PERT el módulo de analíticas listo para el piloto: dieciocho semanas-persona. Con tres personas, una de backend y datos, una de frontend y una de producto y contenidos, son seis o siete semanas de calendario, más una dedicación parcial a operación. En infraestructura, el piloto corre en una máquina virtual de unos treinta dólares por mes; los servicios gestionados quedan para la expansión.
>
> El riesgo principal lo decimos nosotros: Kafka es mucho para un piloto. Lo aceptamos porque en una máquina virtual cuesta lo mismo, y porque si el piloto no crece se puede reemplazar sin tocar los juegos: los contratos de eventos no cambian.
>
> Ahora lo mostramos funcionando.

### Diapositivas

El enunciado no pide entregarlas, pero la arquitectura hay que mostrarla con un diagrama. Alcanzan seis, con poco texto:

1. Portada: «YOLO: descubrí tu camino» y los integrantes.
2. Problema y producto: tres límites del test, una frase del producto.
3. Las seis funcionalidades, con las cuatro que están en la PoC marcadas (juegos, recorrido, dashboard y alertas) y las dos que no (reportes por curso, contenidos y suscripciones), y la historia de usuario.
4. La decisión: Postgres directo, Kafka, RabbitMQ y batch en tres filas (métrica nueva sobre la historia, si se cae el mail, cuándo llega la alerta) y las dos razones.
5. El diagrama de arquitectura, a pantalla completa.
6. Qué hace falta: 18,3 semanas-persona, 3 personas, 6 o 7 semanas, USD 30 por mes, y el riesgo.

De respaldo para las preguntas, sin mostrarlas en la exposición: la tabla PERT, la comparativa completa, el diagrama de despliegue, el de secuencia y la tabla de atributos de calidad. Todas salen del white paper.

Hay una versión animada de las mismas diapositivas en `docs/presentacion/`, hecha con Manim. Cada tecla avanza un paso de la animación, y la nota de cada paso es la frase del guion que lo acompaña. Se renderiza con `./presentacion.sh render` y se presenta con `./presentacion.sh presentar`. Las exportaciones a HTML y `.pptx` salen de `./presentacion.sh exportar`. `defensa.pptx` queda como plan B.

## Demo (5 minutos)

Objetivo: 4:30. Son cuatro actos, y cada uno prueba una afirmación de la exposición.

### Antes del turno

La notebook de la demo llega con esto ya abierto:

- **Ventana normal:** sesión de Ana (`ana+clerk_test@example.com`), en el dashboard.
- **Ventana privada:** sesión de Tomás (`tomas+clerk_test@example.com`), en la lista de juegos.
- **Pestaña de Kafka UI** (`http://localhost:8080`), en la vista de consumidores, y **pestaña de Mailpit** (`http://localhost:8025`).
- **Terminal 1**, con el túnel abierto:
  ```bash
  ssh -L 8080:localhost:8080 -L 8025:localhost:8025 azureuser@yolo-tpif-34cb00.brazilsouth.cloudapp.azure.com
  ```
- **Terminal 2**, dentro de la VM, con letra grande:
  ```bash
  cd yolo && alias dc='docker compose -f docker-compose.yml -f deploy/docker-compose.cloud.yml'
  ```
- Los comandos de los actos 3 y 4, en un archivo de texto para copiar y pegar. No se tipean en vivo.

La contraseña está en `credenciales-demo.md` y en `DEMO_PASSWORD`. Si Clerk pide un código, es `424242`.

### Guion

| Tiempo | Acto | Manos (Fran Costa) | Voz (Andy) |
|---|---|---|---|
| 0:00 – 0:35 | **1. El recorrido** | Dashboard de Ana, pestaña Juana. | «Esto ve un padre. Diez días de historial: tres áreas, 6 minutos 10 de tiempo efectivo, 2 niveles de 27 y un aviso de interés en Medicina. Nada de esto lo escribió el juego: lo armó un consumidor leyendo Kafka.» |
| 0:35 – 1:45 | **2. Interés en vivo** | Tomás entra a Medicina, nivel 1: toca Otitis (falla, se ven las fichas) y después **Resfrío**. Nivel 2: toca **Fractura**. Vuelve a Ana, pestaña Tomás. Abre Mailpit. | «Tomás juega. Cada toque es un evento en Kafka. Completó dos niveles de Medicina… y en el dashboard de Ana aparece solo, sin recargar, con el aviso de interés. Y llegó el mail.» |
| 1:45 – 3:15 | **3. Se cae el procesamiento** | Terminal 2: `dc stop alertas proyector`. Tomás entra al nivel 3, toca **Neumonía** (falla) y «Salir del nivel». Vuelve a entrar, toca **Bronquiolitis** (falla) y sale. Kafka UI: el atraso de los dos grupos. Terminal 2: `dc start alertas proyector`. Dashboard de Ana y Mailpit. | «Apagamos el procesamiento y las alertas. Tomás sigue jugando sin errores: el juego no depende del mail. En Kafka UI se ven los eventos esperando. Los prendemos… se ponen al día solos, y como Tomás salió dos veces del mismo nivel después de intentar, llega el aviso de frustración.» |
| 3:15 – 4:30 | **4. Releer la historia** | Terminal 2: comando A. Dashboard de Ana, vacío. Comando B. Dashboard de Ana, otra vez completo. | «Esta es la razón por la que elegimos Kafka. Borramos todo el modelo de lectura: el dashboard quedó vacío. Le decimos al consumidor que relea el log desde el principio… y volvió exactamente igual. Así se calcula una métrica nueva sobre toda la historia.» |

Comando A, borrar el modelo de lectura:

```bash
dc stop proyector && dc exec postgres psql -U yolo -c "truncate eventos_procesados, recorrido_estado, progreso_area, actividad_diaria"
```

Comando B, releer desde el offset 0:

```bash
dc exec kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group dashboard-proyector --topic juego.eventos --reset-offsets --to-earliest --execute && dc start proyector
```

Las respuestas de los juegos salen del código (`web/lib/juegos/caso.ts`): el diagnóstico escondido es Resfrío en el nivel 1, Fractura en el 2 y Crisis de asma en el 3. Los comandos de los actos 3 y 4 son las pruebas 4 y 6 del README, con el compose de la VM.

### Si algo sale mal

- **Regla de corte:** si a los 3:15 el acto 3 no terminó, el acto 4 no se hace. Se dice una frase («el replay lo podemos mostrar en las preguntas») y se cierra. Pasarse penaliza; mostrar tres actos, no.
- **Si el comando B dice que el grupo está activo:** esperar unos segundos y repetirlo. El consumidor se desconecta al recibir la señal de apagado, así que no debería pasar.
- **Si el dashboard tarda:** se actualiza cada 5 segundos. La voz sigue hablando; no se recarga a mano.
- **Si no hay red:** datos del celular. Si tampoco, el video grabado la noche anterior (ver la lista de abajo).
- **Sin ensayar no se sabe** cuánto tardan los consumidores en reconectarse en el acto 3 ni el acto 4 completo. Hay que medirlos con cronómetro antes de mañana.

## Preguntas (10 minutos como mínimo)

Reglas: responde uno, en 30 o 40 segundos; otro puede sumar una frase. Si no se sabe algo, se dice y se cuenta cómo se averiguaría. Reparto propuesto: **Franco**, producto, decisión y estimación; **Eugenio**, Kafka y consumidores; **Andy**, juegos, Clerk y seguridad; **Fran Costa**, despliegue y costos.

### La decisión

- **¿Por qué Kafka y no RabbitMQ?** En sus colas clásicas, RabbitMQ borra el mensaje cuando el consumidor lo confirma. Nosotros necesitamos releer la historia para calcular métricas nuevas. RabbitMQ Streams lo permite, pero no es su caso de uso natural.
- **¿No es demasiado para un piloto?** Sí, por volumen: Postgres alcanzaba. Lo elegimos por la relectura y por el desacople. En una VM cuesta lo mismo, y se puede reemplazar sin tocar los juegos porque los contratos de eventos no cambian.
- **En la clase 9 habían propuesto otra cosa.** Sí: para el MVP, un bus apoyado en la base de datos, y el servicio pub-sub para la expansión. La PoC usa Kafka directamente porque la relectura es lo que queríamos probar.
- **¿Y si guardan los eventos crudos en Postgres?** Se puede, pero es reconstruir a mano lo que Kafka ya trae: un log ordenado, la posición de cada consumidor y la recuperación después de una caída. *(Argumento nuestro; el white paper solo dice que haría falta guardarlos.)*
- **¿Y Airflow o Prefect?** No compiten: sirven para el reporte nocturno por colegio. Para las alertas no, porque llegarían al día siguiente.

### Kafka

- **¿Qué garantía de entrega tienen?** *At-least-once* con consumidor idempotente: cada evento se aplica en la misma transacción en la que se registra su `eventId`. El *exactly-once* de Kafka vale entre tópicos; acá el efecto ocurre en Postgres.
- **¿Por qué esa clave y tres particiones?** La clave es el id del alumno: todos sus eventos caen en la misma partición y quedan en orden, que es lo que necesita el tiempo efectivo. Las particiones son el techo de paralelismo de cada grupo.
- **¿Grupo de consumidores o publish–subscribe?** Las dos cosas. Entre grupos, cada uno recibe todos los mensajes. Dentro de un grupo, cada partición la lee un solo consumidor.
- **¿Qué pasa si se cae un consumidor?** Retoma desde su último offset confirmado. Es el acto 3 de la demo.
- **¿Qué pasa si se cae Kafka?** Es el punto débil de la PoC: hay un solo broker, sin replicación. La ingesta guarda la jugada en Postgres (`eventos_salida`) y después publica. Si Kafka no responde, el pedido falla, el navegador reintenta hasta tres veces con el mismo `eventId`, y ese reintento publica lo que ya estaba guardado. Si Kafka sigue caído, el alumno ve un error. En producción: tres brokers o un servicio gestionado. *(Leído en `web/app/api/eventos/route.ts` y en `cliente.ts`.)*
- **¿La retención infinita no crece sin límite? ¿Y si una familia pide borrar sus datos?** Los eventos solo llevan un id seudónimo; el nombre y el mail están en Postgres y en Clerk. La PoC no resuelve el borrado: hay que decirlo así. *(Posible salida, a estudiar: borrar el vínculo entre el id y la persona.)*
- **¿Qué es KRaft?** Desde Kafka 4.0 no existe ZooKeeper: el clúster maneja sus metadatos con un consenso propio basado en Raft. Por eso alcanza un contenedor que es broker y controlador.
- **¿Cómo escala?** Más particiones y más instancias en cada grupo, y Kafka como servicio gestionado: Confluent Cloud o Azure Event Hubs.

### Arquitectura y atributos de calidad

- **¿Qué estilo es?** Publish–subscribe, con los tres tipos de procesamiento de eventos de la clase 8: *single* (un nivel completado actualiza la profundidad), *stream* (tiempo efectivo y sesiones) y *complex* (interés y frustración).
- **¿Qué priorizaron y qué resignaron?** Modificabilidad (métricas nuevas, M1) y confiabilidad (no perder interacciones, C1; que el juego siga si fallan las alertas, D2). A cambio, más complejidad operativa y un dashboard que va unos segundos atrás.
- **¿Y la latencia del alumno?** El nivel siguiente lo desbloquea el servidor al validar la jugada, sin esperar al proyector (R1).
- **¿Por qué refrescar cada 5 segundos y no websockets?** El adulto no mira el dashboard segundo a segundo. No hacía falta más.
- **¿Cómo cuidan los datos de menores?** Los eventos llevan solo el id seudónimo y el texto que escribe el alumno no se publica. El padre ve solo a los hijos que vinculó y el profesor, a su curso; si no hay vínculo, responde 404. El alumno se toma de la sesión, nunca del pedido.
- **¿Cómo se calcula el tiempo efectivo?** No cuenta los huecos de más de 2 minutos dentro de un nivel. Una sesión se cierra a los 30 minutos sin actividad.
- **¿Cuándo hay frustración?** Dos salidas del mismo nivel con al menos un intento antes de cada una. Completar el nivel corta la racha.
- **¿Y si falla el mail?** La alerta queda en el dashboard, sin mail. Se resuelve con un *outbox*: es uno de los próximos pasos.

### Proyecto

- **¿Cómo estimaron?** PERT por paquete de trabajo: (O + 4M + P) / 6. Seis paquetes suman 18,3 semanas-persona. Con tres personas son 6 o 7 semanas, más contingencia. Entra en los meses 1 a 3 del business case.
- **¿Cuánto cuesta?** El piloto, una VM de unos USD 30 por mes a precio de lista, más el dominio y un servicio de mail. Los servicios gestionados, recién en la expansión.
- **¿Qué falta para producción?** Kafka replicado o gestionado, contratos de eventos con Schema Registry, *outbox* para los mails, monitoreo del atraso y los reportes por curso.
- **¿Dónde están los reportes por curso?** No están hechos: son una funcionalidad del producto, no de la PoC. Hoy el profesor ve el mismo dashboard individual, limitado a los alumnos de su curso. El reporte agregado sería un consumidor nuevo que relee el mismo log, sin tocar lo que ya funciona: es el caso que justifica haber elegido Kafka.
- **¿Por qué Clerk no está en el compose?** Es un servicio externo a propósito: la identidad no es lo que la PoC demuestra. El costo es que hacen falta sus claves para levantarla; van con la entrega.
- **¿Qué harían distinto? ¿Qué aprendieron?** Cada uno lleva pensada su respuesta.

## Lista para hoy y mañana

**Hoy, 25/11**

- [ ] Confirmar el número de grupo y el horario.
- [ ] Confirmar el reparto de arriba, o cambiarlo.
- [ ] `git pull` en cada copia del repositorio.
- [ ] Verificar que la VM está prendida, que la URL responde y que las tres cuentas entran.
- [ ] Armar las seis diapositivas.
- [ ] Ensayar dos veces con cronómetro: exposición en 4:30 o menos, demo en 4:30 o menos.
- [ ] Decidir qué notebook se usa, y confirmar que su clave SSH está autorizada en la VM y que tiene adaptador para el proyector.
- [ ] Grabar la demo completa en video, como plan B.
- [ ] Confirmar con Fran Costa el tamaño real de la VM: el diagrama de despliegue dice `Standard_B2s`, y una nota del 19/11 la registraba como `Standard_D2s_v4`. Si preguntan, hay que decir el que es.

**Mañana a la mañana**

- [ ] Después del último ensayo, `deploy/azure.sh reset` desde una máquina con `az` configurado. Deja a Juana con su historial, fechado respecto de ese día, y a Tomás vacío.
- [ ] Verificar el dashboard de Juana contra el README: 6 min 10 s, 2 de 27 niveles, interés en Medicina.
- [ ] Después del reset, nadie juega con Tomás ni corre `e2e.sh` o `carga.sh`.

**Media hora antes**

- [ ] Abrir el túnel, las dos ventanas, Kafka UI, Mailpit y las dos terminales.
- [ ] Agrandar la letra de la terminal y el zoom del navegador. Activar «no molestar». Batería cargada.
- [ ] Tener a mano el archivo con los comandos y un celular con datos.

**En el turno**

- [ ] Cronómetro a la vista. El que no habla marca los 4:00 y los 4:30.
