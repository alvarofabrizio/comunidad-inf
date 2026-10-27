import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { tarjeta } from '../components/estilos'
import { ErrorCarga, Esqueleto } from '../components/Mensaje'
import { useCarga } from '../hooks/useCarga'
import { listarResumenes } from '../lib/api'
import { etiquetaTipo, fechaLarga } from '../lib/formato'

// Resúmenes publicados (P1-3): para que quien no fue se entere de que pasó.
export default function Resumenes() {
  const { datos, error, cargando, recargar } = useCarga(listarResumenes, [])

  return (
    <section aria-labelledby="titulo-resumenes">
      <h1 id="titulo-resumenes" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
        Resúmenes
      </h1>
      <p className="mt-2 text-[15px] text-muted">Lo que pasó en las actividades de la temporada.</p>

      <div className="mt-6">
        {error ? (
          <ErrorCarga mensaje={error} reintentar={recargar} />
        ) : cargando && !datos ? (
          <Esqueleto filas={2} alto="h-40" />
        ) : datos?.length ? (
          <ul className="space-y-4">
            {datos.map((r) => (
              <li key={r.id}>
                <article aria-labelledby={`res-${r.id}`} className={`${tarjeta} overflow-hidden`}>
                  {r.imagen_url && r.imagen_autorizada && (
                    <img src={r.imagen_url} alt={`Foto de ${r.actividad.titulo}`} loading="lazy" className="aspect-[16/9] w-full object-cover" />
                  )}
                  <div className="p-4">
                    <p className="text-[13px] text-muted">
                      {etiquetaTipo[r.actividad.tipo]} · {fechaLarga(r.actividad.fecha_hora)}
                    </p>
                    <h2 id={`res-${r.id}`} className="mt-0.5 text-lg font-semibold">
                      <Link to={`/actividad/${r.actividad.id}`} className="hover:text-accent">{r.actividad.titulo}</Link>
                    </h2>
                    <p className="mt-2 text-base leading-relaxed">{r.texto}</p>
                    {r.ganadores && (
                      <p className="mt-3 flex items-start gap-2 rounded-[6px] bg-accent-soft px-3 py-2 text-[15px] text-accent-ink">
                        <Trophy aria-hidden="true" className="mt-0.5 size-4 flex-none" />
                        <span><span className="sr-only">Ganadores: </span>{r.ganadores}</span>
                      </p>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[8px] border border-dashed border-control px-4 py-3 text-[15px] text-muted">
            Todavía no hay resúmenes publicados.
          </p>
        )}
      </div>
    </section>
  )
}
