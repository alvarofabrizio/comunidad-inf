-- =============================================================================
-- Comunidad INF · 0002_rls_y_funciones.sql
-- Seguridad por filas (RLS), vistas públicas y funciones con reglas de negocio.
-- Ejecutar DESPUÉS de 0001_esquema.sql.
--
-- Idea general:
--   * Toda tabla tiene RLS activada: sin una política que lo permita, nadie
--     (ni anon ni authenticated) puede leer ni escribir.
--   * Las lecturas públicas de datos personales pasan por VISTAS que solo
--     exponen alias (nunca correo ni nombre completo).
--   * Las escrituras de participantes que tienen reglas (cupo, tamaño de equipo,
--     voto único) pasan por FUNCIONES security definer: corren con permisos del
--     dueño, validan todo dentro de una transacción y devuelven errores en
--     español. Las tablas no aceptan esas escrituras directas.
--   * Los organizadores (filas en la tabla organizadores) tienen escritura
--     completa sobre actividades, encuestas, equipos, asistencia y resultados.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Ayudantes
-- ---------------------------------------------------------------------------

-- ¿El usuario de la sesión actual es organizador? Se usa dentro de las políticas.
-- Es security definer para poder leer la tabla organizadores sin depender de su RLS.
create or replace function public.es_organizador()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.organizadores where user_id = auth.uid());
$$;

-- Devuelve el id del participante de la sesión o lanza un error claro.
create or replace function public._participante_actual()
returns uuid
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Necesitas registrarte para continuar.';
  end if;
  if not exists (select 1 from public.participantes where id = v_uid) then
    raise exception 'Primero completa tu registro (nombre, alias, correo y consentimiento).';
  end if;
  return v_uid;
end;
$$;

-- Código de invitación de 6 caracteres (A-Z, 0-9) que no exista todavía.
create or replace function public._generar_codigo()
returns text
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_codigo text;
begin
  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.equipos where codigo_invitacion = v_codigo);
  end loop;
  return v_codigo;
end;
$$;

-- Núcleo común de "unirse a un equipo" y "asignar a un equipo".
-- Reglas:
--   1. La actividad debe estar abierta (el organizador también puede en 'cerrada').
--   2. El equipo no puede superar tamano_equipo.
--   3. Si la persona no estaba inscrita, se respeta el cupo de la actividad.
--   4. Quien viene de la bolsa sale de ella (en_bolsa = false) al entrar al equipo.
--   5. Un participante no puede cambiarse solo de equipo; el organizador sí puede
--      moverlo, salvo que sea capitán de su equipo actual.
create or replace function public._agregar_a_equipo(
  p_equipo uuid, p_participante uuid, p_por_organizador boolean
)
returns uuid
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_equipo     public.equipos%rowtype;
  v_act        public.actividades%rowtype;
  v_ins        public.inscripciones%rowtype;
  v_inscrito   boolean;
  v_miembros   integer;
  v_inscritos  integer;
  v_id         uuid;
