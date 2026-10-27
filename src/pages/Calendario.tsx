import { ErrorCarga, Esqueleto } from '../components/Mensaje'
import { TarjetaActividad } from '../components/TarjetaActividad'
import { useCarga } from '../hooks/useCarga'
import { listarActividades, obtenerTemporadaActiva } from '../lib/api'

// Calendario de la temporada activa (versión P0: próximas y pasadas).
// En la Fase 4 se agregan los filtros por tipo y el botón Compartir.
export default function Calendario() {
  const { datos, error, cargando, recargar } = useCarga(async () => {
    const temporada = await obtenerTemporadaActiva()
    return { temporada, actividades: temporada ? await listarActividades(temporada.id) : [] }
  }, [])

  if (cargando && !datos) return <Esqueleto filas={4} />
  if (error) return <ErrorCarga mensaje={error} reintentar={recargar} />

  const ahora = Date.now()
  const actividades = datos?.actividades ?? []
  const proximas = actividades.filter((a) => new Date(a.fecha_hora).getTime() >= ahora && a.estado !== 'finalizada')
  const pasadas = actividades
    .filter((a) => new Date(a.fecha_hora).getTime() < ahora || a.estado === 'finalizada')
    .reverse()

  return (
    <section aria-labelledby="titulo-calendario">
      <h1 id="titulo-calendario" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
        Calendario
      </h1>
      <p className="mt-2 text-[15px] text-muted">{datos?.temporada?.nombre ?? 'No hay una temporada activa.'}</p>

      <h2 className="mt-8 text-lg font-semibold">
        Próximas <span className="num font-normal text-muted">({proximas.length})</span>
      </h2>
      {proximas.length ? (
        <ul className="mt-3 space-y-2">
          {proximas.map((a) => (
            <TarjetaActividad key={a.id} actividad={a} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-[8px] border border-dashed border-control px-4 py-3 text-[15px] text-muted">
          No hay actividades programadas por ahora.
        </p>
      )}

      {pasadas.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold">
            Pasadas <span className="num font-normal text-muted">({pasadas.length})</span>
          </h2>
          <ul className="mt-3 space-y-2">
            {pasadas.map((a) => (
              <TarjetaActividad key={a.id} actividad={a} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
