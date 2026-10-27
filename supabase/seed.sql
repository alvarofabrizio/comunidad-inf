-- =============================================================================
-- Comunidad INF · seed.sql
-- Datos semilla para la demo (sección 8 de 02_CONTEXTO_PROBLEMATICA.md).
-- TODO ES FICTICIO: nombres "Participante Demo NN", correos @example.com
-- (dominio reservado que no pertenece a nadie) y alias inventados.
-- Ejecutar DESPUÉS de 0001 y 0002. Se puede volver a ejecutar sin duplicar
-- (on conflict do nothing).
--
-- Ids fijos para poder referirlos y verificarlos:
--   temporada  a0000000-…-0001
--   encuesta   b0000000-…-0001
--   actividades c0000000-…-0001 a 0005
--   equipos    d0000000-…-0001 a 0007
--   participantes e0000000-…-0001 a 0012
-- =============================================================================

-- Temporada --------------------------------------------------------------------
insert into public.temporadas (id, nombre, fecha_inicio, fecha_fin, activa) values
  ('a0000000-0000-0000-0000-000000000001', 'Temporada 2026-2', '2026-08-17', '2026-12-12', true)
on conflict do nothing;

-- Participantes ficticios ------------------------------------------------------
insert into public.participantes (id, nombre, alias, correo, especialidad, consentimiento) values
  ('e0000000-0000-0000-0000-000000000001', 'Participante Demo 01', 'PixelPuma',     'demo01@example.com', 'Ingeniería Informática', true),
  ('e0000000-0000-0000-0000-000000000002', 'Participante Demo 02', 'ByteLlama',     'demo02@example.com', 'Ingeniería Informática', true),
  ('e0000000-0000-0000-0000-000000000003', 'Participante Demo 03', 'NeonCondor',    'demo03@example.com', 'Ingeniería Informática', true),
  ('e0000000-0000-0000-0000-000000000004', 'Participante Demo 04', 'QuantumCuy',    'demo04@example.com', 'Ingeniería Informática', true),
  ('e0000000-0000-0000-0000-000000000005', 'Participante Demo 05', 'LagAlpaca',     'demo05@example.com', 'Ingeniería Informática', true),
  ('e0000000-0000-0000-0000-000000000006', 'Participante Demo 06', 'DebugZorro',    'demo06@example.com', 'Ingeniería Informática', true),
  ('e0000000-0000-0000-0000-000000000007', 'Participante Demo 07', 'KernelPanda',   'demo07@example.com', 'Ingeniería Informática', true),
  ('e0000000-0000-0000-0000-000000000008', 'Participante Demo 08', 'StackVicuna',   'demo08@example.com', 'Ingeniería Informática', true),
  ('e0000000-0000-0000-0000-000000000009', 'Participante Demo 09', 'CacheColibri',  'demo09@example.com', 'Ingeniería Informática', true),
  ('e0000000-0000-0000-0000-000000000010', 'Participante Demo 10', 'RootOtorongo',  'demo10@example.com', 'Ingeniería Informática', true),
  ('e0000000-0000-0000-0000-000000000011', 'Participante Demo 11', 'BinarioBuho',   'demo11@example.com', 'Ingeniería Informática', true),
  ('e0000000-0000-0000-0000-000000000012', 'Participante Demo 12', 'PingPinguino',  'demo12@example.com', 'Ingeniería Informática', true)
on conflict do nothing;

-- Encuesta activa --------------------------------------------------------------
insert into public.encuestas (id, temporada_id, titulo, max_votos_por_categoria, abierta, cierra_en) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   '¿Qué jugamos este ciclo?', 2, true, '2026-11-30 23:59:00-05')
on conflict do nothing;

insert into public.opciones_encuesta (encuesta_id, categoria, texto, orden)
select 'b0000000-0000-0000-0000-000000000001', categoria, texto, orden
  from (values
    ('juego', 'LoL', 1), ('juego', 'Valorant', 2), ('juego', 'Counter-Strike 2', 3),
    ('juego', 'EA FC', 4), ('juego', 'Mario Kart', 5), ('juego', 'Fortnite', 6),
    ('juego', 'Ajedrez', 7),
    ('actividad', 'Torneo de videojuegos', 1), ('actividad', 'Vóley mixto', 2),
    ('actividad', 'Show de talentos', 3), ('actividad', 'Duelo contra profesores', 4),
    ('actividad', 'Picnic', 5),
    ('horario', 'Después de parciales', 1), ('horario', 'Viernes en la tarde', 2),
    ('horario', 'Sábado en la mañana', 3)
  ) as o(categoria, texto, orden)
