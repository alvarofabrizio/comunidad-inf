import { ArrowLeft, Download, ExternalLink } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AsientosEquipo } from '../../components/AsientosEquipo'
import { boton, campo, tarjeta } from '../../components/estilos'
import { ErrorCarga, Esqueleto, Mensaje } from '../../components/Mensaje'
import { useCarga } from '../../hooks/useCarga'
import {
  asignarAEquipo,
  cambiarEstadoActividad,
  crearEquipoOrg,
  devolverABolsa,
  eliminarEquipo,
  eliminarInscripcion,
  eliminarResultado,
  listarEquiposOrg,
  listarInscripcionesOrg,
  listarResultados,
  marcarAsistencia,
  marcarAsistenciaVarias,
  obtenerActividad,
  registrarPosicion,
} from '../../lib/api'
import { aCsv, descargarCsv } from '../../lib/csv'
import { etiquetaEstado, fechaHora } from '../../lib/formato'
import type { EstadoActividad, InscripcionOrg, Resultado } from '../../types'

const ESTADOS: EstadoActividad[] = ['borrador', 'abierta', 'cerrada', 'finalizada']

// Gestión de una actividad en una sola pantalla (P1-2 y pasos 4-5 del escenario):
// bolsa → equipos, asistencia, posiciones 1.°/2.°/3.° y estado.
export default function GestionActividad() {
  const { id = '' } = useParams()
  const { datos, error, cargando, recargar } = useCarga(async () => {
    const [actividad, inscripciones, equipos, resultados] = await Promise.all([
      obtenerActividad(id),
      listarInscripcionesOrg(id),
      listarEquiposOrg(id),
      listarResultados(id),
    ])
    return { actividad, inscripciones, equipos, resultados }
  }, [id])

  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<{ tono: 'exito' | 'error'; texto: string } | null>(null)
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [destino, setDestino] = useState<Record<string, string>>({}) // inscripción en bolsa → equipo elegido

  /** Ejecuta una acción, muestra su resultado y recarga los datos. */
  async function hacer(accion: () => Promise<unknown>, exito: string) {
    setOcupado(true)
    setAviso(null)
    try {
      await accion()
      setAviso({ tono: 'exito', texto: exito })
      await recargar()
    } catch (e) {
      setAviso({ tono: 'error', texto: e instanceof Error ? e.message : 'No se pudo completar la acción.' })
    } finally {
      setOcupado(false)
    }
  }

  if (cargando && !datos) return <Esqueleto filas={4} alto="h-24" />
  if (error) return <ErrorCarga mensaje={error} reintentar={recargar} />
  if (!datos?.actividad) return <p className="text-[15px] text-muted">Actividad no encontrada.</p>

  const { actividad, inscripciones, equipos, resultados } = datos
  const porEquipos = actividad.tamano_equipo > 1
  const bolsa = inscripciones.filter((i) => i.en_bolsa)
  const asistieron = inscripciones.filter((i) => i.asistio).length
  const miembrosDe = (equipoId: string) => inscripciones.filter((i) => i.equipo_id === equipoId)
  const posicionDe = (filtro: (r: Resultado) => boolean) => resultados.find(filtro)

  function exportar() {
    const nombreEquipoDe = (equipoId: string | null) => equipos.find((e) => e.id === equipoId)?.nombre ?? ''
    const csv = aCsv(
      ['alias', 'nombre', 'correo', 'codigo_pucp', 'especialidad', 'equipo', 'en_bolsa', 'asistio', 'inscrito_en'],
      inscripciones.map((i) => [
        i.participante.alias,
        i.participante.nombre,
        i.participante.correo,
        i.participante.codigo_pucp,
        i.participante.especialidad,
        nombreEquipoDe(i.equipo_id),
        i.en_bolsa ? 'sí' : 'no',
        i.asistio ? 'sí' : 'no',
        i.creado_en,
      ]),
    )
    const archivo = actividad!.titulo.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-')
    descargarCsv(`inscritos-${archivo}.csv`, csv)
  }

  /** Select de posición (—, 1.°, 2.°, 3.°) para un equipo o una persona. */
  const selectPosicion = ({ etiqueta, ganador, actual }: { etiqueta: string; ganador: { equipo_id: string } | { participante_id: string }; actual?: Resultado }) => {
    return (
      <label className="flex items-center gap-2 text-sm text-muted">
        <span className="sr-only">Posición de {etiqueta}</span>
        <span aria-hidden="true">Puesto</span>
        <select
          className="min-h-10 rounded-[6px] border border-control bg-surface px-2 text-[15px] text-ink"
          value={actual?.posicion ?? ''}
          disabled={ocupado}
          onChange={(e) => {
            const valor = e.target.value
            if (!valor && actual) void hacer(() => eliminarResultado(actual.id), `Se quitó la posición de ${etiqueta}.`)
            else if (valor) void hacer(() => registrarPosicion(actividad!.id, ganador, Number(valor) as 1 | 2 | 3), `${etiqueta}: ${valor}.° puesto.`)
          }}
        >
          <option value="">—</option>
          <option value="1">1.°</option>
          <option value="2">2.°</option>
          <option value="3">3.°</option>
        </select>
      </label>
    )
  }

  const filaPersona = ({ ins, extra }: { ins: InscripcionOrg; extra?: ReactNode }) => {
    return (
      <li key={ins.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
        <label className="flex min-h-11 min-w-0 flex-1 items-center gap-3">
          <input
            type="checkbox"
            checked={ins.asistio}
            disabled={ocupado}
            onChange={(e) => void hacer(() => marcarAsistencia(ins.id, e.target.checked), `${ins.participante.alias}: ${e.target.checked ? 'asistió' : 'sin asistencia'}.`)}
            className="size-5 flex-none accent-[var(--color-accent)]"
          />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-medium">{ins.participante.alias}</span>
            <span className="block truncate text-[13px] text-muted">{ins.participante.nombre} · {ins.participante.correo}</span>
          </span>
        </label>
        {extra}
      </li>
    )
  }

  return (
    <article aria-labelledby="titulo-gestion">
      <Link to="/org" className={`${boton.texto} -ml-1 text-sm`}>
        <ArrowLeft aria-hidden="true" className="size-4" /> Panel
      </Link>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 id="titulo-gestion" className="text-2xl font-bold tracking-[-0.02em] md:text-[28px]">
            {actividad.titulo}
          </h1>
          <p className="mt-1 text-[15px] text-muted">
            {fechaHora(actividad.fecha_hora)} · {porEquipos ? `equipos de ${actividad.tamano_equipo}` : 'individual'}
            {actividad.requiere_mixto ? ' · mixto' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/actividad/${actividad.id}`} className={boton.secundario}>
            <ExternalLink aria-hidden="true" className="size-4" /> Vista pública
          </Link>
          <Link to={`/org/actividad/${actividad.id}/editar`} className={boton.secundario}>Editar</Link>
          <button type="button" onClick={exportar} className={boton.secundario}>
            <Download aria-hidden="true" className="size-4" /> CSV
          </button>
        </div>
      </div>

      {/* Resumen en cifras: todo calculado de las inscripciones cargadas. */}
      <dl className={`${tarjeta} mt-5 grid grid-cols-2 divide-rule sm:grid-cols-4 sm:divide-x`}>
        {[
          ['Inscritos', `${actividad.inscritos} de ${actividad.cupo}`],
          ['En la bolsa', String(bolsa.length)],
          ['Equipos', porEquipos ? String(equipos.length) : '—'],
          ['Asistieron', String(asistieron)],
        ].map(([etiqueta, valor]) => (
          <div key={etiqueta} className="px-4 py-3">
            <dt className="text-[13px] text-muted">{etiqueta}</dt>
            <dd className="num mt-0.5 text-xl font-semibold">{valor}</dd>
          </div>
        ))}
      </dl>

      {/* Estado de la actividad */}
      <section aria-labelledby="titulo-estado" className="mt-6">
        <h2 id="titulo-estado" className="text-lg font-semibold">Estado</h2>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Cambiar estado">
          {ESTADOS.map((estado) => (
            <button
              key={estado}
              type="button"
              disabled={ocupado || actividad.estado === estado}
              aria-pressed={actividad.estado === estado}
              onClick={() => {
                if (estado === 'finalizada' && !window.confirm('¿Finalizar la actividad? Sus puntos pasarán al ranking.')) return
                void hacer(() => cambiarEstadoActividad(actividad.id, estado), `Estado: ${etiquetaEstado[estado]}.`)
              }}
              className={`min-h-11 rounded-[6px] border px-3 text-[15px] font-medium transition-colors ${
                actividad.estado === estado
                  ? 'border-accent bg-accent-soft text-accent-ink'
                  : 'border-control bg-surface text-ink hover:bg-raised'
              }`}
            >
              {etiquetaEstado[estado]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-muted">
          Los puntos solo cuentan en el ranking cuando la actividad está finalizada y la persona tiene asistencia.
        </p>
      </section>

      <div className="sticky top-14 z-10 mt-4 empty:hidden" aria-live="polite">
        {aviso && <Mensaje tono={aviso.tono}>{aviso.texto}</Mensaje>}
      </div>

      {porEquipos ? (
        <>
          {/* Bolsa */}
          <section aria-labelledby="titulo-bolsa-org" className="mt-8">
            <h2 id="titulo-bolsa-org" className="text-lg font-semibold">
              Bolsa <span className="num font-normal text-muted">({bolsa.length})</span>
            </h2>
            {bolsa.length === 0 ? (
              <p className="mt-2 rounded-[8px] border border-dashed border-control px-4 py-3 text-[15px] text-muted">Nadie está esperando equipo.</p>
            ) : (
              <ul className={`${tarjeta} mt-3 divide-y divide-rule px-4`}>
                {bolsa.map((ins) => {
                  const conEspacio = equipos.filter((e) => miembrosDe(e.id).length < actividad.tamano_equipo)
                  const elegido = destino[ins.id] ?? ''
                  return (
                    filaPersona({
                      ins,
                      extra: (
                        <form
                          className="flex w-full gap-2 sm:w-auto"
                          onSubmit={(e: FormEvent) => {
                            e.preventDefault()
                            const equipo = equipos.find((x) => x.id === elegido)
                            if (equipo) void hacer(() => asignarAEquipo(ins.id, equipo.id), `${ins.participante.alias} pasó a ${equipo.nombre}.`)
                          }}
                        >
                          <label htmlFor={`destino-${ins.id}`} className="sr-only">Equipo para {ins.participante.alias}</label>
                          <select
                            id={`destino-${ins.id}`}
                            className="min-h-11 min-w-0 flex-1 rounded-[6px] border border-control bg-surface px-2 text-[15px] sm:w-48"
                            value={elegido}
                            onChange={(e) => setDestino((d) => ({ ...d, [ins.id]: e.target.value }))}
                          >
                            <option value="">Elegir equipo…</option>
                            {equipos.map((e) => {
                              const n = miembrosDe(e.id).length
                              return (
                                <option key={e.id} value={e.id} disabled={!conEspacio.includes(e)}>
                                  {e.nombre} ({n}/{actividad.tamano_equipo}{n >= actividad.tamano_equipo ? ', lleno' : ''})
                                </option>
                              )
                            })}
                          </select>
                          <button type="submit" disabled={ocupado || !elegido} className={`${boton.primario} flex-none`}>Asignar</button>
                        </form>
                      ),
                    })
                  )
                })}
              </ul>
            )}
          </section>

          {/* Equipos */}
          <section aria-labelledby="titulo-equipos-org" className="mt-8">
            <h2 id="titulo-equipos-org" className="text-lg font-semibold">
              Equipos <span className="num font-normal text-muted">({equipos.length})</span>
            </h2>
            <p className="mt-1 text-[13px] text-muted">Marca la casilla de cada integrante que asistió. El puesto se aplica a todo el equipo.</p>
            <div className="mt-3 space-y-3">
              {equipos.map((e) => {
                const miembros = miembrosDe(e.id)
                return (
                  <section key={e.id} aria-label={`Equipo ${e.nombre}`} className={`${tarjeta} px-4 pt-3 pb-1`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold">
                          {e.nombre} <span className="num ml-1 text-[13px] font-normal text-muted">código {e.codigo_invitacion}</span>
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <AsientosEquipo miembros={miembros.length} tamano={actividad.tamano_equipo} />
                          {actividad.requiere_mixto && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.declara_cumple_mixto ? 'bg-positive-bg text-positive-ink' : 'bg-warning-bg text-warning-ink'}`}>
                              {e.declara_cumple_mixto ? 'Mixto declarado' : 'Mixto sin declarar'}
                            </span>
                          )}
                        </div>
                      </div>
                      {selectPosicion({ etiqueta: e.nombre, ganador: { equipo_id: e.id }, actual: posicionDe((r) => r.equipo_id === e.id) })}
                    </div>
                    {miembros.length === 0 ? (
                      <p className="py-3 text-[15px] text-muted">Sin integrantes.</p>
                    ) : (
                      <ul className="mt-1 divide-y divide-rule">
                        {miembros.map((ins) => (
                          filaPersona({
                            ins,
                            extra: (
                              <button type="button" disabled={ocupado} onClick={() => void hacer(() => devolverABolsa(ins.id), `${ins.participante.alias} volvió a la bolsa.`)} className={`${boton.texto} text-sm`}>
                                A la bolsa
                              </button>
                            ),
                          })
                        ))}
                      </ul>
                    )}
                    <div className="flex flex-wrap gap-x-4 border-t border-rule py-1">
                      {miembros.length > 0 && (
                        <button type="button" disabled={ocupado} onClick={() => void hacer(() => marcarAsistenciaVarias(miembros.map((m) => m.id), true), `Asistencia marcada para ${e.nombre}.`)} className={`${boton.texto} text-sm`}>
                          Todos asistieron
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() => {
                          if (window.confirm(`¿Eliminar el equipo ${e.nombre}? Sus integrantes vuelven a la bolsa.`)) void hacer(() => eliminarEquipo(e.id), `Se eliminó ${e.nombre}.`)
                        }}
                        className={`${boton.texto} text-sm text-negative`}
                      >
                        Eliminar equipo
                      </button>
                    </div>
                  </section>
                )
              })}
            </div>
            <form
              className={`${tarjeta} mt-3 flex flex-wrap items-end gap-2 p-4`}
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                void hacer(() => crearEquipoOrg(actividad.id, nombreEquipo), `Equipo ${nombreEquipo.trim()} creado.`).then(() => setNombreEquipo(''))
              }}
            >
              <div className="min-w-0 flex-1">
                <label htmlFor="nuevo-equipo" className={campo.etiqueta}>Nuevo equipo (para armarlo con gente de la bolsa)</label>
                <input id="nuevo-equipo" className={campo.input} value={nombreEquipo} onChange={(e) => setNombreEquipo(e.target.value)} minLength={2} maxLength={40} required />
              </div>
              <button type="submit" disabled={ocupado} className={boton.secundario}>Crear equipo</button>
            </form>
          </section>
        </>
      ) : (
        <section aria-labelledby="titulo-inscritos-org" className="mt-8">
          <h2 id="titulo-inscritos-org" className="text-lg font-semibold">
            Inscritos <span className="num font-normal text-muted">({inscripciones.length})</span>
          </h2>
          {inscripciones.length === 0 ? (
            <p className="mt-2 rounded-[8px] border border-dashed border-control px-4 py-3 text-[15px] text-muted">Todavía no hay inscritos.</p>
          ) : (
            <ul className={`${tarjeta} mt-3 divide-y divide-rule px-4`}>
              {inscripciones.map((ins) => (
                filaPersona({
                  ins,
                  extra: (
                    <div className="flex items-center gap-3">
                      {selectPosicion({ etiqueta: ins.participante.alias, ganador: { participante_id: ins.participante_id }, actual: posicionDe((r) => r.participante_id === ins.participante_id) })}
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() => {
                          if (window.confirm(`¿Quitar la inscripción de ${ins.participante.alias}?`)) void hacer(() => eliminarInscripcion(ins.id), 'Inscripción eliminada.')
                        }}
                        className={`${boton.texto} text-sm text-negative`}
                      >
                        Quitar
                      </button>
                    </div>
                  ),
                })
              ))}
            </ul>
          )}
        </section>
      )}

      {actividad.estado === 'finalizada' && (
        <p className="mt-8 text-[15px]">
          <Link to={`/org/actividad/${actividad.id}/resumen`} className={boton.primario}>Publicar resumen</Link>
        </p>
      )}
    </article>
  )
}
