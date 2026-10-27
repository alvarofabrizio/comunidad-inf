import { ChevronRight, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { diaMes, etiquetaTipo, fechaHora } from '../lib/formato'
import type { ActividadConCupo } from '../types'
import { BotonCompartir } from './BotonCompartir'

/**
 * Fila de actividad: bloque de fecha, etiqueta de tipo, título, lugar, lugares libres
 * y botón Compartir. El enlace y el botón van separados (un botón dentro de un
 * enlace no es HTML válido y confunde a los lectores de pantalla).
 */
export function TarjetaActividad({ actividad, compartir = true }: { actividad: ActividadConCupo; compartir?: boolean }) {
  const { dia, mes } = diaMes(actividad.fecha_hora)
  const lleno = actividad.lugares_libres <= 0
  return (
    <li className="flex items-center rounded-[8px] border border-border bg-surface transition-colors hover:border-control">
      <Link to={`/actividad/${actividad.id}`} className="group flex min-w-0 flex-1 items-center gap-3 p-3">
        <div className="flex w-12 flex-none flex-col items-center rounded-[6px] bg-accent-soft py-1.5 text-accent-ink">
          <span className="num text-xl leading-none font-semibold">{dia}</span>
          <span className="text-xs">{mes}</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-full bg-raised px-2 py-0.5 text-xs font-medium text-muted">
            {etiquetaTipo[actividad.tipo]}
            {actividad.juego_o_disciplina ? ` · ${actividad.juego_o_disciplina}` : ''}
          </span>
          <p className="mt-0.5 truncate text-base font-semibold text-ink">{actividad.titulo}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-muted">
            <span>{fechaHora(actividad.fecha_hora)}</span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin aria-hidden="true" className="size-3.5 flex-none" />
              <span className="truncate">{actividad.modalidad === 'virtual' ? 'Virtual' : actividad.lugar}</span>
            </span>
            {actividad.estado === 'abierta' && (
              <span className={`num inline-flex items-center gap-1 ${lleno ? 'font-medium text-negative' : ''}`}>
                <Users aria-hidden="true" className="size-3.5" />
                {lleno ? 'Cupo lleno' : `${actividad.lugares_libres} lugares libres`}
              </span>
            )}
            {actividad.estado === 'finalizada' && <span>Finalizada</span>}
          </p>
        </div>
        <ChevronRight aria-hidden="true" className="size-5 flex-none text-muted transition-transform group-hover:translate-x-0.5" />
      </Link>
      {compartir && (
        <div className="pr-2">
          <BotonCompartir actividad={actividad} compacto />
        </div>
      )}
    </li>
  )
}
