// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { collectPrefixCandidates } from '../../src/core/prefix-candidates'
import { pickSitePrefix } from '../../src/core/site-prefix'

function docWith(html: string): Document {
  const doc = document.implementation.createHTMLDocument()
  doc.body.innerHTML = html
  return doc
}

describe('collectPrefixCandidates', () => {
  it('compte les variants de tête inconnus, ignore les variants Tailwind', () => {
    const doc = docWith('<div class="tw:p-4 tw:md:p-2 hover:bg-red-500 after:absolute"></div><span class="tw:p-4"></span>')
    expect(collectPrefixCandidates(doc)).toEqual([
      ['tw', 'p-4', 2],
      ['tw', 'p-2', 1],
    ])
  })
})

describe('pickSitePrefix', () => {
  it('retient le préfixe dont les bases sont des classes Tailwind, à partir de 3 occurrences', () => {
    expect(pickSitePrefix([['tw', 'p-4', 2], ['tw', 'bg-red-500', 1]])).toBe('tw')
    expect(pickSitePrefix([['tw', 'p-4', 2]])).toBeNull()
  })

  it('ignore les bases non reconnues', () => {
    expect(pickSitePrefix([['app', 'btn-primary', 10], ['tw', 'flex', 3]])).toBe('tw')
  })
})
