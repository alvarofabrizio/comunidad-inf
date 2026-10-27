import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { boton, tarjeta } from '../components/estilos'
import { ErrorCarga, Esqueleto } from '../components/Mensaje'
import { DameroPixeles } from '../components/Marca'
import { Pinguino } from '../components/Pinguino'
import { PixelCard } from '../components/PixelCard'
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
import { etiquetaCategoria, etiquetaTipo, fechaHora, ordenCategorias, plural } from '../lib/formato'

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
    // La opción con más votos de cada categoría (si hay votos), para mostrar "va ganando".
    const lideres = ordenCategorias
      .map((c) => resultados.filter((r) => r.categoria === c && r.votos > 0).sort((a, b) => b.votos - a.votos)[0])
      .filter((r): r is NonNullable<typeof r> => !!r)
    return { temporada, actividades, encuesta, ranking, lideres, votantes: resultados[0]?.total_votantes ?? 0 }
  }, [])

  const ahora = Date.now()
  const abiertas = (datos?.actividades ?? []).filter(
    (a) => a.estado === 'abierta' && new Date(a.fecha_hora).getTime() >= ahora,
  )
  const [destacada, ...otras] = abiertas

  return (
    <div>
      {/* Banda de bienvenida en bosque, con el damero pixelado de la AAII y Pingüi saludando. */}
      <section
        aria-labelledby="titulo-inicio"
        className="zona-oscura relative -mx-4 -mt-6 overflow-hidden bg-bosque px-4 pt-7 md:mx-0 md:mt-0 md:rounded-[8px] md:px-8"
      >
        <DameroPixeles className="absolute top-0 right-0 w-16 -scale-x-100 opacity-40 md:w-20" />
        <DameroPixeles className="absolute right-0 bottom-0 w-20 rotate-180 opacity-30 md:w-24" />
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="pb-7">
            <h1 id="titulo-inicio" className="text-[26px] leading-[1.1] font-bold tracking-[-0.02em] text-crema md:text-[32px]">
              Juega, vota y <span className="text-lima">súmate</span>
            </h1>
            <p className="mt-2 max-w-md text-base text-crema-tenue">
              Las actividades de Ingeniería Informática PUCP: elige qué hacemos, inscríbete aunque vengas solo y suma
              puntos por asistir.{datos?.temporada ? ` ${datos.temporada.nombre}.` : ''}
            </p>
            {perfil ? (
              <p className="mt-4 text-[15px] font-medium text-crema">
                Hola, <span className="text-lima">{perfil.alias}</span>. Revisa qué hay abierto.
              </p>
            ) : (
              <Link
                to="/registro"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[6px] bg-lima px-4 text-[15px] font-semibold text-bosque transition-transform hover:brightness-105 active:scale-[0.98]"
              >
                Únete en 1 minuto
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            )}
          </div>
          <Pinguino className="-mb-1 w-24 sm:w-32 md:w-36" />
        </div>
      </section>

      {error ? (
        <div className="mt-6">
          <ErrorCarga mensaje={error} reintentar={recargar} />
        </div>
      ) : cargando && !datos ? (
        <div className="mt-6">
          <Esqueleto filas={3} alto="h-32" />
        </div>
      ) : (
        // grid-cols-1 = minmax(0, 1fr): sin esto, un título largo con "truncate" ensancha la columna en el celular.
        <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-5">
          {/* Bloque principal: la próxima actividad con inscripciones abiertas. */}
          {/* PixelCard (React Bits): al pasar el mouse o enfocar, se encienden píxeles verdes. */}
          <PixelCard className={`${tarjeta} md:col-span-3 md:self-stretch`}>
          <section aria-labelledby="titulo-proxima" className="p-4 md:p-5">
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
          </PixelCard>

          {/* Misma altura que la tarjeta de al lado: la acción baja al pie (lo único que puede ir ahí). */}
          <section aria-labelledby="titulo-encuesta-inicio" className={`${tarjeta} flex flex-col p-4 md:col-span-2 md:self-stretch md:p-5`}>
            <h2 id="titulo-encuesta-inicio" className="text-sm text-muted">Encuesta</h2>
            {datos?.encuesta ? (
              <>
                <p className="mt-1 text-lg font-semibold">{datos.encuesta.titulo}</p>
                <p className="num mt-1 text-[15px] text-muted">
                  {plural(datos.votantes, 'persona votó', 'personas votaron')}
                  {encuestaEstaAbierta(datos.encuesta) ? '' : ' · cerrada'}
                </p>
                {datos.lideres.length > 0 && (
                  <dl className="mt-3 space-y-1 text-[15px]">
                    {datos.lideres.map((r) => (
                      <div key={r.categoria} className="flex justify-between gap-3">
                        <dt className="text-muted">{etiquetaCategoria[r.categoria]}</dt>
                        <dd className="truncate font-medium">{r.texto}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="flex-1" />
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
