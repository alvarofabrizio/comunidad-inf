// Clases compartidas para controles. Botones de 44px de alto (objetivo táctil mínimo)
// y un solo estilo de botón relleno: el principal, en el color de acento.
export const boton = {
  primario:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] bg-accent px-4 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-control disabled:text-ink',
  secundario:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-control bg-surface px-4 text-[15px] font-medium text-ink transition-[background-color,transform] duration-150 hover:bg-raised active:scale-[0.98] disabled:cursor-not-allowed disabled:text-muted',
  texto:
    'inline-flex min-h-11 items-center gap-1 rounded-[6px] px-1 text-[15px] font-medium text-accent underline-offset-4 hover:underline',
}

export const campo = {
  etiqueta: 'block text-sm font-medium text-ink',
  ayuda: 'mt-1 text-[13px] text-muted',
  error: 'mt-1 text-[13px] font-medium text-negative',
  input:
    'mt-2 block min-h-11 w-full rounded-[6px] border border-control bg-surface px-3 text-base text-ink placeholder:text-muted aria-[invalid=true]:border-negative',
}

export const tarjeta = 'rounded-[8px] border border-border bg-surface'
