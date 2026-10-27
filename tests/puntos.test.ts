import { describe, expect, it } from 'vitest'
import {
  calcularRanking,
  type ActividadParaPuntos,
  type InscripcionParaPuntos,
  type ResultadoParaPuntos,
} from '../src/lib/puntos'

const base = { puntos_participacion: 5, puntos_1: 10, puntos_2: 6, puntos_3: 4 }
const individual: ActividadParaPuntos = { id: 'ind', estado: 'finalizada', ...base }
const porEquipos: ActividadParaPuntos = { id: 'eq', estado: 'finalizada', ...base }
const abierta: ActividadParaPuntos = { id: 'abierta', estado: 'abierta', ...base }

const ins = (
  actividad_id: string,
  participante_id: string,
  asistio = true,
  equipo_id: string | null = null,
): InscripcionParaPuntos => ({ actividad_id, participante_id, equipo_id, asistio })

const puntosDe = (ranking: ReturnType<typeof calcularRanking>, id: string) =>
  ranking.find((f) => f.participante_id === id)?.puntos ?? 0

describe('regla de puntos del ranking', () => {
  it('solo participación: asistió sin posición', () => {
    const r = calcularRanking([individual], [ins('ind', 'ana')], [])
    expect(puntosDe(r, 'ana')).toBe(5)
  })

  it('posición individual: participación + puntos del puesto', () => {
    const resultados: ResultadoParaPuntos[] = [
      { actividad_id: 'ind', participante_id: 'ana', equipo_id: null, posicion: 1 },
      { actividad_id: 'ind', participante_id: 'beto', equipo_id: null, posicion: 3 },
    ]
    const r = calcularRanking([individual], [ins('ind', 'ana'), ins('ind', 'beto')], resultados)
    expect(puntosDe(r, 'ana')).toBe(15)
    expect(puntosDe(r, 'beto')).toBe(9)
  })

  it('posición por equipo: cada miembro recibe los puntos completos', () => {
    const resultados: ResultadoParaPuntos[] = [
      { actividad_id: 'eq', equipo_id: 'rojo', participante_id: null, posicion: 2 },
    ]
    const r = calcularRanking(
      [porEquipos],
      [ins('eq', 'ana', true, 'rojo'), ins('eq', 'beto', true, 'rojo'), ins('eq', 'caro', true, 'azul')],
      resultados,
    )
    expect(puntosDe(r, 'ana')).toBe(11)
    expect(puntosDe(r, 'beto')).toBe(11)
    expect(puntosDe(r, 'caro')).toBe(5)
  })

  it('sin asistencia: 0 puntos y no aparece, aunque su equipo haya ganado', () => {
    const resultados: ResultadoParaPuntos[] = [
      { actividad_id: 'eq', equipo_id: 'rojo', participante_id: null, posicion: 1 },
    ]
    const r = calcularRanking(
      [porEquipos],
      [ins('eq', 'ana', true, 'rojo'), ins('eq', 'beto', false, 'rojo')],
      resultados,
    )
    expect(puntosDe(r, 'beto')).toBe(0)
    expect(r.some((f) => f.participante_id === 'beto')).toBe(false)
  })

  it('empate de posiciones: ambos reciben los puntos completos y comparten puesto', () => {
    const resultados: ResultadoParaPuntos[] = [
      { actividad_id: 'ind', participante_id: 'ana', equipo_id: null, posicion: 1 },
      { actividad_id: 'ind', participante_id: 'beto', equipo_id: null, posicion: 1 },
    ]
    const r = calcularRanking(
      [individual],
      [ins('ind', 'ana'), ins('ind', 'beto'), ins('ind', 'caro')],
      resultados,
    )
    expect(puntosDe(r, 'ana')).toBe(15)
    expect(puntosDe(r, 'beto')).toBe(15)
    expect(r.map((f) => f.posicion)).toEqual([1, 1, 3])
  })

  it('actividades no finalizadas no suman', () => {
    const r = calcularRanking([abierta], [ins('abierta', 'ana')], [])
    expect(r).toEqual([])
  })

  it('suma varias actividades de la temporada', () => {
    const resultados: ResultadoParaPuntos[] = [
      { actividad_id: 'eq', equipo_id: 'rojo', participante_id: null, posicion: 3 },
    ]
    const r = calcularRanking(
      [individual, porEquipos],
      [ins('ind', 'ana'), ins('eq', 'ana', true, 'rojo')],
      resultados,
    )
    expect(r[0]).toEqual({ participante_id: 'ana', actividades_asistidas: 2, puntos: 14, posicion: 1 })
  })

  it('reproduce el ranking esperado de supabase/seed.sql (Duelo contra profes)', () => {
    const duelo: ActividadParaPuntos = { id: 'duelo', estado: 'finalizada', ...base }
    const equipos: Record<string, string[]> = { e1: ['p1', 'p2'], e2: ['p3', 'p4'], e3: ['p5', 'p6'], e4: ['p7', 'p8'] }
    // p8 (StackVicuna) no asistió.
    const inscripciones = Object.entries(equipos).flatMap(([eq, ps]) =>
      ps.map((p) => ins('duelo', p, p !== 'p8', eq)))
    const resultados: ResultadoParaPuntos[] = [
      { actividad_id: 'duelo', equipo_id: 'e1', participante_id: null, posicion: 1 },
      { actividad_id: 'duelo', equipo_id: 'e2', participante_id: null, posicion: 2 },
      { actividad_id: 'duelo', equipo_id: 'e3', participante_id: null, posicion: 3 },
    ]
    const r = calcularRanking([duelo], inscripciones, resultados)
    expect(r.map((f) => [f.participante_id, f.puntos, f.posicion])).toEqual([
      ['p1', 15, 1], ['p2', 15, 1], ['p3', 11, 3], ['p4', 11, 3], ['p5', 9, 5], ['p6', 9, 5], ['p7', 5, 7],
    ])
  })
})
