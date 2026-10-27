import { useEffect, useState } from 'react'
import { CountUp } from '../components/CountUp'
import { campo, tarjeta } from '../components/estilos'
import { ErrorCarga, Esqueleto } from '../components/Mensaje'
import { useCarga } from '../hooks/useCarga'
import { useSesion } from '../hooks/useSesion'
import { listarTemporadas, obtenerRanking } from '../lib/api'

// Ranking de temporada (P0-3). Los puntos los calcula la vista SQL
// vista_ranking_temporada con la regla explicada en src/lib/puntos.ts.
// Solo se muestra el alias: nunca el correo ni el nombre.
export default function Ranking() {
  const { perfil } = useSesion()
  const temporadas = useCarga(listarTemporadas, [])
  const [temporadaId, setTemporadaId] = useState<string>('')

  // Por defecto, la temporada activa (o la más reciente).
  useEffect(() => {
    if (!temporadaId && temporadas.datos?.length) {
      setTemporadaId((temporadas.datos.find((t) => t.activa) ?? temporadas.datos[0]).id)
    }
  }, [temporadas.datos, temporadaId])

  const ranking = useCarga(async () => (temporadaId ? obtenerRanking(temporadaId) : []), [temporadaId])

  if (temporadas.error) return <ErrorCarga mensaje={temporadas.error} reintentar={temporadas.recargar} />

  const filas = ranking.datos ?? []
  const miFila = perfil ? filas.find((f) => f.participante_id === perfil.id) : undefined

  return (
    <section aria-labelledby="titulo-ranking">
      <h1 id="titulo-ranking" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
        Ranking de la temporada
      </h1>
      <p className="mt-2 max-w-prose text-[15px] text-muted">
        Se suma por asistir, no solo por ganar: cada actividad da puntos por participar y, además, a los tres primeros
        puestos. En equipos, cada integrante recibe los puntos de su equipo.
      </p>

      {(temporadas.datos?.length ?? 0) > 1 && (
        <div className="mt-5 max-w-xs">
          <label htmlFor="temporada" className={campo.etiqueta}>Temporada</label>
          <select id="temporada" className={campo.input} value={temporadaId} onChange={(e) => setTemporadaId(e.target.value)}>
            {temporadas.datos?.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {miFila && (
        <p className="mt-5 rounded-[8px] bg-accent-soft px-4 py-3 text-[15px] text-accent-ink">
          Vas en el puesto <strong className="num font-semibold">{miFila.posicion}</strong> con{' '}
          <strong className="num font-semibold">{miFila.puntos} puntos</strong>.
        </p>
      )}

      <div className="mt-6">
        {ranking.error ? (
          <ErrorCarga mensaje={ranking.error} reintentar={ranking.recargar} />
        ) : (ranking.cargando && !ranking.datos) || temporadas.cargando ? (
          <Esqueleto filas={5} alto="h-11" />
        ) : filas.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-control px-4 py-3 text-[15px] text-muted">
            Aún no hay puntos en esta temporada. Aparecerán cuando termine la primera actividad.
          </p>
        ) : (
          <div className={`${tarjeta} overflow-hidden`}>
            {/* table-fixed: anchos fijos para puesto, asistencias y puntos; el alias toma el resto. */}
            <table className="w-full table-fixed text-left">
              <caption className="sr-only">Ranking: posición, alias, actividades asistidas y puntos</caption>
              <thead>
                <tr className="text-[13px] text-muted">
                  <th scope="col" className="w-16 py-2.5 pl-4 font-normal">Puesto</th>
                  <th scope="col" className="py-2.5 pl-1 font-normal">Alias</th>
                  <th scope="col" className="w-20 py-2.5 text-right font-normal sm:w-40">
                    <span className="hidden sm:inline">Actividades </span>asistidas
                  </th>
                  <th scope="col" className="w-20 py-2.5 pr-4 text-right font-normal">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => {
                  const soyYo = f.participante_id === perfil?.id
                  return (
                    <tr key={f.participante_id} className={`border-t border-rule ${soyYo ? 'bg-accent-soft' : ''}`}>
                      <td className="num py-3 pl-4 text-[15px] font-semibold">
                        {f.posicion <= 3 ? (
                          <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent text-sm text-white">
                            {f.posicion}
                          </span>
                        ) : (
                          <span className="inline-flex size-7 items-center justify-center text-muted">{f.posicion}</span>
                        )}
                      </td>
                      <td className="truncate py-3 pl-1 text-[15px] font-medium">
                        {f.alias}
                        {soyYo && <span className="ml-1.5 text-[13px] font-normal text-accent-ink">(tú)</span>}
                      </td>
                      <td className="num py-3 text-right text-[15px] text-muted">{f.actividades_asistidas}</td>
                      <td className="py-3 pr-4 text-right text-[17px] font-semibold">
                        <CountUp to={f.puntos} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
