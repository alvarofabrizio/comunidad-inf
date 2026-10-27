-- =============================================================================
-- Comunidad INF · 0001_esquema.sql
-- Tablas del modelo de datos (docs/03_ARQUITECTURA.md).
-- Ejecutar PRIMERO en el SQL Editor de Supabase. Luego 0002 y después seed.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Temporadas: agrupan actividades y encuestas. Solo una puede estar activa.
-- ---------------------------------------------------------------------------
create table public.temporadas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique check (length(trim(nombre)) > 0),
  fecha_inicio  date not null,
  fecha_fin     date not null,
  activa        boolean not null default false,
  check (fecha_fin >= fecha_inicio)
);
-- Índice parcial: como máximo una fila con activa = true.
create unique index temporadas_una_activa on public.temporadas (activa) where activa;

-- ---------------------------------------------------------------------------
-- Participantes: el id es el auth.uid() de la sesión anónima del dispositivo.
-- No lleva FK a auth.users para que la semilla pueda crear personas ficticias
-- sin cuenta; la RLS (0002) exige id = auth.uid() para crear o editar.
-- No se pide ni se guarda género ni otros datos sensibles.
-- ---------------------------------------------------------------------------
create table public.participantes (
  id                 uuid primary key,
  nombre             text not null check (length(trim(nombre)) between 2 and 80),
  alias              text not null check (length(trim(alias)) between 3 and 20),
  correo             text not null check (correo ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  codigo_pucp        text check (codigo_pucp ~ '^[0-9]{8}$'),
  especialidad       text not null default 'Ingeniería Informática',
  consentimiento     boolean not null check (consentimiento),   -- sin consentimiento no hay registro
  consentimiento_en  timestamptz not null default now(),
  creado_en          timestamptz not null default now()
);
-- UNIQUE sin distinguir mayúsculas: "Ana@x.pe" y "ana@x.pe" son el mismo correo.
-- api.ts reconoce estos nombres de índice para mostrar un mensaje claro.
create unique index participantes_correo_unico on public.participantes (lower(correo));
create unique index participantes_alias_unico  on public.participantes (lower(alias));

-- ---------------------------------------------------------------------------
-- Organizadores: usuarios con correo y contraseña creados a mano en Supabase.
-- ---------------------------------------------------------------------------
create table public.organizadores (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  nombre   text not null
);

-- ---------------------------------------------------------------------------
-- Actividades
-- ---------------------------------------------------------------------------
create table public.actividades (
  id                    uuid primary key default gen_random_uuid(),
  temporada_id          uuid not null references public.temporadas (id) on delete cascade,
  titulo                text not null check (length(trim(titulo)) > 0),
  tipo                  text not null check (tipo in ('videojuego', 'deporte', 'social', 'academica')),
  juego_o_disciplina    text,
  descripcion           text not null default '',
  fecha_hora            timestamptz not null,
  lugar                 text not null,
  modalidad             text not null check (modalidad in ('presencial', 'virtual')),
  cupo                  integer not null check (cupo > 0),                       -- máximo de PERSONAS inscritas (incluye bolsa)
  tamano_equipo         integer not null default 1 check (tamano_equipo between 1 and 20), -- 1 = individual
  requiere_mixto        boolean not null default false,
  puntos_participacion  integer not null default 5  check (puntos_participacion >= 0),
  puntos_1              integer not null default 10 check (puntos_1 >= 0),
  puntos_2              integer not null default 6  check (puntos_2 >= 0),
  puntos_3              integer not null default 4  check (puntos_3 >= 0),
  estado                text not null default 'borrador'
                        check (estado in ('borrador', 'abierta', 'cerrada', 'finalizada')),
  creado_en             timestamptz not null default now()
);
create index actividades_temporada on public.actividades (temporada_id, fecha_hora);

-- ---------------------------------------------------------------------------
-- Equipos. El código de invitación NO es público (ver vista_equipos_publica).
-- ---------------------------------------------------------------------------
create table public.equipos (
  id                    uuid primary key default gen_random_uuid(),
  actividad_id          uuid not null references public.actividades (id) on delete cascade,
  nombre                text not null check (length(trim(nombre)) between 2 and 40),
  codigo_invitacion     text not null unique check (codigo_invitacion ~ '^[A-Z0-9]{6}$'),
  capitan_id            uuid references public.participantes (id) on delete set null,
  declara_cumple_mixto  boolean not null default false,  -- declaración del capitán; no se guarda género
  buscando_integrantes  boolean not null default true,
  creado_en             timestamptz not null default now(),
  -- Permite que inscripciones referencie (equipo, actividad) juntos y así
  -- sea imposible meter a alguien en un equipo de OTRA actividad.
  unique (id, actividad_id)
);
create unique index equipos_nombre_unico on public.equipos (actividad_id, lower(nombre));

-- ---------------------------------------------------------------------------
-- Inscripciones: una por persona y actividad.
--   equipo_id NULL y en_bolsa = false → inscripción individual
--   equipo_id NULL y en_bolsa = true  → "Busco equipo" (está en la bolsa)
--   equipo_id con valor               → miembro de ese equipo
-- ---------------------------------------------------------------------------
create table public.inscripciones (
  id               uuid primary key default gen_random_uuid(),
  actividad_id     uuid not null references public.actividades (id) on delete cascade,
  participante_id  uuid not null references public.participantes (id) on delete cascade,
  equipo_id        uuid,
  en_bolsa         boolean not null default false,
  asistio          boolean not null default false,
  creado_en        timestamptz not null default now(),
  unique (actividad_id, participante_id),
  check (not (en_bolsa and equipo_id is not null)),
  -- Si se borra el equipo, la persona queda sin equipo (solo se anula equipo_id).
  foreign key (equipo_id, actividad_id)
    references public.equipos (id, actividad_id) on delete set null (equipo_id)
);
create index inscripciones_equipo on public.inscripciones (equipo_id);

-- ---------------------------------------------------------------------------
-- Resultados: posición (1.°, 2.° o 3.°) de un equipo O de una persona.
-- Se permiten empates (dos filas con la misma posición).
-- ---------------------------------------------------------------------------
create table public.resultados (
  id               uuid primary key default gen_random_uuid(),
  actividad_id     uuid not null references public.actividades (id) on delete cascade,
  equipo_id        uuid,
  participante_id  uuid references public.participantes (id) on delete cascade,
  posicion         integer not null check (posicion between 1 and 3),
  check (num_nonnulls(equipo_id, participante_id) = 1),
  foreign key (equipo_id, actividad_id)
    references public.equipos (id, actividad_id) on delete cascade,
  unique (actividad_id, equipo_id),
  unique (actividad_id, participante_id)
);

-- ---------------------------------------------------------------------------
-- Encuestas, opciones y votos
-- ---------------------------------------------------------------------------
create table public.encuestas (
  id                       uuid primary key default gen_random_uuid(),
  temporada_id             uuid not null references public.temporadas (id) on delete cascade,
  titulo                   text not null check (length(trim(titulo)) > 0),
  max_votos_por_categoria  integer not null default 1 check (max_votos_por_categoria >= 1),
  abierta                  boolean not null default true,
  cierra_en                timestamptz,
  creado_en                timestamptz not null default now()
);

create table public.opciones_encuesta (
  id          uuid primary key default gen_random_uuid(),
  encuesta_id uuid not null references public.encuestas (id) on delete cascade,
  categoria   text not null check (categoria in ('juego', 'actividad', 'horario')),
  texto       text not null check (length(trim(texto)) > 0),
  orden       integer not null default 0,
  unique (encuesta_id, categoria, texto),
  unique (id, encuesta_id)
);

create table public.votos (
  id               uuid primary key default gen_random_uuid(),
  encuesta_id      uuid not null references public.encuestas (id) on delete cascade,
  opcion_id        uuid not null,
  participante_id  uuid not null references public.participantes (id) on delete cascade,
  creado_en        timestamptz not null default now(),
  unique (opcion_id, participante_id),
  -- La opción tiene que pertenecer a la misma encuesta del voto.
  foreign key (opcion_id, encuesta_id)
    references public.opciones_encuesta (id, encuesta_id) on delete cascade
);
create index votos_encuesta_participante on public.votos (encuesta_id, participante_id);

-- ---------------------------------------------------------------------------
-- Resúmenes de actividad (P1-3). Una imagen solo se guarda si se declaró
-- que las personas que aparecen autorizaron su publicación.
-- ---------------------------------------------------------------------------
create table public.resumenes (
  id                 uuid primary key default gen_random_uuid(),
  actividad_id       uuid not null unique references public.actividades (id) on delete cascade,
  texto              text not null check (length(trim(texto)) > 0),
  ganadores          text,
  imagen_url         text,
  imagen_autorizada  boolean not null default false,
  publicado_en       timestamptz not null default now(),
  check (imagen_url is null or imagen_autorizada)
);