begin
  select * into v_equipo from public.equipos where id = p_equipo;
  if not found then
    raise exception 'El equipo no existe.';
  end if;

  -- Bloqueamos la fila de la actividad: si dos personas se inscriben al mismo
  -- tiempo, la segunda espera a que termine la primera. Así nunca se pasa el
  -- cupo ni el tamaño del equipo por una carrera entre peticiones.
  select * into v_act from public.actividades where id = v_equipo.actividad_id for update;

  if p_por_organizador then
    if v_act.estado not in ('abierta', 'cerrada') then
      raise exception 'Solo se pueden armar equipos en actividades abiertas o cerradas (estado actual: %).', v_act.estado;
    end if;
  elsif v_act.estado <> 'abierta' then
    raise exception 'La actividad no está abierta a inscripciones.';
  end if;

  select * into v_ins from public.inscripciones
   where actividad_id = v_act.id and participante_id = p_participante;
  v_inscrito := found;

  if v_inscrito and v_ins.equipo_id = p_equipo then
    raise exception '%', case when p_por_organizador
      then 'Esa persona ya está en este equipo.'
      else 'Ya formas parte de este equipo.' end;
  end if;

  select count(*) into v_miembros from public.inscripciones where equipo_id = p_equipo;
  if v_miembros >= v_act.tamano_equipo then
    raise exception 'El equipo "%" está lleno: ya tiene % de % integrantes.',
      v_equipo.nombre, v_miembros, v_act.tamano_equipo;
  end if;

  if v_inscrito then
    if v_ins.equipo_id is not null then
      if not p_por_organizador then
        raise exception 'Ya perteneces a otro equipo en esta actividad.';
      end if;
      if exists (select 1 from public.equipos where id = v_ins.equipo_id and capitan_id = p_participante) then
        raise exception 'Esa persona es capitana de otro equipo; primero elimina ese equipo o cambia su capitán.';
      end if;
    end if;
    update public.inscripciones
       set equipo_id = p_equipo, en_bolsa = false
     where id = v_ins.id;
    return v_ins.id;
  end if;

  select count(*) into v_inscritos from public.inscripciones where actividad_id = v_act.id;
  if v_inscritos >= v_act.cupo then
    raise exception 'Cupo lleno: la actividad ya tiene % de % personas inscritas.', v_inscritos, v_act.cupo;
  end if;

  insert into public.inscripciones (actividad_id, participante_id, equipo_id, en_bolsa)
  values (v_act.id, p_participante, p_equipo, false)
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Funciones públicas (RPC) para participantes
-- ---------------------------------------------------------------------------

-- Inscripción sin equipo.
--   p_modo = 'individual' → solo en actividades individuales (tamano_equipo = 1)
--   p_modo = 'bolsa'      → "Busco equipo", solo en actividades por equipos
create or replace function public.inscribirse(p_actividad uuid, p_modo text)
returns uuid
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_uid        uuid := public._participante_actual();
  v_act        public.actividades%rowtype;
  v_inscritos  integer;
  v_id         uuid;
begin
  select * into v_act from public.actividades where id = p_actividad for update;
  if not found or v_act.estado = 'borrador' then
    raise exception 'La actividad no existe.';
  end if;
  if v_act.estado <> 'abierta' then
    raise exception 'La actividad no está abierta a inscripciones.';
  end if;

  if p_modo = 'individual' and v_act.tamano_equipo > 1 then
    raise exception 'Esta actividad es por equipos: crea un equipo, únete con un código o elige "Busco equipo".';
  elsif p_modo = 'bolsa' and v_act.tamano_equipo = 1 then
    raise exception 'Esta actividad es individual: inscríbete directamente.';
  elsif p_modo not in ('individual', 'bolsa') then
    raise exception 'Modo de inscripción no válido.';
  end if;

  if exists (select 1 from public.inscripciones where actividad_id = p_actividad and participante_id = v_uid) then
    raise exception 'Ya estás inscrito en esta actividad.';
  end if;

  select count(*) into v_inscritos from public.inscripciones where actividad_id = p_actividad;
  if v_inscritos >= v_act.cupo then
    raise exception 'Cupo lleno: la actividad ya tiene % de % personas inscritas.', v_inscritos, v_act.cupo;
  end if;

  insert into public.inscripciones (actividad_id, participante_id, en_bolsa)
  values (p_actividad, v_uid, p_modo = 'bolsa')
  returning id into v_id;
  return v_id;
end;
$$;

-- Crea un equipo con quien llama como capitán y devuelve su código de invitación.
-- Si la persona estaba en la bolsa, sale de la bolsa y pasa a su nuevo equipo.
create or replace function public.crear_equipo(
  p_actividad uuid, p_nombre text, p_declara_cumple_mixto boolean default false
)
returns json
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_uid        uuid := public._participante_actual();
  v_act        public.actividades%rowtype;
  v_ins        public.inscripciones%rowtype;
  v_inscrito   boolean;
  v_inscritos  integer;
  v_equipo_id  uuid;
  v_codigo     text;
