// Identidad de Comunidad INF.
// El logo son tres asientos de un equipo hechos con píxeles (el motivo pixelado
// de la AAII): dos ocupados y uno libre, que es el lugar para quien llega solo.
// Arriba a la derecha, un pequeño damero lima repite el borde de sus afiches.

export function Marca({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`flex-none ${className}`} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--color-bosque-2)" />
      {/* damero de píxeles */}
      <rect x="23" y="3" width="3" height="3" fill="var(--color-lima)" />
      <rect x="26" y="6" width="3" height="3" fill="var(--color-lima)" />
      <rect x="26" y="3" width="3" height="3" fill="var(--color-lima)" opacity=".45" />
      {/* asientos: ocupado, ocupado, libre */}
      <rect x="4" y="15" width="7" height="7" rx="1.5" fill="var(--color-crema)" />
      <rect x="12.5" y="15" width="7" height="7" rx="1.5" fill="var(--color-crema)" />
      <rect x="22" y="16" width="5" height="5" rx="1" fill="none" stroke="var(--color-lima)" strokeWidth="2" />
    </svg>
  )
}

/** Logotipo completo: marca + "Comunidad INF". Pensado para fondos bosque. */
export function Logotipo({ texto = 'Comunidad', compacto = false }: { texto?: string; compacto?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Marca />
      <span className="text-[17px] font-bold tracking-[-0.01em] whitespace-nowrap text-crema">
        {/* compacto: en celulares angostos solo se ve "INF" para que entren los botones de la cabecera */}
        <span className={compacto ? 'max-[399px]:sr-only' : undefined}>{texto} </span>
        <span className="text-lima">INF</span>
      </span>
    </span>
  )
}

/** Damero de píxeles decorativo para las esquinas de las bandas oscuras (como en los afiches de la AAII). */
export function DameroPixeles({ className = '' }: { className?: string }) {
  // Patrón fijo de 6x4 celdas: 1 = lima, 2 = lima tenue, 0 = vacío.
  const patron = ['110100', '011010', '101101', '010110']
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true">
      {patron.flatMap((fila, y) =>
        [...fila].map((c, x) =>
          c === '0' ? null : (
            <rect key={`${x}-${y}`} x={x * 10} y={y * 10} width="10" height="10" fill="var(--color-lima)" opacity={c === '1' ? 0.9 : 0.35} />
          ),
        ),
      )}
    </svg>
  )
}
