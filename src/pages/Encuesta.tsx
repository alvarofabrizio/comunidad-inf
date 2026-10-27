import { useState, type FormEvent } from 'react'
import { BarraResultado } from '../components/BarraResultado'
import { boton, tarjeta } from '../components/estilos'
import { ErrorCarga, Esqueleto, Mensaje } from '../components/Mensaje'
import { RequiereRegistro } from '../components/RequiereRegistro'
import { useCarga } from '../hooks/useCarga'
import { useSesion } from '../hooks/useSesion'
import { encuestaEstaAbierta, obtenerEncuestaActual, obtenerMisVotos, obtenerResultadosEncuesta, votar } from '../lib/api'
import { etiquetaCategoria, fechaLarga, ordenCategorias, plural } from '../lib/formato'

export default function Encuesta() {
  const { perfil } = useSesion()
  const { datos, error, cargando, recargar } = useCarga(async () => {
    const encuesta = await obtenerEncuestaActual()
    if (!encuesta) return null
    const [resultados, misVotos] = await Promise.all([
      obtenerResultadosEncuesta(encuesta.id),
      perfil ? obtenerMisVotos(encuesta.id) : Promise.resolve([]),
    ])
    return { encuesta, resultados, misVotos }
  }, [perfil?.id])

  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [enviando, setEnviando] = useState(false)
  const [errorVoto, setErrorVoto] = useState<string | null>(null)
  const [recienVoto, setRecienVoto] = useState(false)

  if (cargando && !datos) return <Esqueleto filas={4} alto="h-24" />
  if (error) return <ErrorCarga mensaje={error} reintentar={recargar} />
  if (!datos) {
    return (
      <section>
        <h1 className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">Encuesta</h1>
        <p className="mt-2 text-[15px] text-muted">Todavía no hay encuestas publicadas.</p>
      </section>
    )
  }

  const { encuesta, resultados, misVotos } = datos
  const abierta = encuestaEstaAbierta(encuesta)
  const yaVoto = misVotos.length > 0
  const max = encuesta.max_votos_por_categoria
  const totalVotantes = resultados[0]?.total_votantes ?? 0
  const puedeVotar = abierta && !!perfil && !yaVoto
  const porCategoria = ordenCategorias
    .map((c) => ({
      categoria: c,
      opciones: encuesta.opciones.filter((o) => o.categoria === c).sort((a, b) => a.orden - b.orden),
    }))
    .filter((g) => g.opciones.length > 0)

  // Cuántas opciones lleva elegidas la persona en cada categoría (para el límite).
  const elegidasEn = (categoria: string) =>
    encuesta.opciones.filter((o) => o.categoria === categoria && seleccion.has(o.id)).length

  function alternar(id: string) {
    setSeleccion((actual) => {
      const nueva = new Set(actual)
      if (nueva.has(id)) nueva.delete(id)
      else nueva.add(id)
      return nueva
    })
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErrorVoto(null)
    if (seleccion.size === 0) {
      setErrorVoto('Elige al menos una opción.')
      return
    }
    setEnviando(true)
    try {
      await votar(encuesta.id, [...seleccion])
      setRecienVoto(true)
      setSeleccion(new Set())
      await recargar()
    } catch (err) {
      setErrorVoto(err instanceof Error ? err.message : 'No se pudo registrar tu voto.')
      await recargar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-encuesta">
      <h1 id="titulo-encuesta" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
        {encuesta.titulo}
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        {abierta
          ? `Abierta${encuesta.cierra_en ? ` hasta el ${fechaLarga(encuesta.cierra_en)}` : ''} · elige hasta ${plural(max, 'opción', 'opciones')} por categoría`
          : 'Encuesta cerrada: solo se muestran los resultados'}{' '}
        · <span className="num">{plural(totalVotantes, 'persona votó', 'personas votaron')}</span>
      </p>

      <div className="mt-6 space-y-4">
        {recienVoto && <Mensaje tono="exito">Gracias, tu voto quedó registrado.</Mensaje>}
        {yaVoto && !recienVoto && (
          <Mensaje tono="info">
            Ya votaste en esta encuesta. Tus elecciones:{' '}
            <strong className="font-semibold">
              {porCategoria
                .flatMap((g) => g.opciones)
                .filter((o) => misVotos.includes(o.id))
                .map((o) => o.texto)
                .join(', ')}
            </strong>
            .
          </Mensaje>
        )}
        {abierta && !perfil && <RequiereRegistro accion="votar" />}
      </div>

      {puedeVotar ? (
        <form onSubmit={enviar} className="mt-6 space-y-4">
          {porCategoria.map(({ categoria, opciones }) => {
            const elegidas = elegidasEn(categoria)
            return (
              <fieldset key={categoria} className={`${tarjeta} p-4`}>
                <legend className="sr-only">{etiquetaCategoria[categoria]}</legend>
                <div className="flex items-baseline justify-between gap-3" aria-hidden="true">
                  <h2 className="text-lg font-semibold">{etiquetaCategoria[categoria]}</h2>
                  <span className="num text-sm text-muted">
                    {elegidas} de {max}
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {opciones.map((o) => {
                    const marcada = seleccion.has(o.id)
                    const bloqueada = !marcada && elegidas >= max
                    return (
                      <li key={o.id}>
                        <label
                          className={`flex min-h-11 items-center gap-3 rounded-[6px] px-2 transition-colors ${
                            marcada ? 'bg-accent-soft text-accent-ink' : bloqueada ? 'text-muted' : 'hover:bg-raised'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={marcada}
                            disabled={bloqueada}
                            onChange={() => alternar(o.id)}
                            className="size-5 flex-none accent-[var(--color-accent)]"
                          />
                          <span className="text-[15px]">{o.texto}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
                {elegidas >= max && (
                  <p className="mt-2 text-[13px] text-muted" aria-live="polite">
                    Llegaste al máximo de esta categoría. Desmarca una para cambiarla.
                  </p>
                )}
              </fieldset>
            )
          })}
          {errorVoto && <Mensaje tono="error">{errorVoto}</Mensaje>}
          <button type="submit" disabled={enviando} className={`${boton.primario} w-full sm:w-auto`}>
            {enviando ? 'Enviando…' : `Enviar mi voto (${seleccion.size})`}
          </button>
        </form>
      ) : (
        errorVoto && <div className="mt-4"><Mensaje tono="error">{errorVoto}</Mensaje></div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Resultados</h2>
        <p className="mt-1 text-[13px] text-muted">
          El porcentaje es sobre el total de personas que votaron; como cada una puede elegir varias opciones, una
          categoría puede sumar más de 100 %.
        </p>
        <div className="mt-4 space-y-4">
          {porCategoria.map(({ categoria, opciones }) => (
            <section key={categoria} className={`${tarjeta} px-4 py-3`} aria-labelledby={`res-${categoria}`}>
              <h3 id={`res-${categoria}`} className="font-semibold">
                {etiquetaCategoria[categoria]}
              </h3>
              <ul className="mt-1 divide-y divide-rule">
                {[...opciones]
                  .map((o) => ({ o, r: resultados.find((r) => r.opcion_id === o.id) }))
                  .sort((a, b) => (b.r?.votos ?? 0) - (a.r?.votos ?? 0))
                  .map(({ o, r }) => (
                    <BarraResultado
                      key={o.id}
                      texto={o.texto}
                      votos={r?.votos ?? 0}
                      porcentaje={r?.porcentaje ?? 0}
                      esMiVoto={misVotos.includes(o.id)}
                    />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
