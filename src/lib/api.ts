// Capa de datos: TODA llamada a Supabase pasa por aquí (regla de CLAUDE.md).
// Los componentes llaman a estas funciones y reciben datos tipados o un Error
// con un mensaje en español listo para mostrar.
//
// Recordatorio de seguridad: lo que este archivo puede leer lo decide la RLS
// de la base (0002_rls_y_funciones.sql), no el frontend. Las vistas "vista_*"
// son las únicas fuentes públicas de datos de personas y solo traen alias.

import type { AuthError, PostgrestError, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type {
  Actividad,
  ActividadConCupo,
  ActividadEditable,
  CategoriaOpcion,
  Encuesta,
  EncuestaConOpciones,
  Equipo,
  EquipoPublico,
  FilaRanking,
  Inscripcion,
  InscripcionOrg,
  InscripcionPublica,
  MiEquipo,
  ModoInscripcion,
  NuevoParticipante,
  OpcionEncuesta,
  Participante,
  Resultado,
  ResultadoOpcion,
  Resumen,
  Temporada,
} from '../types'

// ---------------------------------------------------------------------------
// Errores
// ---------------------------------------------------------------------------

type ErrorSupabase = Pick<PostgrestError, 'message'> & Partial<Pick<PostgrestError, 'code' | 'details'>>

/** Convierte un error de Supabase en un Error con mensaje claro en español. */
export function traducirError(error: ErrorSupabase | AuthError): Error {
  const codigo = 'code' in error ? error.code : undefined
  const texto = `${error.message} ${'details' in error ? error.details ?? '' : ''}`

  // Violación de UNIQUE: los nombres de índice vienen de 0001_esquema.sql.
  if (codigo === '23505') {
    if (texto.includes('participantes_correo_unico')) {
      return new Error('Ya existe una cuenta con este correo. Ingresa con tu contraseña.')
    }
    if (texto.includes('participantes_alias_unico')) return new Error('Ese alias ya está en uso. Elige otro.')
    if (texto.includes('participantes_pkey')) return new Error('Este dispositivo ya tiene un perfil registrado.')
    if (texto.includes('resultados')) return new Error('Ese equipo o persona ya tiene una posición registrada.')
    return new Error('Ese dato ya existe.')
  }
  // P0001 = raise exception de nuestras funciones: el mensaje ya está en español.
  if (codigo === 'P0001') return new Error(error.message)
  if (codigo === '42501' || /row-level security|permission denied/i.test(texto)) {
    return new Error('No tienes permiso para hacer esto.')
  }
  if (codigo === '23514') return new Error('Algún dato no tiene el formato esperado. Revisa el formulario.')
  // Códigos de Supabase Auth (cuentas con correo y contraseña).
  if (codigo === 'user_already_exists' || codigo === 'email_exists') {
    return new Error('Ya existe una cuenta con este correo. Ingresa con tu contraseña.')
  }
  if (codigo === 'weak_password') return new Error('La contraseña es muy débil: usa al menos 8 caracteres.')
  if (codigo === 'same_password') return new Error('La nueva contraseña debe ser distinta de la anterior.')
  if (codigo === 'email_address_invalid') return new Error('Ese correo no es válido. Usa un correo real, por ejemplo el de la PUCP.')
  if (codigo === 'over_email_send_rate_limit' || codigo === 'over_request_rate_limit') {
    return new Error('Se alcanzó el límite de intentos por ahora. Espera unos minutos e inténtalo otra vez.')
  }
  if (codigo === 'invalid_credentials' || /invalid login credentials/i.test(texto)) return new Error('Correo o contraseña incorrectos.')
  if (/anonymous sign-ins are disabled/i.test(texto)) {
    return new Error('El servidor no permite esta sesión. Avísale a un organizador.')
  }
  if (/failed to fetch|network/i.test(texto)) return new Error('No hay conexión con el servidor. Revisa tu internet e inténtalo otra vez.')
  return new Error('Ocurrió un error inesperado. Inténtalo otra vez.')
}

/** Desempaqueta { data, error } de supabase-js: devuelve data o lanza el error traducido. */
function resultado<T>(respuesta: { data: T | null; error: ErrorSupabase | null }): T {
  if (respuesta.error) throw traducirError(respuesta.error)
  return respuesta.data as T
}

// ---------------------------------------------------------------------------
// Sesión y perfil
// ---------------------------------------------------------------------------

export async function obtenerSesion(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Avisa cada vez que cambia la sesión (registro, login, logout). Devuelve la función para dejar de escuchar. */
export function escucharSesion(callback: (sesion: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => callback(sesion))
  return () => data.subscription.unsubscribe()
}

/**
 * Tipo de cuenta de la sesión actual, para saber qué pedir en el registro:
 *   'ninguna'  → no hay sesión: se crea una cuenta con correo y contraseña
 *   'anonima'  → sesión antigua sin contraseña (registros de antes de las cuentas)
 *   'cuenta'   → ya hay una cuenta con correo (por ejemplo, un organizador)
 */
export function tipoDeCuenta(sesion: Session | null): 'ninguna' | 'anonima' | 'cuenta' {
  if (!sesion) return 'ninguna'
  return sesion.user.is_anonymous ? 'anonima' : 'cuenta'
}

/**
 * Registro de participante con cuenta (correo y contraseña).
 * El perfil se guarda con id = auth.uid() del usuario de Supabase, así que la
 * misma cuenta funciona en cualquier celular o computadora: basta con ingresar.
 *
 *   - Sin sesión: se crea la cuenta (signUp). Con "Confirm email" apagado en
 *     Supabase, la sesión queda abierta al instante, sin enviar correos.
 *   - Sesión anónima antigua: se convierte en cuenta (updateUser con correo y
 *     contraseña). Supabase conserva el mismo id, por eso no se pierde nada.
 *   - Cuenta existente sin perfil (p. ej. un organizador que también quiere
 *     participar): solo se crea el perfil, con el correo de esa cuenta.
 */
export async function registrarParticipante(datos: NuevoParticipante & { contrasena?: string }): Promise<Participante> {
  if (!datos.consentimiento) throw new Error('Debes aceptar el tratamiento de tus datos para registrarte.')
  const correo = datos.correo.trim().toLowerCase()

  let sesion = await obtenerSesion()
  const tipo = tipoDeCuenta(sesion)
  if (tipo !== 'cuenta' && (datos.contrasena ?? '').length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.')
  }

  if (tipo === 'ninguna') {
    const { data, error } = await supabase.auth.signUp({ email: correo, password: datos.contrasena! })
    if (error) throw traducirError(error)
    sesion = data.session
    // Si Supabase tuviera "Confirm email" activado, no habría sesión hasta confirmar.
    if (!sesion) throw new Error('Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego ingresa.')
  } else if (tipo === 'anonima') {
    const { error } = await supabase.auth.updateUser({ email: correo, password: datos.contrasena! })
    if (error) throw traducirError(error)
    sesion = await obtenerSesion()
  }
  if (!sesion) throw new Error('No se pudo iniciar la sesión. Inténtalo otra vez.')

  return resultado(
    await supabase
      .from('participantes')
      .insert({
        id: sesion.user.id,
        nombre: datos.nombre.trim(),
        alias: datos.alias.trim(),
        // Con una cuenta ya existente, el perfil usa el correo de esa cuenta.
        correo: tipo === 'cuenta' && sesion.user.email ? sesion.user.email.toLowerCase() : correo,
        especialidad: datos.especialidad,
        codigo_pucp: datos.codigo_pucp?.trim() || null,
        consentimiento: true,
        consentimiento_en: new Date().toISOString(),
      })
      .select()
      .single(),
  )
}

/** Perfil de la sesión actual, o null si no hay sesión o aún no se registró. */
export async function obtenerMiPerfil(): Promise<Participante | null> {
  const sesion = await obtenerSesion()
  if (!sesion) return null
  return resultado(await supabase.from('participantes').select('*').eq('id', sesion.user.id).maybeSingle())
}

/**
 * Borra los datos propios (derecho de supresión, Ley 29733) y cierra la sesión.
 * Usa la función borrar_mi_cuenta (0004_cuentas.sql), que elimina el perfil
 * (con sus votos e inscripciones) y también la cuenta de acceso. Si esa
 * migración aún no se ejecutó, al menos borra el perfil.
 */
export async function eliminarMiPerfil(): Promise<void> {
  const sesion = await obtenerSesion()
  if (!sesion) return
  const { error } = await supabase.rpc('borrar_mi_cuenta')
  if (error) {
    // PGRST202: la función no existe todavía en la base.
    if (error.code !== 'PGRST202') throw traducirError(error)
    resultado(await supabase.from('participantes').delete().eq('id', sesion.user.id))
  }
  await supabase.auth.signOut()
}

/** Ingresar con correo y contraseña desde cualquier dispositivo. */
export async function iniciarSesion(correo: string, contrasena: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: correo.trim().toLowerCase(), password: contrasena })
  if (error) throw traducirError(error)
}

