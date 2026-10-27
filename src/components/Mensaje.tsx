import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import type { ReactNode } from 'react'

type Tono = 'error' | 'exito' | 'info'

const estilos: Record<Tono, string> = {
  error: 'border-negative-bg bg-negative-bg text-negative-ink',
  exito: 'border-positive-bg bg-positive-bg text-positive-ink',
  info: 'border-warning-border bg-warning-bg text-warning-ink',
}

/** Aviso dentro del bloque que lo origina. Los errores se anuncian a lectores de pantalla. */
export function Mensaje({ tono, children }: { tono: Tono; children: ReactNode }) {
  const Icono = tono === 'error' ? AlertCircle : tono === 'exito' ? CheckCircle2 : Info
  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-[8px] border px-3 py-2.5 text-[15px] ${estilos[tono]}`}
    >
      <Icono aria-hidden="true" className="mt-0.5 size-4 flex-none" />
      <div>{children}</div>
    </div>
  )
}

/** Error de carga con botón para reintentar. */
export function ErrorCarga({ mensaje, reintentar }: { mensaje: string; reintentar: () => void }) {
  return (
    <Mensaje tono="error">
      {mensaje}{' '}
      <button type="button" onClick={reintentar} className="font-semibold underline underline-offset-2">
        Reintentar
      </button>
    </Mensaje>
  )
}

/** Barras grises del tamaño real del contenido mientras carga (sin brillo animado). */
export function Esqueleto({ filas = 3, alto = 'h-16' }: { filas?: number; alto?: string }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className={`${alto} rounded-[8px] bg-raised`} />
      ))}
    </div>
  )
}
