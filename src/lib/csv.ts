// Exportación de inscritos a CSV (solo panel del organizador: incluye correos).

/**
 * Escapa una celda CSV:
 *  - Comillas dobles alrededor si tiene coma, comilla, punto y coma o salto de línea.
 *  - Protección contra "inyección de fórmulas": si el texto empieza con = + - @
 *    (lo que Excel interpreta como fórmula), se antepone un apóstrofo.
 *    Un alias como "=HYPERLINK(...)" no debe ejecutarse al abrir el archivo.
 */
export function celdaCsv(valor: unknown): string {
  let texto = valor === null || valor === undefined ? '' : String(valor)
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
  if (/[",;\n\r]/.test(texto)) texto = `"${texto.replace(/"/g, '""')}"`
  return texto
}

export function aCsv(encabezados: string[], filas: unknown[][]): string {
  return [encabezados, ...filas].map((fila) => fila.map(celdaCsv).join(',')).join('\r\n')
}

/** Descarga el CSV en el navegador. El BOM hace que Excel lea bien las tildes. */
export function descargarCsv(nombreArchivo: string, contenido: string): void {
  const blob = new Blob(['﻿', contenido], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}