/**
 * Para registros antiguos sin contraseña (sesión anónima): les pone correo y
 * contraseña a su cuenta actual. El id no cambia, así que el perfil, los votos
 * y las inscripciones siguen siendo suyos y ya puede ingresar desde otro lado.
 */
export async function protegerCuenta(correo: string, contrasena: string): Promise<void> {
  if (contrasena.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
  const { error } = await supabase.auth.updateUser({ email: correo.trim().toLowerCase(), password: contrasena })
  if (error) throw traducirError(error)
}

/** Envía un correo con un enlace para crear una contraseña nueva (pantalla /restablecer). */
export async function enviarRecuperacion(correo: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(correo.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/restablecer`,
  })
  if (error) throw traducirError(error)
}

export async function cambiarContrasena(nueva: string): Promise<void> {
  if (nueva.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) throw traducirError(error)
}

/** Avisa cuando el usuario llega desde el enlace de recuperación del correo. */
export function escucharRecuperacion(callback: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((evento) => {
    if (evento === 'PASSWORD_RECOVERY') callback()
  })
  return () => data.subscription.unsubscribe()
}

// ---------------------------------------------------------------------------
// Organizadores: autenticación
// ---------------------------------------------------------------------------

/**
 * Inicia sesión como organizador con correo y contraseña. Reemplaza la sesión
 * de participante que hubiera en este navegador; quien tenga cuenta puede volver
 * a ingresar como participante después. Una misma cuenta puede ser organizadora
 * y tener perfil de participante a la vez.
 */
export async function iniciarSesionOrganizador(correo: string, contrasena: string): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: contrasena })
  if (error) throw traducirError(error)
  return esOrganizador()
}

export async function esOrganizador(): Promise<boolean> {
  const sesion = await obtenerSesion()
  if (!sesion || sesion.user.is_anonymous) return false
  const fila = resultado(
    await supabase.from('organizadores').select('user_id').eq('user_id', sesion.user.id).maybeSingle(),
  )
  return fila !== null
}

export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut()
}

// ---------------------------------------------------------------------------
// Temporadas
// ---------------------------------------------------------------------------

export async function listarTemporadas(): Promise<Temporada[]> {
  return resultado(await supabase.from('temporadas').select('*').order('fecha_inicio', { ascending: false }))
}

export async function obtenerTemporadaActiva(): Promise<Temporada | null> {
  return resultado(await supabase.from('temporadas').select('*').eq('activa', true).maybeSingle())
}

export async function guardarTemporada(t: Omit<Temporada, 'id'> & { id?: string }): Promise<Temporada> {
  return resultado(await supabase.from('temporadas').upsert(t).select().single())
}

export async function eliminarTemporada(id: string): Promise<void> {
  resultado(await supabase.from('temporadas').delete().eq('id', id))
}

// ---------------------------------------------------------------------------
// Actividades
// ---------------------------------------------------------------------------

type FilaCupo = { actividad_id: string; inscritos: number; lugares_libres: number; en_bolsa: number }

function unirCupos(actividades: Actividad[], cupos: FilaCupo[]): ActividadConCupo[] {
  const porId = new Map(cupos.map((c) => [c.actividad_id, c]))
  return actividades.map((a) => {
    const c = porId.get(a.id)
    return { ...a, inscritos: c?.inscritos ?? 0, lugares_libres: c?.lugares_libres ?? a.cupo, en_bolsa: c?.en_bolsa ?? 0 }
  })
}

/** Actividades de una temporada ordenadas por fecha (la RLS oculta borradores al público). */
export async function listarActividades(temporadaId: string): Promise<ActividadConCupo[]> {
  const actividades = resultado<Actividad[]>(
    await supabase.from('actividades').select('*').eq('temporada_id', temporadaId).order('fecha_hora'),
  )
  if (actividades.length === 0) return []
  const cupos = resultado<FilaCupo[]>(
    await supabase.from('vista_cupos').select('*').in('actividad_id', actividades.map((a) => a.id)),
  )
  return unirCupos(actividades, cupos)
}

export async function obtenerActividad(id: string): Promise<ActividadConCupo | null> {
  const actividad = resultado<Actividad | null>(await supabase.from('actividades').select('*').eq('id', id).maybeSingle())
  if (!actividad) return null
  const cupos = resultado<FilaCupo[]>(await supabase.from('vista_cupos').select('*').eq('actividad_id', id))
  return unirCupos([actividad], cupos)[0]
}

export async function guardarActividad(a: ActividadEditable & { id?: string }): Promise<Actividad> {
  return resultado(await supabase.from('actividades').upsert(a).select().single())
}

export async function cambiarEstadoActividad(id: string, estado: Actividad['estado']): Promise<void> {
  resultado(await supabase.from('actividades').update({ estado }).eq('id', id))
}

export async function eliminarActividad(id: string): Promise<void> {
  resultado(await supabase.from('actividades').delete().eq('id', id))
}

// ---------------------------------------------------------------------------
// Equipos, bolsa e inscripción (participantes)
// ---------------------------------------------------------------------------

/** Equipos de una actividad sin códigos de invitación. */
export async function listarEquipos(actividadId: string): Promise<EquipoPublico[]> {
  return resultado(
    await supabase.from('vista_equipos_publica').select('*').eq('actividad_id', actividadId).order('nombre'),
  )
}

/** Inscritos de una actividad (solo alias): miembros de equipos y personas en la bolsa. */
export async function listarInscritosPublicos(actividadId: string): Promise<InscripcionPublica[]> {
  return resultado(
    await supabase.from('vista_inscripciones_publica').select('*').eq('actividad_id', actividadId).order('alias'),
  )
}

/** Bolsa de equipos: personas que buscan equipo y equipos con lugares libres que buscan integrantes. */
export async function obtenerBolsa(actividadId: string): Promise<{
  personas: InscripcionPublica[]
  equipos: EquipoPublico[]
}> {
  const [inscritos, equipos] = await Promise.all([listarInscritosPublicos(actividadId), listarEquipos(actividadId)])
  return {
    personas: inscritos.filter((i) => i.en_bolsa),
    equipos: equipos.filter((e) => e.buscando_integrantes && e.lugares_libres > 0),
  }
}

/** Inscripción propia en una actividad, o null. */
export async function obtenerMiInscripcion(actividadId: string): Promise<Inscripcion | null> {
  const sesion = await obtenerSesion()
  if (!sesion) return null
  return resultado(
    await supabase
      .from('inscripciones')
      .select('*')
      .eq('actividad_id', actividadId)
      .eq('participante_id', sesion.user.id)
      .maybeSingle(),
  )
}

/** Equipo propio en una actividad (con código para compartir), o null. */
export async function obtenerMiEquipo(actividadId: string): Promise<MiEquipo | null> {
  const sesion = await obtenerSesion()
  if (!sesion) return null
  return resultado(await supabase.rpc('mi_equipo', { p_actividad: actividadId }))
}

/** 'individual' en actividades individuales; 'bolsa' = "Busco equipo". */
export async function inscribirse(actividadId: string, modo: ModoInscripcion): Promise<string> {
  return resultado(await supabase.rpc('inscribirse', { p_actividad: actividadId, p_modo: modo }))
}

export async function crearEquipo(
  actividadId: string,
  nombre: string,
  declaraCumpleMixto = false,
): Promise<{ equipo_id: string; codigo_invitacion: string }> {
  return resultado(
    await supabase.rpc('crear_equipo', {
      p_actividad: actividadId,
      p_nombre: nombre,
      p_declara_cumple_mixto: declaraCumpleMixto,
    }),
  )
}

export async function unirseConCodigo(codigo: string): Promise<string> {
  return resultado(await supabase.rpc('unirse_equipo', { p_codigo: codigo }))
}

/** Desde la bolsa: unirse a un equipo que marcó "buscamos integrantes". */
export async function unirseAEquipoAbierto(equipoId: string): Promise<string> {
  return resultado(await supabase.rpc('unirse_equipo_abierto', { p_equipo: equipoId }))
}

/** Solo capitán: declaración de equipo mixto y "buscamos integrantes". */
export async function actualizarMiEquipo(
  equipoId: string,
  cambios: { declara_cumple_mixto?: boolean; buscando_integrantes?: boolean },
): Promise<void> {
  resultado(
    await supabase.rpc('actualizar_mi_equipo', {
      p_equipo: equipoId,
      p_declara_cumple_mixto: cambios.declara_cumple_mixto ?? null,
      p_buscando_integrantes: cambios.buscando_integrantes ?? null,
    }),
  )
}

// ---------------------------------------------------------------------------
// Gestión de actividad (organizadores)
// ---------------------------------------------------------------------------

/** Inscritos con datos de contacto. Solo funciona para organizadores (RLS). */
export async function listarInscripcionesOrg(actividadId: string): Promise<InscripcionOrg[]> {
  return resultado(
    await supabase
      .from('inscripciones')
      .select('*, participante:participantes(nombre, alias, correo, codigo_pucp, especialidad)')
      .eq('actividad_id', actividadId)
      .order('creado_en'),
  )
}

/** Equipos completos (con código). Solo organizadores. */
export async function listarEquiposOrg(actividadId: string): Promise<Equipo[]> {
  return resultado(await supabase.from('equipos').select('*').eq('actividad_id', actividadId).order('nombre'))
}

/** El organizador crea un equipo vacío (por ejemplo, para armarlo con gente de la bolsa). */
export async function crearEquipoOrg(actividadId: string, nombre: string): Promise<Equipo> {
  // El código lo genera el frontend aquí porque el organizador escribe directo en la tabla
  // (la RLS lo permite). Se reintenta si chocara con otro código existente.
  for (let intento = 0; intento < 5; intento++) {
    const codigo = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('')
    const { data, error } = await supabase
      .from('equipos')
      .insert({ actividad_id: actividadId, nombre: nombre.trim(), codigo_invitacion: codigo })
      .select()
      .single()
    if (!error) return data as Equipo
    if (error.code === '23505' && error.message.includes('codigo_invitacion')) continue
    if (error.code === '23505') throw new Error('Ya existe un equipo con ese nombre en esta actividad.')
    throw traducirError(error)
  }
  throw new Error('No se pudo generar un código de equipo. Inténtalo otra vez.')
}

/** Mueve una inscripción (normalmente de la bolsa) a un equipo con espacio. */
export async function asignarAEquipo(inscripcionId: string, equipoId: string): Promise<void> {
  resultado(await supabase.rpc('asignar_a_equipo', { p_inscripcion: inscripcionId, p_equipo: equipoId }))
}

export async function marcarAsistencia(inscripcionId: string, asistio: boolean): Promise<void> {
  resultado(await supabase.from('inscripciones').update({ asistio }).eq('id', inscripcionId))
}

/** Marca la asistencia de varias inscripciones a la vez (por ejemplo, todo un equipo). */
export async function marcarAsistenciaVarias(inscripcionIds: string[], asistio: boolean): Promise<void> {
  if (inscripcionIds.length === 0) return
  resultado(await supabase.from('inscripciones').update({ asistio }).in('id', inscripcionIds))
}

/** Saca a una persona de su equipo y la devuelve a la bolsa. */
export async function devolverABolsa(inscripcionId: string): Promise<void> {
  resultado(await supabase.from('inscripciones').update({ equipo_id: null, en_bolsa: true }).eq('id', inscripcionId))
}

/** Borra una inscripción (libera su lugar en el cupo). */
export async function eliminarInscripcion(inscripcionId: string): Promise<void> {
  resultado(await supabase.from('inscripciones').delete().eq('id', inscripcionId))
}

/** Borra un equipo; sus integrantes quedan inscritos sin equipo y vuelven a la bolsa. */
export async function eliminarEquipo(equipoId: string): Promise<void> {
  // Primero se pasan a la bolsa para que nadie quede inscrito "sin equipo ni bolsa".
  resultado(await supabase.from('inscripciones').update({ equipo_id: null, en_bolsa: true }).eq('equipo_id', equipoId))
  resultado(await supabase.from('equipos').delete().eq('id', equipoId))
}

export async function listarResultados(actividadId: string): Promise<Resultado[]> {
  return resultado(await supabase.from('resultados').select('*').eq('actividad_id', actividadId).order('posicion'))
}

/** Registra la posición (1, 2 o 3) de un equipo o de una persona. Reemplaza la anterior si existía. */
export async function registrarPosicion(
  actividadId: string,
  ganador: { equipo_id: string } | { participante_id: string },
  posicion: 1 | 2 | 3,
): Promise<void> {
  const columna = 'equipo_id' in ganador ? 'equipo_id' : 'participante_id'
  const valor = 'equipo_id' in ganador ? ganador.equipo_id : ganador.participante_id
  resultado(await supabase.from('resultados').delete().eq('actividad_id', actividadId).eq(columna, valor))
  resultado(await supabase.from('resultados').insert({ actividad_id: actividadId, [columna]: valor, posicion }))
}

export async function eliminarResultado(resultadoId: string): Promise<void> {
  resultado(await supabase.from('resultados').delete().eq('id', resultadoId))
}

// ---------------------------------------------------------------------------
// Encuestas
// ---------------------------------------------------------------------------

/** Una encuesta está activa si está abierta y no ha pasado su fecha de cierre. */
export function encuestaEstaAbierta(e: Pick<Encuesta, 'abierta' | 'cierra_en'>, ahora = new Date()): boolean {
  return e.abierta && (e.cierra_en === null || new Date(e.cierra_en) > ahora)
}

export async function listarEncuestas(temporadaId?: string): Promise<Encuesta[]> {
  let consulta = supabase.from('encuestas').select('*').order('creado_en', { ascending: false })
  if (temporadaId) consulta = consulta.eq('temporada_id', temporadaId)
  return resultado(await consulta)
}

export async function obtenerEncuesta(id: string): Promise<EncuestaConOpciones | null> {
  return resultado(
    await supabase
      .from('encuestas')
      .select('*, opciones:opciones_encuesta(*)')
      .eq('id', id)
      .order('orden', { referencedTable: 'opciones_encuesta' })
      .maybeSingle(),
  )
}

/** La encuesta que se muestra en la app: la más reciente que siga abierta; si no hay, la más reciente. */
export async function obtenerEncuestaActual(): Promise<EncuestaConOpciones | null> {
  const encuestas = await listarEncuestas()
  const elegida = encuestas.find((e) => encuestaEstaAbierta(e)) ?? encuestas[0]
  return elegida ? obtenerEncuesta(elegida.id) : null
}

export async function obtenerResultadosEncuesta(encuestaId: string): Promise<ResultadoOpcion[]> {
  return resultado(
    await supabase.from('vista_resultados_encuesta').select('*').eq('encuesta_id', encuestaId).order('orden'),
  )
}

/** Opciones que votó la persona de esta sesión (vacío si no votó). */
export async function obtenerMisVotos(encuestaId: string): Promise<string[]> {
  const sesion = await obtenerSesion()
  if (!sesion) return []
  const filas = resultado<{ opcion_id: string }[]>(
    await supabase.from('votos').select('opcion_id').eq('encuesta_id', encuestaId).eq('participante_id', sesion.user.id),
  )
  return filas.map((f) => f.opcion_id)
}

export async function votar(encuestaId: string, opcionIds: string[]): Promise<number> {
  return resultado(await supabase.rpc('votar', { p_encuesta: encuestaId, p_opciones: opcionIds }))
}

export async function guardarEncuesta(
  e: Omit<Encuesta, 'id' | 'creado_en'> & { id?: string },
): Promise<Encuesta> {
  return resultado(await supabase.from('encuestas').upsert(e).select().single())
}

export async function agregarOpcion(encuestaId: string, categoria: CategoriaOpcion, texto: string, orden = 0): Promise<OpcionEncuesta> {
  return resultado(
    await supabase.from('opciones_encuesta').insert({ encuesta_id: encuestaId, categoria, texto: texto.trim(), orden }).select().single(),
  )
}

export async function eliminarOpcion(opcionId: string): Promise<void> {
  resultado(await supabase.from('opciones_encuesta').delete().eq('id', opcionId))
}

export async function eliminarEncuesta(id: string): Promise<void> {
  resultado(await supabase.from('encuestas').delete().eq('id', id))
}

// ---------------------------------------------------------------------------
// Resúmenes de actividad (P1-3)
// ---------------------------------------------------------------------------

export type ResumenConActividad = Resumen & { actividad: Pick<Actividad, 'id' | 'titulo' | 'fecha_hora' | 'tipo'> }

/** Resúmenes publicados, del más reciente al más antiguo. */
export async function listarResumenes(): Promise<ResumenConActividad[]> {
  return resultado(
    await supabase
      .from('resumenes')
      .select('*, actividad:actividades(id, titulo, fecha_hora, tipo)')
      .order('publicado_en', { ascending: false }),
  )
}

export async function obtenerResumen(actividadId: string): Promise<Resumen | null> {
  return resultado(await supabase.from('resumenes').select('*').eq('actividad_id', actividadId).maybeSingle())
}

/**
 * Sube la foto de un resumen al bucket "resumenes" y devuelve su URL pública.
 * Solo organizadores pueden subir (políticas de 0003_storage.sql).
 */
export async function subirImagenResumen(actividadId: string, archivo: File): Promise<string> {
  const extension = archivo.name.split('.').pop()?.toLowerCase() || 'jpg'
  const ruta = `${actividadId}/${Date.now()}.${extension}`
  const { error } = await supabase.storage.from('resumenes').upload(ruta, archivo, {
    contentType: archivo.type,
    upsert: false,
  })
  if (error) {
    if (/mime|type/i.test(error.message)) throw new Error('Solo se aceptan imágenes JPG, PNG o WebP.')
    if (/size|large/i.test(error.message)) throw new Error('La imagen pesa más de 5 MB.')
    throw traducirError(error)
  }
  return supabase.storage.from('resumenes').getPublicUrl(ruta).data.publicUrl
}

/**
 * Publica o actualiza el resumen de una actividad.
 * Regla P1-3: si hay imagen, tiene que venir con imagen_autorizada = true
 * (la base también lo exige con un CHECK).
 */
export async function guardarResumen(r: {
  actividad_id: string
  texto: string
  ganadores: string | null
  imagen_url: string | null
  imagen_autorizada: boolean
}): Promise<Resumen> {
  if (r.imagen_url && !r.imagen_autorizada) {
    throw new Error('Marca "Las personas que aparecen autorizaron su publicación" o quita la imagen.')
  }
  return resultado(
    await supabase
      .from('resumenes')
      .upsert({ ...r, publicado_en: new Date().toISOString() }, { onConflict: 'actividad_id' })
      .select()
      .single(),
  )
}

export async function eliminarResumen(actividadId: string): Promise<void> {
  resultado(await supabase.from('resumenes').delete().eq('actividad_id', actividadId))
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/** Ranking de una temporada (vista SQL; la regla está explicada en src/lib/puntos.ts). */
export async function obtenerRanking(temporadaId: string): Promise<FilaRanking[]> {
  return resultado(
    await supabase
      .from('vista_ranking_temporada')
      .select('*')
      .eq('temporada_id', temporadaId)
      .order('posicion')
      .order('alias'),
  )
}