begin
  select * into v_act from public.actividades where id = p_actividad for update;
  if not found or v_act.estado = 'borrador' then
    raise exception 'La actividad no existe.';
  end if;
  if v_act.estado <> 'abierta' then
    raise exception 'La actividad no está abierta a inscripciones.';
  end if;
  if v_act.tamano_equipo = 1 then
    raise exception 'Esta actividad es individual: no se forman equipos.';
  end if;
  if p_nombre is null or length(trim(p_nombre)) < 2 or length(trim(p_nombre)) > 40 then
    raise exception 'El nombre del equipo debe tener entre 2 y 40 caracteres.';
  end if;

  select * into v_ins from public.inscripciones
   where actividad_id = p_actividad and participante_id = v_uid;
  v_inscrito := found;

  if v_inscrito and v_ins.equipo_id is not null then
    raise exception 'Ya perteneces a un equipo en esta actividad.';
  end if;
  if not v_inscrito then
    select count(*) into v_inscritos from public.inscripciones where actividad_id = p_actividad;
    if v_inscritos >= v_act.cupo then
      raise exception 'Cupo lleno: la actividad ya tiene % de % personas inscritas.', v_inscritos, v_act.cupo;
    end if;
  end if;

  v_codigo := public._generar_codigo();
  begin
    insert into public.equipos (actividad_id, nombre, codigo_invitacion, capitan_id, declara_cumple_mixto)
    values (p_actividad, trim(p_nombre), v_codigo, v_uid, coalesce(p_declara_cumple_mixto, false))
    returning id into v_equipo_id;
  exception when unique_violation then
    raise exception 'Ya existe un equipo llamado "%" en esta actividad.', trim(p_nombre);
  end;

  if v_inscrito then
    update public.inscripciones set equipo_id = v_equipo_id, en_bolsa = false where id = v_ins.id;
  else
    insert into public.inscripciones (actividad_id, participante_id, equipo_id)
    values (p_actividad, v_uid, v_equipo_id);
  end if;

  return json_build_object('equipo_id', v_equipo_id, 'codigo_invitacion', v_codigo);
end;
$$;

-- Unirse con el código que compartió el capitán.
create or replace function public.unirse_equipo(p_codigo text)
returns uuid
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_uid     uuid := public._participante_actual();
  v_equipo  uuid;
begin
  select id into v_equipo from public.equipos
   where codigo_invitacion = upper(trim(coalesce(p_codigo, '')));
  if not found then
    raise exception 'No existe ningún equipo con el código "%".', upper(trim(coalesce(p_codigo, '')));
  end if;
  return public._agregar_a_equipo(v_equipo, v_uid, false);
end;
$$;

-- Unirse desde la bolsa a un equipo que marcó "buscamos integrantes" (sin código).
create or replace function public.unirse_equipo_abierto(p_equipo uuid)
returns uuid
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_uid uuid := public._participante_actual();
begin
  if not exists (select 1 from public.equipos where id = p_equipo and buscando_integrantes) then
    raise exception 'Este equipo no está buscando integrantes; pide el código a su capitán.';
  end if;
  return public._agregar_a_equipo(p_equipo, v_uid, false);
end;
$$;

-- Datos del equipo propio en una actividad, incluido el código para compartirlo.
-- Devuelve null si la persona no está en un equipo.
create or replace function public.mi_equipo(p_actividad uuid)
returns json
language sql stable security definer set search_path = public
as $$
  select json_build_object(
           'id', e.id,
           'nombre', e.nombre,
           'codigo_invitacion', e.codigo_invitacion,
           'capitan_id', e.capitan_id,
           'es_capitan', e.capitan_id = auth.uid(),
           'declara_cumple_mixto', e.declara_cumple_mixto,
           'buscando_integrantes', e.buscando_integrantes)
    from public.inscripciones i
    join public.equipos e on e.id = i.equipo_id
   where i.actividad_id = p_actividad and i.participante_id = auth.uid();
