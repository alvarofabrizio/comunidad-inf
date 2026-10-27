import { useId } from 'react'

// "Pingüi", la mascota de Comunidad INF, fiel al diseño que dio el equipo:
// pingüino de cabeza oscura con antifaz y ojos verdes en arco, audífonos azules,
// polerón verde de Informática y un cuaderno azul de la PUCP entre las alas.
// Dibujado con formas geométricas en la paleta del sistema (sin imágenes externas).
//
// Las mangas llevan un contorno verde oscuro para separarse del polerón.
//
// Variantes:
//   'cuaderno' → abraza el cuaderno con las dos alas (pose base)
//   'saludo'   → sostiene el cuaderno con un ala y saluda con la otra
//                (animación CSS .pingu-ala, desactivada con prefers-reduced-motion)
const OSCURO = '#172028'
const ANTIFAZ = '#223249'
const CARA = '#f7f5ea'
const NARANJA = '#f4a51c'
const AZUL = '#2f6fd6'
const AZUL_OSCURO = '#1d4f9e'
const CUADERNO = '#2563b8'

type Variante = 'cuaderno' | 'saludo'

export function Pinguino({ className = 'w-32', variante = 'saludo' }: { className?: string; variante?: Variante }) {
  const id = useId().replace(/:/g, '')
  const silueta = `pingui-${id}`
  const saluda = variante === 'saludo'
  return (
    <svg
      viewBox="0 0 180 210"
      className={className}
      role="img"
      aria-label={saluda ? 'Pingüi, la mascota de Comunidad INF, saludando' : 'Pingüi, la mascota de Comunidad INF, con su cuaderno'}
    >
      <defs>
        <clipPath id={silueta}>
          <ellipse cx="90" cy="120" rx="56" ry="78" />
        </clipPath>
      </defs>

      {/* sombra y patas */}
      <ellipse cx="90" cy="202" rx="50" ry="6" fill="#000" opacity=".22" />
      <ellipse cx="68" cy="195" rx="18" ry="8" fill={NARANJA} />
      <ellipse cx="112" cy="195" rx="18" ry="8" fill={NARANJA} />

      {/* cuerpo */}
      <ellipse cx="90" cy="120" rx="56" ry="78" fill={OSCURO} />

      {/* polerón verde y barriga blanca, recortados a la silueta */}
      <g clipPath={`url(#${silueta})`}>
        <rect x="0" y="106" width="180" height="110" fill="var(--color-accent)" />
        <ellipse cx="90" cy="196" rx="28" ry="20" fill={CARA} />
        <path d="M40 108 Q90 134 140 108" fill="none" stroke="var(--color-bosque-2)" strokeWidth="9" strokeLinecap="round" />
      </g>

      {/* audífonos: vincha */}
      <path d="M36 86 Q34 30 90 30 Q146 30 144 86" fill="none" stroke={AZUL} strokeWidth="8" strokeLinecap="round" />

      {/* cara blanca, antifaz y ojos verdes en arco */}
      <ellipse cx="90" cy="86" rx="38" ry="26" fill={CARA} />
      <rect x="47" y="58" width="86" height="27" rx="13.5" fill={ANTIFAZ} />
      <path d="M69 77 q7 -11 14 0 M97 77 q7 -11 14 0" fill="none" stroke="var(--color-lima)" strokeWidth="4.5" strokeLinecap="round" />
      {/* pico */}
      <path d="M79 90 Q90 83 101 90 Q90 103 79 90 Z" fill={NARANJA} />
      <path d="M81 90 Q90 86 99 90" fill="none" stroke="#c97f0b" strokeWidth="1.5" />

      {/* audífonos: almohadillas */}
      <rect x="27" y="68" width="19" height="34" rx="8" fill={AZUL} />
      <rect x="33" y="73" width="9" height="24" rx="4.5" fill={AZUL_OSCURO} />
      <rect x="134" y="68" width="19" height="34" rx="8" fill={AZUL} />
      <rect x="138" y="73" width="9" height="24" rx="4.5" fill={AZUL_OSCURO} />

      {/* cuaderno azul de la PUCP */}
      <g transform={saluda ? 'rotate(-10 84 154)' : 'rotate(-5 90 154)'}>
        <rect x="62" y="124" width="54" height="62" rx="5" fill={CUADERNO} />
        <rect x="67" y="129" width="44" height="52" rx="3" fill="none" stroke="#5b8fd6" strokeWidth="1.5" />
        {[132, 141, 150, 159, 168, 177].map((y) => (
          <rect key={y} x="59" y={y} width="7" height="3" rx="1.5" fill={CARA} />
        ))}
        <text x="91" y="146" textAnchor="middle" fontFamily="DM Sans, system-ui, sans-serif" fontWeight="700" fontSize="11" fill="#ffffff">
          PUCP
        </text>
        <path d="M76 156 H106 M76 163 H102 M76 170 H98" stroke="#9cc0ef" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* ala izquierda: sostiene el cuaderno */}
      <g transform="rotate(-30 52 132)">
        <ellipse cx="52" cy="146" rx="12" ry="25" fill="var(--color-accent)" stroke="var(--color-accent-ink)" strokeWidth="2.5" />
        <ellipse cx="52" cy="168" rx="8" ry="8" fill={OSCURO} />
      </g>

      {saluda ? (
        // ala derecha levantada, saludando (gira desde el hombro)
        <g className="pingu-ala" style={{ transformOrigin: '136px 118px' }}>
          <g transform="rotate(-145 136 118)">
            <ellipse cx="136" cy="138" rx="12" ry="25" fill="var(--color-accent)" stroke="var(--color-accent-ink)" strokeWidth="2.5" />
            <ellipse cx="136" cy="160" rx="8" ry="8" fill={OSCURO} />
          </g>
        </g>
      ) : (
        // ala derecha: también abraza el cuaderno
        <g transform="rotate(30 128 132)">
          <ellipse cx="128" cy="146" rx="12" ry="25" fill="var(--color-accent)" stroke="var(--color-accent-ink)" strokeWidth="2.5" />
          <ellipse cx="128" cy="168" rx="8" ry="8" fill={OSCURO} />
        </g>
      )}
    </svg>
  )
}

/** Nombre propio para usar en el código: Pingüi es la mascota. */
export const Pingui = Pinguino
