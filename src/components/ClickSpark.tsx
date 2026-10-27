import { useCallback, useEffect, useRef, type ReactNode } from 'react'

// Chispas al tocar, inspirado en "Click Spark" de React Bits (reactbits.dev, de David Haz).
// Versión propia, sin dependencias: un <canvas> encima del botón dibuja líneas que
// salen del punto tocado y se apagan en ~400 ms. Da una confirmación inmediata al
// tocar acciones importantes (votar, inscribirse) incluso antes de que responda el servidor.
// Con prefers-reduced-motion no dibuja nada.
interface Chispa {
  x: number
  y: number
  angulo: number
  inicio: number
}

const MARGEN = 28 // espacio extra alrededor del botón para que las chispas no se corten

export function ClickSpark({
  children,
  color = 'var(--color-lima)',
  cantidad = 8,
  distancia = 22,
  duracion = 420,
  className = '',
}: {
  children: ReactNode
  color?: string
  cantidad?: number
  distancia?: number
  duracion?: number
  className?: string
}) {
  const contenedor = useRef<HTMLSpanElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)
  const chispas = useRef<Chispa[]>([])
  const cuadro = useRef(0)

  useEffect(() => () => cancelAnimationFrame(cuadro.current), [])

  const dibujar = useCallback(
    (ahora: number) => {
      const canvas = lienzo.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // El color puede venir como variable CSS: se resuelve en el momento de dibujar.
      ctx.strokeStyle = color.startsWith('var(')
        ? getComputedStyle(canvas).getPropertyValue(color.slice(4, -1)).trim() || '#a3e04b'
        : color
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      chispas.current = chispas.current.filter((c) => ahora - c.inicio < duracion)
      for (const c of chispas.current) {
        const t = (ahora - c.inicio) / duracion
        const avance = 1 - Math.pow(1 - t, 3) // ease-out
        const largo = 10 * (1 - avance)
        const r = avance * distancia
        const x1 = c.x + r * Math.cos(c.angulo)
        const y1 = c.y + r * Math.sin(c.angulo)
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x1 + largo * Math.cos(c.angulo), y1 + largo * Math.sin(c.angulo))
        ctx.stroke()
      }
      if (chispas.current.length) cuadro.current = requestAnimationFrame(dibujar)
    },
    [color, distancia, duracion],
  )

  function alTocar(e: React.PointerEvent) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const caja = contenedor.current?.getBoundingClientRect()
    const canvas = lienzo.current
    if (!caja || !canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = (caja.width + MARGEN * 2) * dpr
    canvas.height = (caja.height + MARGEN * 2) * dpr
    canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
    const x = e.clientX - caja.left + MARGEN
    const y = e.clientY - caja.top + MARGEN
    const inicio = performance.now()
    for (let i = 0; i < cantidad; i++) chispas.current.push({ x, y, angulo: (2 * Math.PI * i) / cantidad, inicio })
    cancelAnimationFrame(cuadro.current)
    cuadro.current = requestAnimationFrame(dibujar)
  }

  return (
    <span ref={contenedor} onPointerDown={alTocar} className={`relative inline-flex ${className}`}>
      {children}
      <canvas
        ref={lienzo}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ inset: -MARGEN, width: `calc(100% + ${MARGEN * 2}px)`, height: `calc(100% + ${MARGEN * 2}px)` }}
      />
    </span>
  )
}