$$;

-- El capitán actualiza la declaración de equipo mixto y si busca integrantes.
create or replace function public.actualizar_mi_equipo(
  p_equipo uuid, p_declara_cumple_mixto boolean, p_buscando_integrantes boolean
)
returns void
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_uid uuid := public._participante_actual();
begin
  update public.equipos
     set declara_cumple_mixto = coalesce(p_declara_cumple_mixto, declara_cumple_mixto),
         buscando_integrantes = coalesce(p_buscando_integrantes, buscando_integrantes)
   where id = p_equipo and capitan_id = v_uid;
  if not found then
    raise exception 'Solo el capitán puede cambiar los datos del equipo.';
  end if;
end;
$$;

-- Voto en una encuesta. Reglas:
--   * La encuesta debe estar abierta y no vencida.
--   * Una sola vez por persona y encuesta. Como el correo es único por
--     participante, "una vez por participante" = "una vez por correo".
--   * Como máximo max_votos_por_categoria opciones en cada categoría.
create or replace function public.votar(p_encuesta uuid, p_opciones uuid[])
returns integer
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_uid        uuid := public._participante_actual();
  v_enc        public.encuestas%rowtype;
  v_elegidas   integer;
  v_validas    integer;
  v_categoria  text;
begin
  -- Candado por (encuesta, persona): si alguien pulsa "Votar" dos veces muy
  -- rápido, la segunda petición espera y luego encuentra el primer voto.
  perform pg_advisory_xact_lock(hashtextextended(p_encuesta::text || v_uid::text, 0));

  select * into v_enc from public.encuestas where id = p_encuesta;
  if not found then
    raise exception 'La encuesta no existe.';
  end if;
  if not v_enc.abierta or (v_enc.cierra_en is not null and v_enc.cierra_en <= now()) then
    raise exception 'La encuesta está cerrada; solo puedes ver los resultados.';
  end if;
  if exists (select 1 from public.votos where encuesta_id = p_encuesta and participante_id = v_uid) then
    raise exception 'Ya votaste en esta encuesta. Solo se permite un voto por persona.';
  end if;
  if p_opciones is null or cardinality(p_opciones) = 0 then
    raise exception 'Elige al menos una opción.';
  end if;

  select count(distinct o) into v_elegidas from unnest(p_opciones) as o;
  select count(*) into v_validas from public.opciones_encuesta
   where encuesta_id = p_encuesta and id = any (p_opciones);
  if v_validas <> v_elegidas then
    raise exception 'Alguna de las opciones elegidas no pertenece a esta encuesta.';
  end if;

  select categoria into v_categoria
    from public.opciones_encuesta
   where encuesta_id = p_encuesta and id = any (p_opciones)
   group by categoria
  having count(*) > v_enc.max_votos_por_categoria
   limit 1;
  if found then
    raise exception 'Puedes elegir como máximo % opción(es) por categoría y en "%" elegiste más.',
      v_enc.max_votos_por_categoria, v_categoria;
  end if;

  insert into public.votos (encuesta_id, opcion_id, participante_id)
  select p_encuesta, o, v_uid from (select distinct unnest(p_opciones) as o) s;
  return v_elegidas;
end;
$$;

-- ---------------------------------------------------------------------------
-- Funciones para organizadores
-- ---------------------------------------------------------------------------

