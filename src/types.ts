// Tipos del modelo de datos. Reflejan supabase/migrations/0001_esquema.sql
// y las vistas de 0002_rls_y_funciones.sql.

export type TipoActividad = 'videojuego' | 'deporte' | 'social' | 'academica'
export type Modalidad = 'presencial' | 'virtual'
export type EstadoActividad = 'borrador' | 'abierta' | 'cerrada' | 'finalizada'
export type CategoriaOpcion = 'juego' | 'actividad' | 'horario'
export type ModoInscripcion = 'individual' | 'bolsa'

export interface Temporada {
  id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  activa: boolean
}

/** Perfil completo: solo lo ve la propia persona o un organizador. */
export interface Participante {
  id: string
  nombre: string
  alias: string
  correo: string
  codigo_pucp: string | null
  especialidad: string
  consentimiento: boolean
  consentimiento_en: string
  creado_en: string
}

export interface NuevoParticipante {
  nombre: string
  alias: string
  correo: string
  especialidad: string
  codigo_pucp?: string | null
  consentimiento: boolean
}

export interface Actividad {
  id: string
  temporada_id: string
  titulo: string
  tipo: TipoActividad
  juego_o_disciplina: string | null
  descripcion: string
  fecha_hora: string
  lugar: string
  modalidad: Modalidad
  cupo: number
  tamano_equipo: number
  requiere_mixto: boolean
  puntos_participacion: number
  puntos_1: number
  puntos_2: number
  puntos_3: number
  estado: EstadoActividad
  creado_en: string
}

export type ActividadEditable = Omit<Actividad, 'id' | 'creado_en'>

/** Actividad con su ocupación (vista_cupos). */
export interface ActividadConCupo extends Actividad {
  inscritos: number
  lugares_libres: number
  en_bolsa: number
}

/** Equipo tal como lo ve el público: sin código de invitación. */
export interface EquipoPublico {
  id: string
  actividad_id: string
  nombre: string
  capitan_id: string | null
  capitan_alias: string | null
  declara_cumple_mixto: boolean
  buscando_integrantes: boolean
  tamano_equipo: number
  miembros: number
  lugares_libres: number
}

/** Equipo propio (función mi_equipo): incluye el código para compartir. */
export interface MiEquipo {
  id: string
  nombre: string
  codigo_invitacion: string
  capitan_id: string | null
  es_capitan: boolean
  declara_cumple_mixto: boolean
  buscando_integrantes: boolean
}

/** Equipo completo, solo para organizadores. */
export interface Equipo {
  id: string
  actividad_id: string
  nombre: string
  codigo_invitacion: string
  capitan_id: string | null
  declara_cumple_mixto: boolean
  buscando_integrantes: boolean
}

export interface Inscripcion {
  id: string
  actividad_id: string
  participante_id: string
  equipo_id: string | null
  en_bolsa: boolean
  asistio: boolean
  creado_en: string
}

/** Inscripción pública (solo alias), para la bolsa y las listas de miembros. */
export interface InscripcionPublica {
  actividad_id: string
  participante_id: string
  alias: string
  equipo_id: string | null
  en_bolsa: boolean
}

/** Inscripción con datos de contacto: solo para el panel del organizador. */
export interface InscripcionOrg extends Inscripcion {
  participante: Pick<Participante, 'nombre' | 'alias' | 'correo' | 'codigo_pucp' | 'especialidad'>
}

export interface Resultado {
  id: string
  actividad_id: string
  equipo_id: string | null
  participante_id: string | null
  posicion: 1 | 2 | 3
}

export interface Encuesta {
  id: string
  temporada_id: string
  titulo: string
  max_votos_por_categoria: number
  abierta: boolean
  cierra_en: string | null
  creado_en: string
}

export interface OpcionEncuesta {
  id: string
  encuesta_id: string
  categoria: CategoriaOpcion
  texto: string
  orden: number
}

export interface EncuestaConOpciones extends Encuesta {
  opciones: OpcionEncuesta[]
}

export interface ResultadoOpcion {
  encuesta_id: string
  opcion_id: string
  categoria: CategoriaOpcion
  texto: string
  orden: number
  votos: number
  total_votantes: number
  porcentaje: number
}

export interface FilaRanking {
  temporada_id: string
  participante_id: string
  alias: string
  actividades_asistidas: number
  puntos: number
  posicion: number
}

export interface Resumen {
  id: string
  actividad_id: string
  texto: string
  ganadores: string | null
  imagen_url: string | null
  imagen_autorizada: boolean
  publicado_en: string
}
