-- Usuarios y vínculos. La identidad la maneja Clerk; acá queda el rol y a quién puede ver cada adulto.
create table usuarios (
  id        uuid primary key,
  clerk_id  text unique,
  email     text unique not null,
  nombre    text not null,
  rol       text not null check (rol in ('alumno', 'padre', 'profesor')),
  codigo    text unique -- lo tiene el alumno; el padre lo escribe en el onboarding
);

create table cursos (
  id     uuid primary key,
  nombre text not null,
  codigo text unique not null
);

create table alumno_curso (
  alumno_id uuid references usuarios (id),
  curso_id  uuid references cursos (id),
  primary key (alumno_id, curso_id)
);

create table vinculo_padre (
  padre_id  uuid references usuarios (id),
  alumno_id uuid references usuarios (id),
  primary key (padre_id, alumno_id)
);

create table profesor_curso (
  profesor_id uuid references usuarios (id),
  curso_id    uuid references cursos (id),
  primary key (profesor_id, curso_id)
);

-- Partida en curso. La escribe la app al validar un intento; Kafka no es la fuente de este estado.
create table partida (
  alumno_id uuid,
  area      text,
  nivel     int,
  estado    jsonb not null,
  primary key (alumno_id, area, nivel)
);

-- Un reintento del navegador con el mismo eventId no vuelve a publicar.
create table eventos_salida (
  event_id  text primary key,
  payloads  jsonb not null,
  respuesta jsonb not null,
  status    int not null
);

-- Modelo de lectura del dashboard. Lo escribe solo el consumidor "proyector" a partir de Kafka.
create table eventos_procesados (
  event_id  text primary key,
  procesado timestamptz not null default now()
);

create table recorrido_estado (
  alumno_id   uuid primary key,
  ultimo_ts   bigint not null,
  ultimo_tipo text not null,
  ultima_area text not null,
  sesiones    int not null
);

create table progreso_area (
  alumno_id        uuid,
  area             text,
  tiempo_ms        bigint not null default 0,
  nivel_max        int not null default 0,
  completados      int not null default 0,
  abandonos        int not null default 0,
  intentos         int not null default 0,
  aciertos         int not null default 0,
  ultima_actividad timestamptz,
  primary key (alumno_id, area)
);

create table actividad_diaria (
  alumno_id uuid,
  dia       date,
  area      text,
  tiempo_ms bigint not null default 0,
  primary key (alumno_id, dia, area)
);

-- Lo escribe el consumidor "alertas". El estado permite replay: no vive en memoria.
create table alertas_procesadas (
  event_id text primary key
);

create table alerta_estado (
  alumno_id uuid primary key,
  estado    jsonb not null
);

create table alertas (
  id        text primary key,
  alumno_id uuid not null,
  tipo      text not null check (tipo in ('interes', 'frustracion')),
  area      text not null,
  mensaje   text not null,
  creada    timestamptz not null default now()
);

-- Demo. Ana es padre de Juana y Tomás. Pablo es profesor del curso donde está solo Lucía.
insert into usuarios (id, email, nombre, rol, codigo) values
  ('11111111-1111-4111-8111-111111111111', 'juana+clerk_test@example.com', 'Juana', 'alumno', 'JUANA'),
  ('22222222-2222-4222-8222-222222222222', 'tomas+clerk_test@example.com', 'Tomás', 'alumno', 'TOMAS'),
  ('33333333-3333-4333-8333-333333333333', 'lucia+clerk_test@example.com', 'Lucía', 'alumno', 'LUCIA'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ana+clerk_test@example.com', 'Ana', 'padre', null),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'pablo+clerk_test@example.com', 'Pablo', 'profesor', null);

insert into cursos (id, nombre, codigo) values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '5.° B', '5TOB');

insert into alumno_curso values
  ('33333333-3333-4333-8333-333333333333', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');

insert into vinculo_padre values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222');

insert into profesor_curso values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
