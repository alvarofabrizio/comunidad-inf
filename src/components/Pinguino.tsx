import { useId } from 'react'

// "Pingü", la mascota de Comunidad INF: un pingüino original inspirado en Tux
// (la mascota de Linux) con el polerón verde de Informática. Formas geométricas
// simples en la paleta del sistema. El polerón se recorta con la silueta del cuerpo
// (clipPath) para que siga su forma redonda. Saluda con el ala derecha (animación
// CSS .pingu-ala, que se desactiva con prefers-reduced-motion).
const NEGRO = '#14211a'
const NARANJA = '#f4a51c'

export function Pinguino({ className = 'w-32', saludar = true }: { className?: string; saludar?: boolean }) {
  const id = useId().replace(/:/g, '')
  const silueta = `cuerpo-${id}`
  return (
    <svg viewBox="0 0 170 180" className={className} role="img" aria-label="Pingü, el pingüino de Comunidad INF, saludando">
      <defs>
        <clipPath id={silueta}>
          <ellipse cx="80" cy="94" rx="50" ry="70" />
        </clipPath>
      </defs>

      {/* sombra y patas */}
      <ellipse cx="80" cy="172" rx="46" ry="6" fill="#000" opacity=".22" />
      <ellipse cx="61" cy="165" rx="17" ry="8" fill={NARANJA} />
      <ellipse cx="99" cy="165" rx="17" ry="8" fill={NARANJA} />

      {/* cuerpo */}
      <ellipse cx="80" cy="94" rx="50" ry="70" fill={NEGRO} />

      {/* polerón, recortado a la silueta */}
      <g clipPath={`url(#${silueta})`}>
        <rect x="0" y="98" width="170" height="90" fill="var(--color-accent)" />
        {/* bolsillo canguro */}
        <path d="M56 140 L104 140 L110 158 Q80 165 50 158 Z" fill="#2a9148" />
        {/* cuello de la capucha */}
        <path d="M38 99 Q80 122 122 99" fill="none" stroke="var(--color-bosque-2)" strokeWidth="8" strokeLinecap="round" />
      </g>
      {/* cordones */}
      <path d="M70 106 L68 122 M90 106 L92 122" stroke="var(--color-lima)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="68" cy="124" r="2.5" fill="var(--color-lima)" />
      <circle cx="92" cy="124" r="2.5" fill="var(--color-lima)" />
      <text x="80" y="137" textAnchor="middle" fontFamily="DM Sans, system-ui, sans-serif" fontWeight="700" fontSize="15" fill="var(--color-crema)">
        INF
      </text>

      {/* manga izquierda, en reposo */}
      <g transform="rotate(16 34 108)">
        <ellipse cx="34" cy="126" rx="11" ry="25" fill="var(--color-accent)" />
        <ellipse cx="34" cy="148" rx="8" ry="8" fill={NEGRO} />
      </g>

      {/* manga derecha, saludando (gira desde el hombro) */}
      <g className={saludar ? 'pingu-ala' : undefined} style={{ transformOrigin: '124px 106px' }}>
        <g transform="rotate(-150 124 106)">
          <ellipse cx="124" cy="126" rx="11" ry="25" fill="var(--color-accent)" />
          <ellipse cx="124" cy="148" rx="8" ry="8" fill={NEGRO} />
        </g>
      </g>

      {/* cara */}
      <ellipse cx="80" cy="60" rx="34" ry="29" fill="#f7f5e6" />
      <path d="M61 57 q7 -8 14 0 M85 57 q7 -8 14 0" fill="none" stroke={NEGRO} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="58" cy="69" r="5" fill="#f59e8b" opacity=".55" />
      <circle cx="102" cy="69" r="5" fill="#f59e8b" opacity=".55" />
      <path d="M69 69 Q80 62 91 69 Q80 81 69 69 Z" fill={NARANJA} />
      <path d="M71 69 Q80 65 89 69" fill="none" stroke="#c97f0b" strokeWidth="1.5" />
    </svg>
  )
}