on conflict do nothing;

-- Votos de 8 participantes (máximo 2 por categoría).
insert into public.votos (encuesta_id, opcion_id, participante_id)
select 'b0000000-0000-0000-0000-000000000001', o.id, v.participante::uuid
  from (values
    ('e0000000-0000-0000-0000-000000000001', 'juego', 'Valorant'),
    ('e0000000-0000-0000-0000-000000000001', 'juego', 'LoL'),
    ('e0000000-0000-0000-0000-000000000001', 'actividad', 'Torneo de videojuegos'),
    ('e0000000-0000-0000-0000-000000000001', 'horario', 'Después de parciales'),
    ('e0000000-0000-0000-0000-000000000002', 'juego', 'Valorant'),
    ('e0000000-0000-0000-0000-000000000002', 'actividad', 'Duelo contra profesores'),
    ('e0000000-0000-0000-0000-000000000002', 'horario', 'Viernes en la tarde'),
    ('e0000000-0000-0000-0000-000000000003', 'juego', 'Mario Kart'),
    ('e0000000-0000-0000-0000-000000000003', 'actividad', 'Vóley mixto'),
    ('e0000000-0000-0000-0000-000000000003', 'actividad', 'Picnic'),
    ('e0000000-0000-0000-0000-000000000003', 'horario', 'Sábado en la mañana'),
    ('e0000000-0000-0000-0000-000000000004', 'juego', 'Ajedrez'),
    ('e0000000-0000-0000-0000-000000000004', 'actividad', 'Show de talentos'),
    ('e0000000-0000-0000-0000-000000000004', 'horario', 'Después de parciales'),
    ('e0000000-0000-0000-0000-000000000005', 'juego', 'Counter-Strike 2'),
    ('e0000000-0000-0000-0000-000000000005', 'juego', 'Valorant'),
    ('e0000000-0000-0000-0000-000000000005', 'actividad', 'Torneo de videojuegos'),
    ('e0000000-0000-0000-0000-000000000005', 'horario', 'Viernes en la tarde'),
    ('e0000000-0000-0000-0000-000000000006', 'juego', 'EA FC'),
    ('e0000000-0000-0000-0000-000000000006', 'actividad', 'Vóley mixto'),
    ('e0000000-0000-0000-0000-000000000006', 'horario', 'Viernes en la tarde'),
    ('e0000000-0000-0000-0000-000000000007', 'juego', 'Mario Kart'),
    ('e0000000-0000-0000-0000-000000000007', 'juego', 'Fortnite'),
    ('e0000000-0000-0000-0000-000000000007', 'actividad', 'Duelo contra profesores'),
    ('e0000000-0000-0000-0000-000000000007', 'horario', 'Después de parciales'),
    ('e0000000-0000-0000-0000-000000000008', 'juego', 'LoL'),
    ('e0000000-0000-0000-0000-000000000008', 'actividad', 'Picnic'),
    ('e0000000-0000-0000-0000-000000000008', 'actividad', 'Show de talentos'),
    ('e0000000-0000-0000-0000-000000000008', 'horario', 'Sábado en la mañana')
  ) as v(participante, categoria, texto)
  join public.opciones_encuesta o
    on o.encuesta_id = 'b0000000-0000-0000-0000-000000000001'
   and o.categoria = v.categoria and o.texto = v.texto
on conflict do nothing;

-- Actividades --------------------------------------------------------------------
-- Fechas en hora de Lima (-05). "Duelo contra profes" ya pasó y está finalizada
-- para que el ranking no salga vacío.
insert into public.actividades
  (id, temporada_id, titulo, tipo, juego_o_disciplina, descripcion, fecha_hora, lugar, modalidad,
   cupo, tamano_equipo, requiere_mixto, puntos_participacion, estado)
