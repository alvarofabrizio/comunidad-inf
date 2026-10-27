import { Link } from 'react-router-dom'

// Los nombres del equipo se completan en la Fase 4 (pendiente: el equipo debe pasarlos).
const INTEGRANTES = ['[INTEGRANTE 1]', '[INTEGRANTE 2]', '[INTEGRANTE 3]', '[INTEGRANTE 4]', '[INTEGRANTE 5]']

export function Pie() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto max-w-3xl px-4 py-6 text-[13px] text-muted">
        <p className="font-medium text-ink">Proyecto académico, Ética y RSU, PUCP 2026-2</p>
        <p className="mt-1">Hecho por {INTEGRANTES.join(', ')}.</p>
        <p className="mt-1">
          Uso académico y comunitario, no comercial.{' '}
          <Link to="/privacidad" className="font-medium text-accent underline underline-offset-2">
            Privacidad y datos personales
          </Link>
        </p>
      </div>
    </footer>
  )
}
