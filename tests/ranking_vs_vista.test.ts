import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { calcularRanking } from '../src/lib/puntos'
import { actividades, alias, inscripciones, resultados, TEMPORADA_SEMILLA } from './fixtures/semilla'

// Resultado de `select alias, puntos, posicion from vista_ranking_temporada` sobre
// la semilla recién cargada (comprobado en PostgreSQL y en el Supabase del proyecto).
const SALIDA_VISTA_SQL = [
  ['ByteLlama', 15, 1], ['PixelPuma', 15, 1], ['NeonCondor', 11, 3], ['QuantumCuy', 11, 3],
  ['DebugZorro', 9, 5], ['LagAlpaca', 9, 5], ['KernelPanda', 5, 7],
]

const ordenar = (filas: (string | number)[][]) =>
  [...filas].sort((a, b) => Number(a[2]) - Number(b[2]) || String(a[0]).localeCompare(String(b[0])))

const calculado = () =>
  ordenar(calcularRanking(actividades, inscripciones, resultados).map((f) => [alias[f.participante_id], f.puntos, f.posicion]))

describe('la vista SQL del ranking y puntos.ts coinciden con la semilla', () => {
  it('mismos alias, puntos y posiciones que la vista SQL', () => {
    expect(calculado()).toEqual(ordenar(SALIDA_VISTA_SQL))
  })

  it('StackVicuna no aparece: no asistió (0 puntos)', () => {
    expect(calculado().some((f) => f[0] === 'StackVicuna')).toBe(false)
  })

  // Comparación en vivo contra Supabase. Es opcional porque, en cuanto se use la app,
  // la base deja de ser igual a la semilla. Uso: RANKING_EN_VIVO=1 npm run test
  it.runIf(process.env.RANKING_EN_VIVO === '1')('en vivo: la vista de Supabase da lo mismo', async () => {
    const env = Object.fromEntries(
      readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1)]),
    )
    const r = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/vista_ranking_temporada?temporada_id=eq.${TEMPORADA_SEMILLA}&select=alias,puntos,posicion`,
      { headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` } },
    )
    const filas = (await r.json()) as { alias: string; puntos: number; posicion: number }[]
    expect(ordenar(filas.map((f) => [f.alias, f.puntos, f.posicion]))).toEqual(calculado())
  })
})
