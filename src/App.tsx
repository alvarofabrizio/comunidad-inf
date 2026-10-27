import { Route, Routes } from 'react-router-dom'

// Esqueleto de rutas. Las páginas reales se construyen en la Fase 2 (públicas) y la Fase 3 (/org).
function Pendiente({ nombre }: { nombre: string }) {
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-semibold">Comunidad INF</h1>
      <p className="mt-2 text-sm">Vista "{nombre}" en construcción.</p>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Pendiente nombre="Inicio" />} />
      <Route path="*" element={<Pendiente nombre="No encontrada" />} />
    </Routes>
  )
}
