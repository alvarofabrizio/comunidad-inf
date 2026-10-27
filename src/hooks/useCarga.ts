import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

/**
 * Carga datos asíncronos de api.ts con estados de carga y error.
 * `recargar()` vuelve a pedir los datos sin vaciar los que ya se ven en pantalla.
 */
export function useCarga<T>(cargar: () => Promise<T>, deps: DependencyList) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const vigente = useRef(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ejecutar = useCallback(cargar, deps)

  const recargar = useCallback(async () => {
    const id = ++vigente.current
    setCargando(true)
    try {
      const resultado = await ejecutar()
      // Si llegó una respuesta más nueva mientras tanto, se descarta esta.
      if (id === vigente.current) {
        setDatos(resultado)
        setError(null)
      }
    } catch (e) {
      if (id === vigente.current) setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.')
    } finally {
      if (id === vigente.current) setCargando(false)
    }
  }, [ejecutar])

  useEffect(() => {
    void recargar()
  }, [recargar])

  return { datos, error, cargando, recargar }
}
