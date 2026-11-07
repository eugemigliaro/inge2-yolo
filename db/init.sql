-- Datos de la aplicación: usuarios, vínculos tutor-alumno y sesiones web.
create table usuarios (
  id            uuid primary key,
  email         text unique not null,
  nombre        text not null,
  rol           text not null check (rol in ('alumno', 'tutor')),
  password_hash text not null -- scrypt: "<salt>:<hash>" en hex
);

create table tutor_alumno (
  tutor_id  uuid references usuarios (id),
  alumno_id uuid references usuarios (id),
  primary key (tutor_id, alumno_id)
);

create table sesiones_web (
  token      text primary key,
  usuario_id uuid not null references usuarios (id),
  expira     timestamptz not null
);

-- Modelo de lectura del dashboard. Lo escribe solo el consumidor "proyector" a partir de Kafka.
create table eventos_procesados (
  event_id  text primary key, -- deduplicación: cada evento se aplica una sola vez
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
  nivel_max        int not null default 0, -- nivel más alto completado (profundidad)
  completados      int not null default 0,
  abandonos        int not null default 0,
  decisiones       int not null default 0,
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

-- Lo escribe el consumidor "alertas".
create table alertas (
  id        text primary key,
  alumno_id uuid not null,
  tipo      text not null check (tipo in ('interes', 'frustracion')),
  area      text not null,
  mensaje   text not null,
  creada    timestamptz not null default now()
);

-- Usuarios de demo. Contraseña de todos: yolo1234
insert into usuarios (id, email, nombre, rol, password_hash) values
  ('11111111-1111-4111-8111-111111111111', 'juana@yolo.test', 'Juana', 'alumno',
   '3d4285d9356e2cde70f39891db1a931c:8b13d707935f0aec242e01cbd911858d073e9af6a2b87ba7313484be8aec6969'),
  ('22222222-2222-4222-8222-222222222222', 'tomas@yolo.test', 'Tomás', 'alumno',
   '50b40a8b6b48087ba0caac547bf9e61e:33af9407a76caa6abbc19366f3566c87d5b90803c7372e9f61b8a5b5e0ce5c73'),
  ('33333333-3333-4333-8333-333333333333', 'lucia@yolo.test', 'Lucía', 'alumno',
   '507ed26b5925a3c729f60af09e97bf5f:93f4f50dc5bc537040c5e9d71eeac58e65baa3b9fbd2546c9734bdd3ad35a43b'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ana@yolo.test', 'Ana', 'tutor',
   'e5211a90511575d1ccc284b008cf06fc:8146c41b50a6955da4e5dedbd803b83bc5d63f2bf8b8c4441aa694d4f01c73b3'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'pablo@yolo.test', 'Pablo', 'tutor',
   '34101b3002a3eacc74e0953626ed2f5f:947a58199259882744f372b865bbf9cf2495afd8964b8c33560a3c913bf8ed83');

-- Ana es tutora de Juana y Tomás; Pablo, solo de Lucía.
insert into tutor_alumno values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '33333333-3333-4333-8333-333333333333');
