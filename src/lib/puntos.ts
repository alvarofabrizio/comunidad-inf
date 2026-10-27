// Regla de puntos del ranking (P0-3). Es la MISMA regla que calcula la vista
// SQL vista_ranking_temporada (supabase/migrations/0002_rls_y_funciones.sql).
// Se mantiene aquí en TypeScript, sin dependencias, para poder probarla con Vitest
// y explicarla con ejemplos (tests/puntos.test.ts).
//
// Regla:
//   1. Solo cuentan actividades en estado 'finalizada'.
//   2. Solo suma quien tiene asistencia marcada (asistio = true). Sin asistencia, 0.
//   3. Puntos por actividad = puntos_participacion + puntos de su mejor posición.
//      La posición puede ser propia (actividad individual) o de su equipo: en
//      actividades por equipos cada miembro recibe los puntos completos.
//   4. 1.° = puntos_1, 2.° = puntos_2, 3.° = puntos_3 (por defecto 10, 6 y 4).
//      Los empates reciben los puntos completos de esa posición.
//   5. En la tabla, quienes empatan en puntos comparten posición (1, 1, 3...).

import type { EstadoActividad } from '../types'

export interface ActividadParaPuntos {
  id: string
  estado: EstadoActividad
  puntos_participacion: number
  puntos_1: number
  puntos_2: number
  puntos_3: number
}

export interface InscripcionParaPuntos {
  actividad_id: string
  participante_id: string
  equipo_id: string | null
  asistio: boolean
}

export interface ResultadoParaPuntos {
  actividad_id: string
  equipo_id: string | null
  participante_id: string | null
  posicion: number
}

export interface PuntajeCalculado {
  participante_id: string
  actividades_asistidas: number
  puntos: number
  posicion: number
}

export function puntosPorPosicion(actividad: ActividadParaPuntos, posicion: number | null): number {
  switch (posicion) {
    case 1: return actividad.puntos_1
    case 2: return actividad.puntos_2
    case 3: return actividad.puntos_3
    default: return 0
  }
}

/** Mejor posición (la de número más bajo) de una inscripción, propia o de su equipo. */
export function mejorPosicion(
  inscripcion: InscripcionParaPuntos,
  resultados: ResultadoParaPuntos[],
): number | null {
  const posiciones = resultados
    .filter((r) => r.actividad_id === inscripcion.actividad_id)
    .filter((r) =>
      r.participante_id === inscripcion.participante_id ||
      (inscripcion.equipo_id !== null && r.equipo_id === inscripcion.equipo_id))
    .map((r) => r.posicion)
  return posiciones.length ? Math.min(...posiciones) : null
}

/** Puntos que gana una inscripción en una actividad (0 si no cuenta). */
export function puntosDeInscripcion(
  inscripcion: InscripcionParaPuntos,
  actividad: ActividadParaPuntos,
  resultados: ResultadoParaPuntos[],
): number {
  if (actividad.estado !== 'finalizada' || !inscripcion.asistio) return 0
  return actividad.puntos_participacion + puntosPorPosicion(actividad, mejorPosicion(inscripcion, resultados))
}

/**
 * Ranking de una temporada. Recibe las actividades de esa temporada, sus
 * inscripciones y resultados. Solo aparecen personas con al menos una
 * asistencia en una actividad finalizada (igual que la vista SQL).
 */
export function calcularRanking(
  actividades: ActividadParaPuntos[],
  inscripciones: InscripcionParaPuntos[],
  resultados: ResultadoParaPuntos[],
): PuntajeCalculado[] {
  const porId = new Map(actividades.map((a) => [a.id, a]))
  const acumulado = new Map<string, { asistidas: number; puntos: number }>()

  for (const ins of inscripciones) {
    const act = porId.get(ins.actividad_id)
    if (!act || act.estado !== 'finalizada' || !ins.asistio) continue
    const fila = acumulado.get(ins.participante_id) ?? { asistidas: 0, puntos: 0 }
    fila.asistidas += 1
    fila.puntos += puntosDeInscripcion(ins, act, resultados)
    acumulado.set(ins.participante_id, fila)
  }

  const filas = [...acumulado.entries()]
    .map(([participante_id, f]) => ({ participante_id, actividades_asistidas: f.asistidas, puntos: f.puntos }))
    .sort((a, b) => b.puntos - a.puntos)

  // Igual que rank() en SQL: misma posición para empates y luego se salta (1, 1, 3).
  return filas.map((f) => ({ ...f, posicion: 1 + filas.filter((o) => o.puntos > f.puntos).length }))
}
