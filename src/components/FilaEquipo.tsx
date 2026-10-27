import type { ReactNode } from 'react'
import { AsientosEquipo } from './AsientosEquipo'
import type { EquipoPublico, InscripcionPublica } from '../types'

/** Un equipo: nombre, asientos ocupados/libres, integrantes (solo alias) y estado. */
export function FilaEquipo({
  equipo,
  miembros,
  requiereMixto,
  accion,
}: {
  equipo: EquipoPublico
  miembros: InscripcionPublica[]
  requiereMixto: boolean
  accion?: ReactNode
}) {
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{equipo.nombre}</p>
          <div className="mt-1">
            <AsientosEquipo miembros={equipo.miembros} tamano={equipo.tamano_equipo} />
          </div>
        </div>
        {accion}
      </div>
      <p className="mt-1.5 text-[13px] text-muted">
        {miembros.length > 0
          ? miembros.map((m) => (m.participante_id === equipo.capitan_id ? `${m.alias} (capitán)` : m.alias)).join(', ')
          : 'Sin integrantes todavía'}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {equipo.buscando_integrantes && equipo.lugares_libres > 0 && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium whitespace-nowrap text-accent-ink">
            Buscamos integrantes
          </span>
        )}
        {requiereMixto && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
              equipo.declara_cumple_mixto ? 'bg-positive-bg text-positive-ink' : 'bg-raised text-muted'
            }`}
          >
            {equipo.declara_cumple_mixto ? 'Mixto: declarado' : 'Mixto: falta declarar'}
          </span>
        )}
      </div>
    </li>
  )
}
