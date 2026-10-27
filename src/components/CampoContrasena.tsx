import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { campo } from './estilos'

/** Campo de contraseña con botón para mostrarla u ocultarla (útil al escribir en el celular). */
export function CampoContrasena({
  id,
  etiqueta,
  valor,
  alCambiar,
  nueva = false,
  error,
  ayuda,
}: {
  id: string
  etiqueta: string
  valor: string
  alCambiar: (v: string) => void
  nueva?: boolean
  error?: string
  ayuda?: string
}) {
  const [visible, setVisible] = useState(false)
  const describe = [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label htmlFor={id} className={campo.etiqueta}>{etiqueta}</label>
      <div className="relative mt-2">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={nueva ? 'new-password' : 'current-password'}
          minLength={nueva ? 8 : undefined}
          className={`${campo.input} mt-0 pr-12`}
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describe}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[6px] text-muted hover:text-ink"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
        </button>
      </div>
      {ayuda && <p id={`${id}-ayuda`} className={campo.ayuda}>{ayuda}</p>}
      {error && <p id={`${id}-error`} className={campo.error}>{error}</p>}
    </div>
  )
}
