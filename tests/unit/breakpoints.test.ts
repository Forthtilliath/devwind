// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { breakpointsFromThemeVariables, breakpointsFromVotes, sortedBreakpointNames } from '../../src/core/breakpoints'
import { collectBreakpointVotes } from '../../src/core/breakpoint-scanner'
import type { BreakpointVote } from '../../src/types'

function votesFor(css: string): BreakpointVote[] {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  const votes = new Map<string, BreakpointVote>()
  collectBreakpointVotes(sheet.cssRules, votes)
  return Array.from(votes.values())
}

describe('collectBreakpointVotes', () => {
  it('lit les media queries v4 et v3 autour des classes à variant', () => {
    const votes = votesFor(`
      @media (width >= 40rem) { .sm\\:flex { display: flex } }
      @media (width < 64rem) { .max-lg\\:hidden { display: none } }
      @media (min-width: 768px) { .md\\:block { display: block } }
      @media (min-width: 768px) { .container { max-width: 768px } }
      @media print { .print\\:hidden { display: none } }
    `)
    expect(votes).toEqual(
      expect.arrayContaining([
        ['sm', '', 'min', '40rem', 1],
        ['max-lg', '', 'max', '64rem', 1],
        ['md', '', 'min', '768px', 1],
      ]),
    )
    expect(votes).toHaveLength(3)
  })
})

describe('breakpointsFromVotes', () => {
  it('déduit les noms, retire `max-` et le préfixe de site, garde le seuil majoritaire', () => {
    const votes: BreakpointVote[] = [
      ['sm', '', 'min', '30rem', 5],
      ['sm', '', 'min', '40rem', 1],
      ['max-3xl', '', 'max', '120rem', 2],
      ['tw', 'md', 'min', '50rem', 3],
      ['hover', '', 'max', '10rem', 1],
      ['min-[600px]', '', 'min', '600px', 1],
    ]
    expect(breakpointsFromVotes(votes, 'tw')).toEqual({ sm: '30rem', '3xl': '120rem', md: '50rem' })
  })
})

describe('breakpointsFromThemeVariables', () => {
  it('ne garde que les --breakpoint-* (préfixés si besoin) aux longueurs valides', () => {
    const vars = [
      { name: '--tw-breakpoint-xs', value: '20rem' },
      { name: '--breakpoint-sm', value: '40rem' },
      { name: '--tw-breakpoint-bad', value: 'calc(1px)' },
    ]
    expect(breakpointsFromThemeVariables(vars, 'tw')).toEqual({ xs: '20rem' })
    expect(breakpointsFromThemeVariables(vars, null)).toEqual({ sm: '40rem' })
  })
})

describe('sortedBreakpointNames', () => {
  it('trie par seuil, unités mélangées', () => {
    expect(sortedBreakpointNames({ lg: '64rem', xs: '320px', md: '48rem' })).toEqual(['xs', 'md', 'lg'])
  })
})
