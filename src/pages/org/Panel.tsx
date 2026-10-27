import { Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { boton, campo, tarjeta } from '../../components/estilos'
import { ErrorCarga, Esqueleto, Mensaje } from '../../components/Mensaje'
import { useCarga } from '../../hooks/useCarga'
import { eliminarTemporada, encuestaEstaAbierta, guardarTemporada, listarActividades, listarEncuestas, listarTemporadas } from '../../lib/api'
import { etiquetaEstado, fechaHora } from '../../lib/formato'
import type { Temporada } from '../../types'

// Panel del organizador: temporadas (CRUD) y, para la temporada elegida,
// sus actividades y encuestas con accesos a gestionar y editar.
export default function Panel() {
  const temporadas = useCarga(listarTemporadas, [])
  const [temporadaId, setTemporadaId] = useState('')
  const [editando, setEditando] = useState<Partial<Temporada> | null>(null)
  const [aviso, setAviso] = useState<{ tono: 'exito' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    if (!temporadaId && temporadas.datos?.length) {
      setTemporadaId((temporadas.datos.find((t) => t.activa) ?? temporadas.datos[0]).id)
    }
  }, [temporadas.datos, temporadaId])

  const contenido = useCarga(
    async () => (temporadaId ? { actividades: await listarActividades(temporadaId), encuestas: await listarEncuestas(temporadaId) } : null),
    [temporadaId],
  )

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!editando) return
    setAviso(null)
    try {
      const guardada = await guardarTemporada({
        id: editando.id,
        nombre: editando.nombre ?? '',
        fecha_inicio: editando.fecha_inicio ?? '',
        fecha_fin: editando.fecha_fin ?? '',
        activa: editando.activa ?? false,
      })
      setEditando(null)
      setAviso({ tono: 'exito', texto: `Temporada "${guardada.nombre}" guardada.` })
      setTemporadaId(guardada.id)
      await temporadas.recargar()
    } catch (err) {
      const texto = err instanceof Error ? err.message : 'No se pudo guardar.'
      // El índice temporadas_una_activa impide dos temporadas activas a la vez.
      setAviso({ tono: 'error', texto: texto === 'Ese dato ya existe.' ? 'Ya hay otra temporada activa o con ese nombre. Desactiva la otra primero.' : texto })
    }
  }

  async function borrar(t: Temporada) {
    if (!window.confirm(`¿Eliminar "${t.nombre}"? Se borran también sus actividades, encuestas e inscripciones.`)) return
    try {
      await eliminarTemporada(t.id)
      setTemporadaId('')
      setAviso({ tono: 'exito', texto: 'Temporada eliminada.' })
      await temporadas.recargar()
    } catch (err) {
      setAviso({ tono: 'error', texto: err instanceof Error ? err.message : 'No se pudo eliminar.' })
    }
  }

  if (temporadas.cargando && !temporadas.datos) return <Esqueleto filas={3} />
  if (temporadas.error) return <ErrorCarga mensaje={temporadas.error} reintentar={temporadas.recargar} />

  const actual = temporadas.datos?.find((t) => t.id === temporadaId)

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-[-0.02em] md:text-[28px]">Panel del organizador</h1>
      <p className="mt-1 text-[15px] text-muted">Temporadas, actividades y encuestas.</p>

      {aviso && <div className="mt-4"><Mensaje tono={aviso.tono}>{aviso.texto}</Mensaje></div>}

      {/* Temporadas */}
      <section aria-labelledby="titulo-temporadas" className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-56">
            <label htmlFor="temporada-panel" className={campo.etiqueta}>Temporada</label>
            <select id="temporada-panel" className={campo.input} value={temporadaId} onChange={(e) => setTemporadaId(e.target.value)}>
              {temporadas.datos?.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}{t.activa ? ' (activa)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {actual && <button type="button" className={boton.secundario} onClick={() => setEditando(actual)}>Editar</button>}
            {actual && <button type="button" className={`${boton.secundario} text-negative`} onClick={() => borrar(actual)}>Eliminar</button>}
            <button type="button" className={boton.secundario} onClick={() => setEditando({ activa: false })}>
              <Plus aria-hidden="true" className="size-4" /> Temporada
            </button>
          </div>
        </div>
        <h2 id="titulo-temporadas" className="sr-only">Temporadas</h2>

        {editando && (
          <form onSubmit={guardar} className={`${tarjeta} mt-4 grid gap-4 p-4 sm:grid-cols-2`}>
            <div className="sm:col-span-2">
              <label htmlFor="t-nombre" className={campo.etiqueta}>Nombre</label>
              <input id="t-nombre" required className={campo.input} value={editando.nombre ?? ''} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} />
            </div>
            <div>
              <label htmlFor="t-inicio" className={campo.etiqueta}>Inicio</label>
              <input id="t-inicio" type="date" required className={campo.input} value={editando.fecha_inicio ?? ''} onChange={(e) => setEditando({ ...editando, fecha_inicio: e.target.value })} />
            </div>
            <div>
              <label htmlFor="t-fin" className={campo.etiqueta}>Fin</label>
              <input id="t-fin" type="date" required className={campo.input} value={editando.fecha_fin ?? ''} onChange={(e) => setEditando({ ...editando, fecha_fin: e.target.value })} />
            </div>
            <label className="flex items-center gap-3 sm:col-span-2">
              <input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={editando.activa ?? false} onChange={(e) => setEditando({ ...editando, activa: e.target.checked })} />
              <span className="text-[15px]">Temporada activa (la que ve el público; solo puede haber una)</span>
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className={boton.primario}>Guardar temporada</button>
              <button type="button" className={boton.secundario} onClick={() => setEditando(null)}>Cancelar</button>
            </div>
          </form>
        )}
      </section>

      {contenido.error && <div className="mt-6"><ErrorCarga mensaje={contenido.error} reintentar={contenido.recargar} /></div>}

      {/* Actividades */}
      <section aria-labelledby="titulo-actividades-org" className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 id="titulo-actividades-org" className="text-lg font-semibold">
            Actividades <span className="num font-normal text-muted">({contenido.datos?.actividades.length ?? 0})</span>
          </h2>
          {temporadaId && (
            <Link to={`/org/actividad/nueva?temporada=${temporadaId}`} className={boton.primario}>
              <Plus aria-hidden="true" className="size-4" /> Actividad
            </Link>
          )}
        </div>
        {contenido.cargando && !contenido.datos ? (
          <div className="mt-3"><Esqueleto filas={3} alto="h-14" /></div>
        ) : contenido.datos?.actividades.length ? (
          <ul className={`${tarjeta} mt-3 divide-y divide-rule`}>
            {contenido.datos.actividades.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/org/actividad/${a.id}`} className="font-semibold text-ink hover:text-accent">{a.titulo}</Link>
                  <p className="num text-[13px] text-muted">
                    {fechaHora(a.fecha_hora)} · {a.inscritos}/{a.cupo} inscritos{a.en_bolsa ? ` · ${a.en_bolsa} en bolsa` : ''}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${a.estado === 'abierta' ? 'bg-positive-bg text-positive-ink' : a.estado === 'borrador' ? 'bg-warning-bg text-warning-ink' : 'bg-raised text-muted'}`}>
                  {etiquetaEstado[a.estado]}
                </span>
                <div className="flex gap-1">
                  <Link to={`/org/actividad/${a.id}`} className={`${boton.texto} text-sm`}>Gestionar</Link>
                  <Link to={`/org/actividad/${a.id}/editar`} className={`${boton.texto} text-sm`}>Editar</Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-[8px] border border-dashed border-control px-4 py-3 text-[15px] text-muted">Esta temporada no tiene actividades.</p>
        )}
      </section>

      {/* Encuestas */}
      <section aria-labelledby="titulo-encuestas-org" className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 id="titulo-encuestas-org" className="text-lg font-semibold">
            Encuestas <span className="num font-normal text-muted">({contenido.datos?.encuestas.length ?? 0})</span>
          </h2>
          {temporadaId && (
            <Link to={`/org/encuesta/nueva?temporada=${temporadaId}`} className={boton.secundario}>
              <Plus aria-hidden="true" className="size-4" /> Encuesta
            </Link>
          )}
        </div>
        {contenido.datos?.encuestas.length ? (
          <ul className={`${tarjeta} mt-3 divide-y divide-rule`}>
            {contenido.datos.encuestas.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link to={`/org/encuesta/${e.id}`} className="min-w-0 truncate font-semibold hover:text-accent">{e.titulo}</Link>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${encuestaEstaAbierta(e) ? 'bg-positive-bg text-positive-ink' : 'bg-raised text-muted'}`}>
                  {encuestaEstaAbierta(e) ? 'Abierta' : 'Cerrada'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-[8px] border border-dashed border-control px-4 py-3 text-[15px] text-muted">Esta temporada no tiene encuestas.</p>
        )}
      </section>
    </div>
  )
}