-- Mueve a una persona (normalmente desde la bolsa) a un equipo con espacio.
create or replace function public.asignar_a_equipo(p_inscripcion uuid, p_equipo uuid)
returns uuid
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_ins public.inscripciones%rowtype;
begin
  if not public.es_organizador() then
    raise exception 'Solo los organizadores pueden asignar personas a equipos.';
  end if;
  select * into v_ins from public.inscripciones where id = p_inscripcion;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if not exists (select 1 from public.equipos where id = p_equipo and actividad_id = v_ins.actividad_id) then
    raise exception 'El equipo pertenece a otra actividad.';
  end if;
  return public._agregar_a_equipo(p_equipo, v_ins.participante_id, true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Permisos de ejecución
-- Supabase da EXECUTE a anon y authenticated por defecto; lo ajustamos.
-- ---------------------------------------------------------------------------
revoke execute on function public._participante_actual() from public, anon, authenticated;
revoke execute on function public._generar_codigo() from public, anon, authenticated;
revoke execute on function public._agregar_a_equipo(uuid, uuid, boolean) from public, anon, authenticated;

revoke execute on function public.inscribirse(uuid, text) from public, anon;
revoke execute on function public.crear_equipo(uuid, text, boolean) from public, anon;
revoke execute on function public.unirse_equipo(text) from public, anon;
revoke execute on function public.unirse_equipo_abierto(uuid) from public, anon;
revoke execute on function public.mi_equipo(uuid) from public, anon;
revoke execute on function public.actualizar_mi_equipo(uuid, boolean, boolean) from public, anon;
revoke execute on function public.votar(uuid, uuid[]) from public, anon;
revoke execute on function public.asignar_a_equipo(uuid, uuid) from public, anon;

grant execute on function public.inscribirse(uuid, text) to authenticated;
grant execute on function public.crear_equipo(uuid, text, boolean) to authenticated;
grant execute on function public.unirse_equipo(text) to authenticated;
grant execute on function public.unirse_equipo_abierto(uuid) to authenticated;
grant execute on function public.mi_equipo(uuid) to authenticated;
grant execute on function public.actualizar_mi_equipo(uuid, boolean, boolean) to authenticated;
grant execute on function public.votar(uuid, uuid[]) to authenticated;
grant execute on function public.asignar_a_equipo(uuid, uuid) to authenticated;
-- es_organizador se usa dentro de políticas: quien consulta necesita poder ejecutarla.
grant execute on function public.es_organizador() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS en todas las tablas
-- Nota: los participantes con sesión anónima tienen el rol "authenticated";
-- el rol "anon" es quien abre la app sin sesión (visitante).
-- ---------------------------------------------------------------------------
alter table public.temporadas         enable row level security;
alter table public.participantes      enable row level security;
alter table public.organizadores      enable row level security;
alter table public.actividades        enable row level security;
alter table public.equipos            enable row level security;
alter table public.inscripciones      enable row level security;
alter table public.resultados         enable row level security;
alter table public.encuestas          enable row level security;
alter table public.opciones_encuesta  enable row level security;
alter table public.votos              enable row level security;
alter table public.resumenes          enable row level security;

-- Temporadas: lectura pública, escritura de organizadores.
create policy temporadas_lectura on public.temporadas
  for select to anon, authenticated using (true);
create policy temporadas_org on public.temporadas
  for all to authenticated using (public.es_organizador()) with check (public.es_organizador());

-- Participantes: cada quien ve y edita SOLO su perfil; el organizador ve todos
-- (para exportar CSV). Nadie más puede leer correos: lo público va por vistas.
create policy participantes_propio_lectura on public.participantes
  for select to authenticated using (id = auth.uid() or public.es_organizador());
create policy participantes_propio_alta on public.participantes
  for insert to authenticated with check (id = auth.uid() and consentimiento);
create policy participantes_propio_edicion on public.participantes
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and consentimiento);
create policy participantes_baja on public.participantes
  for delete to authenticated using (id = auth.uid() or public.es_organizador());

-- Organizadores: cada organizador puede comprobar su propia fila. Sin escritura desde la app.
create policy organizadores_propio on public.organizadores
  for select to authenticated using (user_id = auth.uid());

