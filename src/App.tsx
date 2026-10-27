import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Esqueleto } from './components/Mensaje'
import { OrgLayout } from './components/OrgLayout'
import { Pinguino } from './components/Pinguino'
import { RutaOrganizador } from './components/RutaOrganizador'
import { ProveedorSesion } from './hooks/useSesion'

// El panel del organizador se descarga solo cuando alguien entra a /org:
// los participantes en el celular no pagan esos kilobytes (red móvil).
const EditorActividad = lazy(() => import('./pages/org/EditorActividad'))
const EditorEncuesta = lazy(() => import('./pages/org/EditorEncuesta'))
const EditorResumen = lazy(() => import('./pages/org/EditorResumen'))
const GestionActividad = lazy(() => import('./pages/org/GestionActividad'))
const Login = lazy(() => import('./pages/org/Login'))
const Panel = lazy(() => import('./pages/org/Panel'))
import Actividad from './pages/Actividad'
import Bolsa from './pages/Bolsa'
import Calendario from './pages/Calendario'
import Encuesta from './pages/Encuesta'
import Inicio from './pages/Inicio'
import Privacidad from './pages/Privacidad'
import Ranking from './pages/Ranking'
import Registro from './pages/Registro'
import Resumenes from './pages/Resumenes'

function NoEncontrada() {
  return (
    <section className="flex flex-col items-center py-8 text-center">
      <Pinguino className="w-32" variante="cuaderno" />
      <h1 className="mt-4 text-2xl font-bold">Página no encontrada</h1>
      <p className="mt-2 text-[15px] text-muted">
        Pingüi revisó todo su cuaderno y no la encontró. Revisa el enlace o vuelve al{' '}
        <Link to="/" className="font-medium text-accent underline">inicio</Link>.
      </p>
    </section>
  )
}

// Rutas públicas y del panel del organizador (/org).
export default function App() {
  return (
    <ProveedorSesion>
      <Suspense fallback={<div className="mx-auto max-w-5xl px-4 pt-6"><Esqueleto filas={3} /></div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/actividad/:id" element={<Actividad />} />
          <Route path="/actividad/:id/bolsa" element={<Bolsa />} />
          <Route path="/encuesta" element={<Encuesta />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/resumenes" element={<Resumenes />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>

        {/* Panel del organizador. RutaOrganizador protege en el frontend; la RLS, en la base. */}
        <Route path="/org" element={<OrgLayout />}>
          <Route path="login" element={<Login />} />
          <Route element={<RutaOrganizador />}>
            <Route index element={<Panel />} />
            <Route path="actividad/nueva" element={<EditorActividad />} />
            <Route path="actividad/:id" element={<GestionActividad />} />
            <Route path="actividad/:id/editar" element={<EditorActividad />} />
            <Route path="actividad/:id/resumen" element={<EditorResumen />} />
            <Route path="encuesta/nueva" element={<EditorEncuesta />} />
            <Route path="encuesta/:id" element={<EditorEncuesta />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </ProveedorSesion>
  )
}
