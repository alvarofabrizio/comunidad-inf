import { Link, useSearchParams } from 'react-router-dom'
import { ErrorCarga, Esqueleto } from '../components/Mensaje'
import { TarjetaActividad } from '../components/TarjetaActividad'
import { useCarga } from '../hooks/useCarga'
import { listarActividades, obtenerTemporadaActiva } from '../lib/api'
import { etiquetaTipo } from '../lib/formato'
import type { TipoActividad } from '../types'

// Calendario de temporada (P1-1): próximas y pasadas, filtro por tipo y Compartir en cada actividad.
export default function Calendario() {
  const [params, setParams] = useSearchParams()
  const tipo = params.get('tipo') as TipoActividad | null
  const { datos, error, cargando, recargar } = useCarga(async () => {
    const temporada = await obtenerTemporadaActiva()
    return { temporada, actividades: temporada ? await listarActividades(temporada.id) : [] }
  }, [])

  if (cargando && !datos) return <Esqueleto filas={4} />
  if (error) return <ErrorCarga mensaje={error} reintentar={recargar} />

  const ahora = Date.now()
  const todas = datos?.actividades ?? []
  // Solo se ofrecen como filtro los tipos que tienen actividades.
  const tipos = (Object.keys(etiquetaTipo) as TipoActividad[]).filter((t) => todas.some((a) => a.tipo === t))
  const actividades = tipo ? todas.filter((a) => a.tipo === tipo) : todas
  const esPasada = (a: (typeof todas)[number]) => a.estado === 'finalizada' || new Date(a.fecha_hora).getTime() < ahora
  const proximas = actividades.filter((a) => !esPasada(a))
  const pasadas = actividades.filter(esPasada).reverse()

  const filtro = (valor: TipoActividad | null, texto: string, cuenta: number) => {
    const activo = tipo === valor
    return (
      <button
        key={texto}
        type="button"
        aria-pressed={activo}
        onClick={() => setParams(valor ? { tipo: valor } : {}, { replace: true })}
        className={`min-h-11 flex-none rounded-full border px-4 text-[15px] font-medium whitespace-nowrap transition-colors ${
          activo ? 'border-accent bg-accent-soft text-accent-ink' : 'border-control bg-surface text-ink hover:bg-raised'
        }`}
      >
        {texto} <span className="num text-muted">{cuenta}</span>
      </button>
    )
  }

  return (
    <section aria-labelledby="titulo-calendario">
      <h1 id="titulo-calendario" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
        Calendario
      </h1>
      <p className="mt-2 text-[15px] text-muted">{datos?.temporada?.nombre ?? 'No hay una temporada activa.'}</p>

      {tipos.length > 1 && (
        // En el celular la fila de filtros se desplaza de lado dentro de su propio espacio, nunca la página.
        <div role="group" aria-label="Filtrar por tipo" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {filtro(null, 'Todas', todas.length)}
          {tipos.map((t) => filtro(t, etiquetaTipo[t], todas.filter((a) => a.tipo === t).length))}
        </div>
      )}

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
          {tipo ? `No hay actividades de tipo ${etiquetaTipo[tipo].toLowerCase()} programadas.` : 'No hay actividades programadas por ahora.'}
        </p>
      )}

      <div className="mt-10 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Pasadas <span className="num font-normal text-muted">({pasadas.length})</span>
        </h2>
        <Link to="/resumenes" className="text-[15px] font-medium text-accent hover:underline">Ver resúmenes</Link>
      </div>
      {pasadas.length ? (
        <ul className="mt-3 space-y-2">
          {pasadas.map((a) => (
            <TarjetaActividad key={a.id} actividad={a} compartir={false} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-[8px] border border-dashed border-control px-4 py-3 text-[15px] text-muted">Todavía no hay actividades pasadas.</p>
      )}
    </section>
  )
}
