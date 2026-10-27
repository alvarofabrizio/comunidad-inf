// Elemento propio de Comunidad INF: los lugares de un equipo como asientos.
// Lleno = integrante; vacío = lugar libre. Se entiende de un vistazo cuánto falta
// para completar el equipo, que es lo que decide si alguien de la bolsa entra.
export function AsientosEquipo({
  miembros,
  tamano,
  etiqueta = true,
}: {
  miembros: number
  tamano: number
  etiqueta?: boolean
}) {
  const libres = Math.max(0, tamano - miembros)
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-1" aria-hidden="true">
        {Array.from({ length: tamano }, (_, i) => (
          <span
            key={i}
            className={
              i < miembros
                ? 'size-3.5 rounded-full bg-accent'
                : 'size-3.5 rounded-full border-2 border-accent-track bg-surface'
            }
          />
        ))}
      </div>
      {etiqueta ? (
        <span className="num text-[13px] text-muted">
          {miembros} de {tamano}
          {libres > 0 ? ` · ${libres} ${libres === 1 ? 'libre' : 'libres'}` : ' · lleno'}
        </span>
      ) : (
        <span className="sr-only">
          {miembros} de {tamano} integrantes
        </span>
      )}
    </div>
  )
}
