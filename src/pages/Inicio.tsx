import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { boton, tarjeta } from '../components/estilos'
import { ErrorCarga, Esqueleto } from '../components/Mensaje'
import { TarjetaActividad } from '../components/TarjetaActividad'
import { useCarga } from '../hooks/useCarga'
import { useSesion } from '../hooks/useSesion'
import {
  encuestaEstaAbierta,
  listarActividades,
  obtenerEncuestaActual,
  obtenerRanking,
  obtenerResultadosEncuesta,
  obtenerTemporadaActiva,
} from '../lib/api'
import { etiquetaTipo, fechaHora, plural } from '../lib/formato'

// Inicio: responde "¿qué puedo hacer ahora?": la próxima actividad abierta,
// la encuesta vigente y cómo va el ranking.
export default function Inicio() {
  const { perfil } = useSesion()
  const { datos, error, cargando, recargar } = useCarga(async () => {
    const temporada = await obtenerTemporadaActiva()
    const [actividades, encuesta, ranking] = await Promise.all([
      temporada ? listarActividades(temporada.id) : Promise.resolve([]),
      obtenerEncuestaActual(),
      temporada ? obtenerRanking(temporada.id) : Promise.resolve([]),
    ])
    const resultados = encuesta ? await obtenerResultadosEncuesta(encuesta.id) : []
    return { temporada, actividades, encuesta, ranking, votantes: resultados[0]?.total_votantes ?? 0 }
  }, [])

  const ahora = Date.now()
  const abiertas = (datos?.actividades ?? []).filter(
    (a) => a.estado === 'abierta' && new Date(a.fecha_hora).getTime() >= ahora,
  )
  const [destacada, ...otras] = abiertas

  return (
    <div>
      <h1 className="text-[28px] leading-tight font-bold tracking-[-0.02em] md:text-[32px]">
        Comunidad INF
      </h1>
      <p className="mt-2 max-w-prose text-base text-muted">
        Vota qué hacemos este ciclo, inscríbete aunque vengas solo y suma puntos por asistir.
        {datos?.temporada ? ` ${datos.temporada.nombre}.` : ''}
      </p>

      {!perfil && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-accent-soft p-4">
          <p className="text-[15px] text-accent-ink">Regístrate en un minuto, sin contraseña, para votar e inscribirte.</p>
          <Link to="/registro" className={`${boton.primario} w-full sm:w-auto`}>
            Registrarme
          </Link>
        </div>
      )}

      {error ? (
        <div className="mt-6">
          <ErrorCarga mensaje={error} reintentar={recargar} />
        </div>
      ) : cargando && !datos ? (
        <div className="mt-6">
          <Esqueleto filas={3} alto="h-32" />
        </div>
      ) : (
        <div className="mt-6 grid items-start gap-4 md:grid-cols-5">
          {/* Bloque principal: la próxima actividad con inscripciones abiertas. */}
          <section aria-labelledby="titulo-proxima" className={`${tarjeta} p-4 md:col-span-3 md:p-5`}>
            <h2 id="titulo-proxima" className="text-sm text-muted">Próxima actividad abierta</h2>
            {destacada ? (
              <>
                <p className="mt-1 text-xl font-semibold tracking-[-0.01em]">{destacada.titulo}</p>
                <p className="mt-1 text-[15px] text-muted">
                  {etiquetaTipo[destacada.tipo]}
                  {destacada.juego_o_disciplina ? ` · ${destacada.juego_o_disciplina}` : ''} · {fechaHora(destacada.fecha_hora)}
                </p>
                <p className="num mt-3 text-[15px]">
                  <strong className="font-semibold">{destacada.lugares_libres}</strong>
                  <span className="text-muted"> de {destacada.cupo} lugares libres</span>
                  {destacada.tamano_equipo > 1 && (
                    <span className="text-muted">
                      {' '}· equipos de {destacada.tamano_equipo}
                      {destacada.en_bolsa > 0 ? ` · ${plural(destacada.en_bolsa, 'persona busca', 'personas buscan')} equipo` : ''}
                    </span>
                  )}
                </p>
                <Link to={`/actividad/${destacada.id}`} className={`${boton.primario} mt-4 w-full sm:w-auto`}>
                  {destacada.tamano_equipo > 1 ? 'Ver equipos e inscribirme' : 'Ver e inscribirme'}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </>
            ) : (
              <p className="mt-2 text-[15px] text-muted">No hay inscripciones abiertas por ahora.</p>
            )}
          </section>

          <section aria-labelledby="titulo-encuesta-inicio" className={`${tarjeta} p-4 md:col-span-2 md:p-5`}>
            <h2 id="titulo-encuesta-inicio" className="text-sm text-muted">Encuesta</h2>
            {datos?.encuesta ? (
              <>
                <p className="mt-1 text-lg font-semibold">{datos.encuesta.titulo}</p>
                <p className="num mt-1 text-[15px] text-muted">
                  {plural(datos.votantes, 'persona votó', 'personas votaron')}
                  {encuestaEstaAbierta(datos.encuesta) ? '' : ' · cerrada'}
                </p>
                <Link to="/encuesta" className={`${boton.secundario} mt-4 w-full`}>
                  {encuestaEstaAbierta(datos.encuesta) ? 'Votar y ver resultados' : 'Ver resultados'}
                </Link>
              </>
            ) : (
              <p className="mt-2 text-[15px] text-muted">No hay encuestas publicadas.</p>
            )}
          </section>

          <section aria-labelledby="titulo-top" className={`${tarjeta} p-4 md:col-span-2 md:p-5`}>
            <div className="flex items-baseline justify-between">
              <h2 id="titulo-top" className="text-sm text-muted">Ranking</h2>
              <Link to="/ranking" className="text-sm font-medium text-accent hover:underline">Ver todo</Link>
            </div>
            {datos?.ranking.length ? (
              <ol className="mt-2 space-y-1">
                {datos.ranking.slice(0, 3).map((f) => (
                  <li key={f.participante_id} className="flex items-center gap-3 py-1">
                    <span className="num inline-flex size-7 flex-none items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                      {f.posicion}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{f.alias}</span>
                    <span className="num text-[15px] font-semibold">{f.puntos} pts</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-[15px] text-muted">Aún no hay puntos esta temporada.</p>
            )}
          </section>

          <section aria-labelledby="titulo-otras" className="md:col-span-3">
            <div className="flex items-baseline justify-between">
              <h2 id="titulo-otras" className="text-lg font-semibold">También abiertas</h2>
              <Link to="/calendario" className="text-sm font-medium text-accent hover:underline">Calendario</Link>
            </div>
            {otras.length ? (
              <ul className="mt-3 space-y-2">
                {otras.slice(0, 3).map((a) => (
                  <TarjetaActividad key={a.id} actividad={a} />
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[15px] text-muted">No hay más actividades abiertas.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