-- Actividades: públicas salvo los borradores.
create policy actividades_lectura on public.actividades
  for select to anon, authenticated using (estado <> 'borrador' or public.es_organizador());
create policy actividades_org on public.actividades
  for all to authenticated using (public.es_organizador()) with check (public.es_organizador());

-- Equipos: la tabla (con códigos de invitación) solo la leen organizadores.
-- El público usa vista_equipos_publica; los miembros, la función mi_equipo().
create policy equipos_org on public.equipos
  for all to authenticated using (public.es_organizador()) with check (public.es_organizador());

-- Inscripciones: cada quien ve las suyas; el organizador gestiona todas
-- (asistencia, cambios). Las altas de participantes van por las funciones.
create policy inscripciones_propias on public.inscripciones
  for select to authenticated using (participante_id = auth.uid() or public.es_organizador());
create policy inscripciones_org on public.inscripciones
  for all to authenticated using (public.es_organizador()) with check (public.es_organizador());

-- Resultados: lectura pública, escritura de organizadores.
create policy resultados_lectura on public.resultados
  for select to anon, authenticated using (true);
create policy resultados_org on public.resultados
  for all to authenticated using (public.es_organizador()) with check (public.es_organizador());

-- Encuestas y opciones: lectura pública, escritura de organizadores.
create policy encuestas_lectura on public.encuestas
  for select to anon, authenticated using (true);
create policy encuestas_org on public.encuestas
  for all to authenticated using (public.es_organizador()) with check (public.es_organizador());
create policy opciones_lectura on public.opciones_encuesta
  for select to anon, authenticated using (true);
create policy opciones_org on public.opciones_encuesta
  for all to authenticated using (public.es_organizador()) with check (public.es_organizador());

-- Votos: cada quien ve los suyos (para mostrar "ya votaste y elegiste..."),
-- el organizador ve todos. Las altas solo van por votar().
create policy votos_propios on public.votos
  for select to authenticated using (participante_id = auth.uid() or public.es_organizador());
create policy votos_org on public.votos
  for delete to authenticated using (public.es_organizador());

-- Resúmenes: lectura pública, escritura de organizadores.
create policy resumenes_lectura on public.resumenes
  for select to anon, authenticated using (true);
create policy resumenes_org on public.resumenes
  for all to authenticated using (public.es_organizador()) with check (public.es_organizador());

-- ---------------------------------------------------------------------------
-- Vistas públicas
-- Las vistas corren con permisos de su dueño (no de quien consulta), así que
-- pueden leer filas que la RLS oculta. Por eso solo exponen columnas seguras:
-- alias sí; correo, nombre completo y código PUCP nunca.
-- ---------------------------------------------------------------------------

create or replace view public.vista_participantes_publica as
select id, alias from public.participantes;

-- Quién está inscrito en qué (solo alias): sirve para la bolsa y para listar miembros.
create or replace view public.vista_inscripciones_publica as
select i.actividad_id, i.participante_id, p.alias, i.equipo_id, i.en_bolsa
  from public.inscripciones i
  join public.participantes p on p.id = i.participante_id
  join public.actividades a on a.id = i.actividad_id
 where a.estado <> 'borrador';

-- Equipos sin el código de invitación, con miembros y lugares libres.
create or replace view public.vista_equipos_publica as
select e.id, e.actividad_id, e.nombre, e.capitan_id, pc.alias as capitan_alias,
       e.declara_cumple_mixto, e.buscando_integrantes, a.tamano_equipo,
       coalesce(m.miembros, 0) as miembros,
       a.tamano_equipo - coalesce(m.miembros, 0) as lugares_libres
  from public.equipos e
  join public.actividades a on a.id = e.actividad_id
  left join public.participantes pc on pc.id = e.capitan_id
  left join (select equipo_id, count(*)::int as miembros
               from public.inscripciones where equipo_id is not null
              group by equipo_id) m on m.equipo_id = e.id
 where a.estado <> 'borrador';

