import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

// Página de privacidad (P1-4, Ley N.° 29733 de Protección de Datos Personales del Perú).
const secciones: { titulo: string; contenido: ReactNode }[] = [
  {
    titulo: 'Qué datos pedimos',
    contenido: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Nombre, alias público, correo y especialidad.</li>
        <li>Código PUCP, solo si decides darlo.</li>
        <li>Tus votos, inscripciones, asistencia y resultados en las actividades.</li>
      </ul>
    ),
  },
  {
    titulo: 'Qué no pedimos',
    contenido: (
      <p>
        No pedimos ni guardamos tu género ni otros datos sensibles. En las actividades mixtas, el capitán del equipo solo
        declara que su equipo cumple la regla.
      </p>
    ),
  },
  {
    titulo: 'Para qué los usamos',
    contenido: (
      <p>
        Para organizar las actividades de la especialidad: contar votos, armar equipos, controlar cupos, marcar asistencia y
        calcular el ranking de la temporada. No los vendemos, no los usamos con fines comerciales y no los compartimos con
        terceros.
      </p>
    ),
  },
  {
    titulo: 'Quién los ve',
    contenido: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Cualquier persona con el enlace ve solo tu alias (en el ranking, la bolsa y los equipos).</li>
        <li>Tu nombre, correo y código PUCP solo los ven los organizadores (miembros de la AATI o delegados).</li>
        <li>Tú ves tu propio perfil desde este navegador.</li>
      </ul>
    ),
  },
  {
    titulo: 'Cómo pedir su eliminación',
    contenido: (
      <p>
        Desde{' '}
        <Link to="/registro" className="font-medium text-accent underline underline-offset-2">
          tu perfil
        </Link>{' '}
        puedes borrar tus datos en cualquier momento. Si ya no tienes acceso a este navegador, pídeselo a un organizador
        de la AATI y lo eliminará. También puedes pedir acceso o corrección de tus datos.
      </p>
    ),
  },
  {
    titulo: 'Fotos de las actividades',
    contenido: (
      <p>
        Solo se publica una foto en un resumen si el organizador declara que las personas que aparecen autorizaron su
        publicación.
      </p>
    ),
  },
]

export default function Privacidad() {
  return (
    <article aria-labelledby="titulo-privacidad" className="max-w-prose">
      <h1 id="titulo-privacidad" className="text-2xl font-bold tracking-[-0.02em] md:text-[32px]">
        Privacidad y datos personales
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        Comunidad INF es un proyecto académico del curso Ética y RSU (PUCP 2026-2). Tratamos tus datos conforme a la Ley
        N.° 29733, Ley de Protección de Datos Personales.
      </p>
      <div className="mt-8 space-y-7 text-base leading-relaxed text-ink">
        {secciones.map((s) => (
          <section key={s.titulo}>
            <h2 className="mb-2 text-lg font-semibold">{s.titulo}</h2>
            {s.contenido}
          </section>
        ))}
      </div>
    </article>
  )
}
