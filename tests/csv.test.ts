import { describe, expect, it } from 'vitest'
import { aCsv, celdaCsv } from '../src/lib/csv'

describe('exportación CSV', () => {
  it('deja igual el texto simple y vacía los nulos', () => {
    expect(celdaCsv('PixelPuma')).toBe('PixelPuma')
    expect(celdaCsv(null)).toBe('')
    expect(celdaCsv(true)).toBe('true')
  })

  it('pone comillas cuando hay comas o comillas', () => {
    expect(celdaCsv('Ramos, Ana')).toBe('"Ramos, Ana"')
    expect(celdaCsv('El "Puma"')).toBe('"El ""Puma"""')
  })

  it('neutraliza fórmulas de Excel', () => {
    expect(celdaCsv('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(celdaCsv('+51 999')).toBe("'+51 999")
  })

  it('arma filas separadas por CRLF', () => {
    expect(aCsv(['a', 'b'], [[1, 2]])).toBe('a,b\r\n1,2')
  })
})
