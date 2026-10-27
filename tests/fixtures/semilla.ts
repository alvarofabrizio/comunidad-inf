// Espejo de supabase/seed.sql con lo que necesita la regla de puntos.
// Si cambias la semilla, actualiza también este archivo.
import type { ActividadParaPuntos, InscripcionParaPuntos, ResultadoParaPuntos } from '../../src/lib/puntos'

const base = { puntos_participacion: 5, puntos_1: 10, puntos_2: 6, puntos_3: 4 }
const c = (n: number) => `c0000000-0000-0000-0000-00000000000${n}`
const d = (n: number) => `d0000000-0000-0000-0000-00000000000${n}`
const e = (n: number) => `e0000000-0000-0000-0000-0000000000${String(n).padStart(2, '0')}`

export const alias: Record<string, string> = {
  [e(1)]: 'PixelPuma', [e(2)]: 'ByteLlama', [e(3)]: 'NeonCondor', [e(4)]: 'QuantumCuy',
  [e(5)]: 'LagAlpaca', [e(6)]: 'DebugZorro', [e(7)]: 'KernelPanda', [e(8)]: 'StackVicuna',
  [e(9)]: 'CacheColibri', [e(10)]: 'RootOtorongo', [e(11)]: 'BinarioBuho', [e(12)]: 'PingPinguino',
}

export const actividades: ActividadParaPuntos[] = [
  { id: c(1), estado: 'abierta', ...base },    // Torneo post-parciales
  { id: c(2), estado: 'abierta', ...base },    // Vóley mixto
  { id: c(3), estado: 'abierta', ...base },    // Show de talentos
  { id: c(4), estado: 'finalizada', ...base }, // Duelo contra profes
  { id: c(5), estado: 'abierta', ...base },    // Chocolatada
]

const ins = (act: number, p: number, equipo: number | null, asistio = false): InscripcionParaPuntos => ({
  actividad_id: c(act), participante_id: e(p), equipo_id: equipo ? d(equipo) : null, asistio,
})

export const inscripciones: InscripcionParaPuntos[] = [
  // Duelo contra profes: todos asistieron menos StackVicuna (8)
  ins(4, 1, 1, true), ins(4, 2, 1, true), ins(4, 3, 2, true), ins(4, 4, 2, true),
  ins(4, 5, 3, true), ins(4, 6, 3, true), ins(4, 7, 4, true), ins(4, 8, 4, false),
  // Torneo post-parciales
  ins(1, 1, 5), ins(1, 2, 5), ins(1, 3, 5), ins(1, 5, 6), ins(1, 9, 6), ins(1, 10, null), ins(1, 11, null),
  // Vóley mixto
  ins(2, 6, 7), ins(2, 7, 7), ins(2, 8, null),
  // Show de talentos
  ins(3, 4, null), ins(3, 12, null),
]

export const resultados: ResultadoParaPuntos[] = [
  { actividad_id: c(4), equipo_id: d(1), participante_id: null, posicion: 1 },
  { actividad_id: c(4), equipo_id: d(2), participante_id: null, posicion: 2 },
  { actividad_id: c(4), equipo_id: d(3), participante_id: null, posicion: 3 },
]

export const TEMPORADA_SEMILLA = 'a0000000-0000-0000-0000-000000000001'
