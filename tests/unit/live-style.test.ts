import { describe, expect, it } from 'vitest'
import { declarationsFor } from '../../src/core/live-style'

describe('declarationsFor', () => {
  it('spacing : multiplicateur de --spacing', () => {
    expect(declarationsFor('p-4')).toEqual(['padding: calc(var(--spacing, 0.25rem) * 4)'])
    expect(declarationsFor('-mt-2')).toEqual(['margin-top: calc(var(--spacing, 0.25rem) * -2)'])
  })

  it('couleur : variable de thème avec fallback', () => {
    expect(declarationsFor('bg-red-500')).toEqual([expect.stringMatching(/^background-color: var\(--color-red-500, .+\)$/)])
  })

  it('couleur avec opacité : color-mix', () => {
    expect(declarationsFor('bg-red-500/50')?.[0]).toMatch(/^background-color: color-mix\(in srgb, var\(--color-red-500, .+\) 50%, transparent\)$/)
  })

  it('static : valeur traduite si besoin', () => {
    expect(declarationsFor('flex')).toEqual(['display: flex'])
    expect(declarationsFor('resize-x')).toEqual(['resize: horizontal'])
  })

  it('fontSize : line-height apparié', () => {
    const decls = declarationsFor('text-sm')
    expect(decls?.[0]).toMatch(/^font-size: var\(--text-sm, .+\)$/)
    expect(decls?.[1]).toMatch(/^line-height: var\(--text-sm--line-height, .+\)$/)
  })

  it('préfixe de site appliqué aux variables de thème, y compris le line-height', () => {
    expect(declarationsFor('bg-red-500', 'tw')?.[0]).toMatch(/var\(--tw-color-red-500, /)
    expect(declarationsFor('p-4', 'tw')).toEqual(['padding: calc(var(--tw-spacing, 0.25rem) * 4)'])
    expect(declarationsFor('text-sm', 'tw')?.[1]).toMatch(/var\(--tw-text-sm--line-height, /)
  })

  it('valeur arbitraire : `_` -> espace, sauf dans url()', () => {
    expect(declarationsFor('w-[calc(100%_-_2rem)]')).toEqual(['width: calc(100% - 2rem)'])
    expect(declarationsFor('bg-[rgb(0_0_0)]')).toEqual(['background-color: rgb(0 0 0)'])
  })

  it('propriétés composites : variable + formule partagée', () => {
    const decls = declarationsFor('scale-105')
    expect(decls).toContain('scale: var(--tw-scale-x, 1) var(--tw-scale-y, 1)')
    expect(decls?.some((d) => d.startsWith('--tw-scale-x: '))).toBe(true)
  })

  it('classe inconnue : null', () => {
    expect(declarationsFor('btn-primary')).toBeNull()
  })
})
