import { describe, expect, it } from 'vitest'
import { sha256Blob } from './hash'

describe('sha256Blob', () => {
  it('matches the known SHA-256 for abc', async () => {
    expect(await sha256Blob(new Blob(['abc']))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('reports completion', async () => {
    const values: number[] = []
    await sha256Blob(new Blob(['progress']), value => values.push(value))
    expect(values.at(-1)).toBe(100)
  })
})
