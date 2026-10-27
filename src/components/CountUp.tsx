import { useEffect, useRef, useState } from 'react'

// Contador animado inspirado en "Count Up" de React Bits (reactbits.dev, de David Haz).
// El original necesita el paquete `motion`; esta versión usa requestAnimationFrame
// para no sumar dependencias (requisito: app liviana en redes móviles).
//
// Decisión de robustez: el estado arranca en el valor FINAL. La animación solo
// lo baja a `from` en el primer cuadro dibujado, así que si el navegador no dibuja
// cuadros (pestaña en segundo plano, ahorro de batería) se ve el número correcto.
// Respeta prefers-reduced-motion: en ese caso no anima.
interface Props {
  to: number
  from?: number
  duration?: number // segundos
  className?: string
}

const facilidad = (t: number) => 1 - Math.pow(1 - t, 3) // ease-out cúbico

export function CountUp({ to, from = 0, duration = 0.9, className }: Props) {
  const [valor, setValor] = useState(to)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setValor(to)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cuadro = 0
    let inicio: number | null = null
    const paso = (ahora: number) => {
      inicio ??= ahora
      const t = Math.min(1, (ahora - inicio) / (duration * 1000))
      setValor(Math.round(from + (to - from) * facilidad(t)))
      if (t < 1) cuadro = requestAnimationFrame(paso)
    }
    // Empieza cuando el número entra en pantalla (como trigger="view" del original).
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) {
        observador.disconnect()
        cuadro = requestAnimationFrame(paso)
      }
    })
    if (ref.current) observador.observe(ref.current)
    const alOcultar = () => {
      cancelAnimationFrame(cuadro)
      setValor(to)
    }
    document.addEventListener('visibilitychange', alOcultar)
    return () => {
      observador.disconnect()
      cancelAnimationFrame(cuadro)
      document.removeEventListener('visibilitychange', alOcultar)
    }
  }, [to, from, duration])

  return (
    <span ref={ref} className={`num ${className ?? ''}`}>
      {/* El lector de pantalla lee siempre el valor final, no cada paso. */}
      <span aria-hidden="true">{valor}</span>
      <span className="sr-only">{to}</span>
    </span>
  )
}