-- Cupo ocupado por actividad.
create or replace view public.vista_cupos as
select a.id as actividad_id, a.cupo,
       count(i.id)::int as inscritos,
       (a.cupo - count(i.id))::int as lugares_libres,
       (count(i.id) filter (where i.en_bolsa))::int as en_bolsa
  from public.actividades a
  left join public.inscripciones i on i.actividad_id = a.id
 group by a.id, a.cupo;

-- Ranking de temporada (regla P0-3; la misma regla está en src/lib/puntos.ts).
--   * Solo cuentan actividades en estado 'finalizada'.
--   * Solo suma quien tiene asistio = true; sin asistencia, 0 puntos.
--   * Puntos = puntos_participacion + puntos de su mejor posición, sea la
--     posición propia (actividad individual) o la de su equipo (cada miembro
--     recibe los puntos completos del equipo). 1.° = puntos_1, 2.° = puntos_2,
--     3.° = puntos_3. Los empates reciben los puntos completos de esa posición.
create or replace view public.vista_ranking_temporada as
with puntos_por_actividad as (
  select a.temporada_id, i.participante_id,
         a.puntos_participacion
         + coalesce((
             select case r.posicion when 1 then a.puntos_1
                                    when 2 then a.puntos_2
                                    when 3 then a.puntos_3 end
               from public.resultados r
              where r.actividad_id = a.id
                and (r.participante_id = i.participante_id
                     or (i.equipo_id is not null and r.equipo_id = i.equipo_id))
              order by r.posicion
              limit 1), 0) as puntos
    from public.inscripciones i
    join public.actividades a on a.id = i.actividad_id
   where a.estado = 'finalizada' and i.asistio
)
select pa.temporada_id, pa.participante_id, p.alias,
       count(*)::int as actividades_asistidas,
       sum(pa.puntos)::int as puntos,
       rank() over (partition by pa.temporada_id order by sum(pa.puntos) desc)::int as posicion
  from puntos_por_actividad pa
  join public.participantes p on p.id = pa.participante_id
 group by pa.temporada_id, pa.participante_id, p.alias;

-- Resultados de encuesta: votos por opción, total de votantes y porcentaje.
-- El porcentaje es sobre el total de VOTANTES (cada persona puede marcar varias
-- opciones, por eso los porcentajes de una categoría pueden sumar más de 100).
create or replace view public.vista_resultados_encuesta as
select o.encuesta_id, o.id as opcion_id, o.categoria, o.texto, o.orden,
       count(v.id)::int as votos,
       t.total_votantes,
       case when t.total_votantes = 0 then 0
            else round(100.0 * count(v.id) / t.total_votantes, 1) end as porcentaje
  from public.opciones_encuesta o
  left join public.votos v on v.opcion_id = o.id
  cross join lateral (
    select count(distinct v2.participante_id)::int as total_votantes
      from public.votos v2 where v2.encuesta_id = o.encuesta_id
  ) t
 group by o.encuesta_id, o.id, o.categoria, o.texto, o.orden, t.total_votantes;

-- Las vistas simples de una sola tabla son "actualizables" en PostgreSQL: sin
-- este revoke, alguien podría hacer UPDATE a través de la vista saltándose la
-- RLS. Dejamos solo SELECT.
revoke all on public.vista_participantes_publica, public.vista_inscripciones_publica,
              public.vista_equipos_publica, public.vista_cupos,
              public.vista_ranking_temporada, public.vista_resultados_encuesta
  from public, anon, authenticated;
grant select on public.vista_participantes_publica, public.vista_inscripciones_publica,
                public.vista_equipos_publica, public.vista_cupos,
                public.vista_ranking_temporada, public.vista_resultados_encuesta
  to anon, authenticated;
