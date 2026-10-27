import { useEffect, useRef, type ReactNode } from 'react'

// Tarjeta con píxeles, inspirada en "Pixel Card" de React Bits (reactbits.dev, de David Haz).
// Versión propia, sin dependencias: al pasar el mouse o enfocar con el teclado,
// una cuadrícula de píxeles verdes y lima se enciende desde el centro hacia afuera
// (el damero pixelado de los afiches de la AAII) y se apaga al salir.
// El contenido queda siempre encima y legible; con prefers-reduced-motion no anima.
const COLORES = ['#cfe8b6', '#a3e04b', '#e6f4d9']
const PASO = 8 // separación entre píxeles (px)

interface Pixel {
  x: number
  y: number
  color: string
  retraso: number // ms según la distancia al centro
  tamano: number
}

export function PixelCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const caja = useRef<HTMLDivElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)
  const pixeles = useRef<Pixel[]>([])
  const estado = useRef<{ encendido: boolean; desde: number; cuadro: number }>({ encendido: false, desde: 0, cuadro: 0 })

  useEffect(() => {
    const contenedor = caja.current
    const canvas = lienzo.current
    if (!contenedor || !canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const preparar = () => {
      const { width, height } = contenedor.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cx = width / 2
      const cy = height / 2
      const lista: Pixel[] = []
      for (let x = PASO / 2; x < width; x += PASO) {
        for (let y = PASO / 2; y < height; y += PASO) {
          // Solo un tercio de las celdas tiene píxel: textura, no relleno.
          if (Math.random() > 0.33) continue
          lista.push({
            x,
            y,
            color: COLORES[Math.floor(Math.random() * COLORES.length)],
            retraso: Math.hypot(x - cx, y - cy) * 1.6,
            tamano: 2 + Math.random() * 2,
          })
        }
      }
      pixeles.current = lista
    }

    const dibujar = (ahora: number) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { encendido, desde } = estado.current
      const transcurrido = ahora - desde
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let activos = 0
      for (const p of pixeles.current) {
        // Encendiendo: crece desde el centro. Apagando: se encoge en orden inverso.
        const t = encendido ? (transcurrido - p.retraso) / 260 : 1 - (transcurrido - p.retraso * 0.4) / 200
        const k = Math.max(0, Math.min(1, t))
        if (k <= 0) continue
        activos++
        const parpadeo = encendido && k === 1 ? 0.75 + 0.25 * Math.sin(ahora / 180 + p.x) : 1
        const s = p.tamano * k * parpadeo
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s)
      }
      // Sigue animando mientras esté encendido (parpadeo) o queden píxeles apagándose.
      if (encendido || activos > 0) estado.current.cuadro = requestAnimationFrame(dibujar)
    }

    const encender = (valor: boolean) => {
      if (estado.current.encendido === valor) return
      if (valor && pixeles.current.length === 0) preparar()
      estado.current.encendido = valor
      estado.current.desde = performance.now()
      cancelAnimationFrame(estado.current.cuadro)
      estado.current.cuadro = requestAnimationFrame(dibujar)
    }

    const alEntrar = () => encender(true)
    const alSalir = () => encender(false)
    const alSalirFoco = (e: FocusEvent) => {
      if (!contenedor.contains(e.relatedTarget as Node)) encender(false)
    }
    const alRedimensionar = () => {
      pixeles.current = []
    }
    contenedor.addEventListener('pointerenter', alEntrar)
    contenedor.addEventListener('pointerleave', alSalir)
    contenedor.addEventListener('focusin', alEntrar)
    contenedor.addEventListener('focusout', alSalirFoco)
    window.addEventListener('resize', alRedimensionar)
    return () => {
      cancelAnimationFrame(estado.current.cuadro)
      contenedor.removeEventListener('pointerenter', alEntrar)
      contenedor.removeEventListener('pointerleave', alSalir)
      contenedor.removeEventListener('focusin', alEntrar)
      contenedor.removeEventListener('focusout', alSalirFoco)
      window.removeEventListener('resize', alRedimensionar)
    }
  }, [])

  return (
    <div ref={caja} className={`relative isolate overflow-hidden ${className}`}>
      <canvas ref={lienzo} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full" />
      {children}
    </div>
  )
}
