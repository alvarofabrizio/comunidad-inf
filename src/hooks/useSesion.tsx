import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { escucharSesion, obtenerMiPerfil, obtenerSesion } from '../lib/api'
import type { Participante } from '../types'

// Estado de la sesión compartido por toda la app:
//   sesion = null            → visitante (nunca se registró en este navegador)
//   sesion y perfil = null   → hay sesión (anónima u organizador) pero no perfil de participante
//   perfil                   → participante registrado en este navegador
interface EstadoSesion {
  sesion: Session | null
  perfil: Participante | null
  cargando: boolean
  recargarPerfil: () => Promise<void>
}

const ContextoSesion = createContext<EstadoSesion | null>(null)

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Participante | null>(null)
  const [cargando, setCargando] = useState(true)

  const recargarPerfil = useCallback(async () => {
    try {
      setPerfil(await obtenerMiPerfil())
    } catch {
      setPerfil(null)
    }
  }, [])

  useEffect(() => {
    let activo = true
    void (async () => {
      const actual = await obtenerSesion()
      if (!activo) return
      setSesion(actual)
      if (actual) await recargarPerfil()
      if (activo) setCargando(false)
    })()
    const dejar = escucharSesion((nueva) => {
      setSesion(nueva)
      if (!nueva) setPerfil(null)
      else void recargarPerfil()
    })
    return () => {
      activo = false
      dejar()
    }
  }, [recargarPerfil])

  return (
    <ContextoSesion.Provider value={{ sesion, perfil, cargando, recargarPerfil }}>{children}</ContextoSesion.Provider>
  )
}

export function useSesion(): EstadoSesion {
  const contexto = useContext(ContextoSesion)
  if (!contexto) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>.')
  return contexto
}
