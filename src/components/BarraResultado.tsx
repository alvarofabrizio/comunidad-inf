import { Check } from 'lucide-react'

// Una opción de la encuesta: texto, votos y % sobre el total de votantes.
// La barra usa la pista pálida del acento y el acento lleno para la parte votada.
export function BarraResultado({
  texto,
  votos,
  porcentaje,
  esMiVoto,
}: {
  texto: string
  votos: number
  porcentaje: number
  esMiVoto: boolean
}) {
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex flex-wrap items-center gap-1.5 text-[15px] text-ink">
          {texto}
          {esMiVoto && (
            <span className="inline-flex flex-none items-center gap-0.5 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium whitespace-nowrap text-accent-ink">
              <Check aria-hidden="true" className="size-3" /> Tu voto
            </span>
          )}
        </span>
        <span className="num flex-none text-sm text-muted">
          <span className="font-semibold text-ink">{votos}</span> {votos === 1 ? 'voto' : 'votos'} ·{' '}
          {Number(porcentaje).toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-accent-track" aria-hidden="true">
        <div
          className="h-full origin-left rounded-full bg-accent transition-transform duration-700 ease-out"
          style={{ transform: `scaleX(${Math.min(100, Number(porcentaje)) / 100})` }}
        />
      </div>
    </li>
  )
}
