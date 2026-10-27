import { Share2 } from 'lucide-react'
import { useState } from 'react'
import { fechaHora } from '../lib/formato'
import type { Actividad } from '../types'

/** Texto prearmado para WhatsApp. */
export function textoCompartir(actividad: Pick<Actividad, 'titulo' | 'fecha_hora' | 'lugar' | 'modalidad' | 'tamano_equipo'>, enlace: string) {
  const donde = actividad.modalidad === 'virtual' ? 'virtual' : `en ${actividad.lugar}`
  const como = actividad.tamano_equipo > 1 ? 'Inscríbete con tu equipo o solo, te ayudamos a encontrar uno' : 'Inscríbete'
  return `¡Súmate! ${actividad.titulo}, ${fechaHora(actividad.fecha_hora)}, ${donde}. ${como} y suma puntos en el ranking de Comunidad INF: ${enlace}`
}

/**
 * Compartir (P1-1): copia el enlace de la actividad y abre WhatsApp con un texto prearmado.
 * Es un enlace <a> real (no window.open) para que el celular no lo bloquee como ventana emergente;
 * al tocarlo también se copia el enlace al portapapeles.
 */
export function BotonCompartir({ actividad, compacto = false }: { actividad: Actividad; compacto?: boolean }) {
  const [copiado, setCopiado] = useState(false)
  const enlace = `${window.location.origin}/actividad/${actividad.id}`
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(textoCompartir(actividad, enlace))}`

  return (
    <a
      href={whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        navigator.clipboard?.writeText(enlace).then(
          () => {
            setCopiado(true)
            setTimeout(() => setCopiado(false), 2500)
          },
          () => undefined,
        )
      }}
      className={
        compacto
          ? 'inline-flex size-11 flex-none items-center justify-center rounded-[6px] text-muted transition-colors hover:bg-raised hover:text-ink'
          : 'inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-control bg-surface px-4 text-[15px] font-medium text-ink transition-colors hover:bg-raised'
      }
      aria-label={compacto ? `Compartir ${actividad.titulo} por WhatsApp` : undefined}
    >
      <Share2 aria-hidden="true" className="size-4" />
      {!compacto && <span>{copiado ? 'Enlace copiado' : 'Compartir'}</span>}
      <span className="sr-only" aria-live="polite">{compacto && copiado ? 'Enlace copiado' : ''}</span>
    </a>
  )
}