values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Torneo post-parciales', 'videojuego', 'Valorant',
   'Torneo 5 vs 5 para desestresarnos después de parciales. Puedes venir con equipo o inscribirte solo y te ayudamos a encontrar uno. Sin costo de inscripción.',
   '2026-11-14 15:00:00-05', 'Laboratorio de cómputo (por confirmar)', 'presencial',
   30, 5, true, 5, 'abierta'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'Vóley mixto de integración', 'deporte', 'Vóley',
   'Partidos cortos con equipos mezclados de distintos ciclos. Lo importante es conocerse, no ganar.',
   '2026-11-21 10:00:00-05', 'Cancha del campus (por confirmar)', 'presencial',
   36, 6, true, 5, 'abierta'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'Show de talentos INF', 'social', 'Talentos',
   'Canta, toca, baila, haz stand-up o muestra tu proyecto. También se suman puntos por ir a ver.',
   '2026-11-28 17:00:00-05', 'Auditorio (por confirmar)', 'presencial',
   40, 1, false, 5, 'abierta'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   'Duelo contra profes', 'videojuego', 'Mario Kart',
   'Parejas de estudiantes contra parejas de profesores.',
   '2026-10-16 16:00:00-05', 'Sala de estudio (por confirmar)', 'presencial',
   16, 2, false, 5, 'finalizada'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
   'Chocolatada de fin de ciclo', 'social', 'Chocolatada',
   'Cerramos la temporada con chocolate caliente y la premiación del ranking.',
   '2026-12-11 16:00:00-05', 'Explanada (por confirmar)', 'presencial',
   150, 1, false, 5, 'abierta')
on conflict do nothing;

-- Equipos ----------------------------------------------------------------------
insert into public.equipos
  (id, actividad_id, nombre, codigo_invitacion, capitan_id, declara_cumple_mixto, buscando_integrantes)
values
  -- Duelo contra profes (finalizada, equipos de 2)
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Caparazones Azules', 'DUEL01', 'e0000000-0000-0000-0000-000000000001', false, false),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'Banana Drift',       'DUEL02', 'e0000000-0000-0000-0000-000000000003', false, false),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'Turbo Cuyes',        'DUEL03', 'e0000000-0000-0000-0000-000000000005', false, false),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Ultimo Lugar FC',    'DUEL04', 'e0000000-0000-0000-0000-000000000007', false, false),
  -- Torneo post-parciales (abierta, equipos de 5, mixto): ambos con espacio
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'NullPointers',       'NULPTR', 'e0000000-0000-0000-0000-000000000001', true,  true),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'Ctrl Alt Win',       'CTRLAW', 'e0000000-0000-0000-0000-000000000005', false, true),
  -- Vóley mixto (abierta, equipos de 6)
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'Saque Binario',      'SAQUEB', 'e0000000-0000-0000-0000-000000000006', true,  true)
on conflict do nothing;

-- Inscripciones -------------------------------------------------------------------
insert into public.inscripciones (actividad_id, participante_id, equipo_id, en_bolsa, asistio) values
  -- Duelo contra profes: todos asistieron menos StackVicuna (Demo 08)
  ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', false, true),
  ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', false, true),
  ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', false, true),
  ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', false, true),
  ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', false, true),
  ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', false, true),
  ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004', false, true),
  ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', false, false),
  -- Torneo post-parciales: NullPointers (3/5), Ctrl Alt Win (2/5), bolsa: Demo 10 y 11
  ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', false, false),
  ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', false, false),
  ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000005', false, false),
  ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000006', false, false),
  ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000006', false, false),
  ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000010', null, true, false),
  ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000011', null, true, false),
  -- Vóley mixto: Saque Binario (2/6), bolsa: Demo 08
  ('c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000007', false, false),
  ('c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', false, false),
  ('c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000008', null, true, false),
  -- Show de talentos (individual)
  ('c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004', null, false, false),
  ('c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000012', null, false, false)
on conflict do nothing;

-- Resultados del Duelo contra profes ------------------------------------------------
insert into public.resultados (actividad_id, equipo_id, posicion) values
  ('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 2),
  ('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 3)
on conflict do nothing;

-- Ranking esperado con esta semilla (participación 5; 1.° 10, 2.° 6, 3.° 4):
--   PixelPuma, ByteLlama       5 + 10 = 15  (1.°)
--   NeonCondor, QuantumCuy     5 +  6 = 11  (3.°)
--   LagAlpaca, DebugZorro      5 +  4 =  9  (5.°)
--   KernelPanda                5 +  0 =  5  (7.°)
--   StackVicuna                no asistió → no aparece (0 puntos)
-- Comprobación: select alias, puntos, posicion from vista_ranking_temporada order by posicion;
