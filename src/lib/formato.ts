// Formatos y etiquetas para mostrar datos en la interfaz (es-PE, hora de Lima).
import type { CategoriaOpcion, EstadoActividad, Modalidad, TipoActividad } from '../types'

const ZONA = 'America/Lima'

export const etiquetaTipo: Record<TipoActividad, string> = {
  videojuego: 'Videojuego',
  deporte: 'Deporte',
  social: 'Social',
  academica: 'Académica',
}

export const etiquetaEstado: Record<EstadoActividad, string> = {
  borrador: 'Borrador',
  abierta: 'Inscripciones abiertas',
  cerrada: 'Inscripciones cerradas',
  finalizada: 'Finalizada',
}

export const etiquetaModalidad: Record<Modalidad, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
}

export const etiquetaCategoria: Record<CategoriaOpcion, string> = {
  juego: 'Juegos',
  actividad: 'Actividades',
  horario: 'Horarios',
}

export const ordenCategorias: CategoriaOpcion[] = ['juego', 'actividad', 'horario']

/** "sáb. 14 nov., 3:00 p. m." */
export function fechaHora(iso: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: ZONA,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** "30 de noviembre" */
export function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat('es-PE', { timeZone: ZONA, day: 'numeric', month: 'long' }).format(new Date(iso))
}

/** Día y mes por separado para el bloque de fecha del calendario. */
export function diaMes(iso: string): { dia: string; mes: string } {
  const fecha = new Date(iso)
  return {
    dia: new Intl.DateTimeFormat('es-PE', { timeZone: ZONA, day: 'numeric' }).format(fecha),
    mes: new Intl.DateTimeFormat('es-PE', { timeZone: ZONA, month: 'short' }).format(fecha).replace('.', ''),
  }
}

export function plural(n: number, singular: string, pluralTexto = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralTexto}`
}
