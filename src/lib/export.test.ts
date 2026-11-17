import { describe, expect, it } from 'vitest'
import type { CaseRecord, DerivedFileRecord, EvidenceRecord } from '../types'
import { DATA_VERSION } from '../types'
import { buildManifest, selectedTimeline } from './export'
import { generateReportPdf, generateZip } from './export'
import { sha256Blob } from './hash'
import JSZip from 'jszip'

const originalBlob = new Blob(['source file'], { type: 'image/png' })
const workingBlob = new Blob(['redacted file'], { type: 'image/png' })
const evidence: EvidenceRecord = { version: DATA_VERSION, id: 'e1', caseId: 'c1', filename: 'proof.png', mimeType: 'image/png', kind: 'image', size: originalBlob.size, importedAt: '2026-01-01T00:00:00Z', fileLastModified: '2026-01-01T00:00:00Z', sha256: '', originalBlob, metadata: { c2paDetected: false, warnings: [] }, context: { description: 'Caption', source: 'Message', firstSeenAt: '2026-01-01', accounts: '@account', privateNotes: 'Never include by default' } }
const derived: DerivedFileRecord = { version: DATA_VERSION, id: 'd1', caseId: 'c1', evidenceId: 'e1', kind: 'working-copy', mode: 'solid', filename: 'proof-redacted.png', mimeType: 'image/png', size: workingBlob.size, createdAt: '2026-01-02T00:00:00Z', sha256: '', blob: workingBlob }
const makeCase = (): CaseRecord => ({ version: DATA_VERSION, id: 'c1', title: 'Case', description: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', timeline: [{ id: 't1', occurredAt: '', title: 'Included', description: '', evidenceIds: [] }, { id: 't2', occurredAt: '', title: 'Excluded', description: '', evidenceIds: [] }], report: { evidenceIds: ['e1'], timelineIds: ['t1'], copyChoice: {}, includeContext: true, includeNotes: false, includeMetadata: true, includeHashes: true } })

describe('export manifest and selection', () => {
  it('hashes the actual exported original file', async () => {
    const manifest = await buildManifest(makeCase(), [evidence], [])
    expect(manifest.files[0].sha256).toBe(await sha256Blob(originalBlob))
    expect(manifest.files[0].relationship).toBe('original')
  })

  it('records derived relationship and hashes the working copy', async () => {
    const caseRecord = makeCase(); caseRecord.report.copyChoice.e1 = 'working-copy'
    const manifest = await buildManifest(caseRecord, [evidence], [derived])
    expect(manifest.files[0]).toMatchObject({ relationship: 'derived', sourceEvidenceId: 'e1', evidenceId: 'd1' })
    expect(manifest.files[0].sha256).toBe(await sha256Blob(workingBlob))
  })

  it('excludes private notes by default', async () => {
    const manifest = await buildManifest(makeCase(), [evidence], [])
    expect(manifest.files[0].context).not.toHaveProperty('privateNotes')
  })

  it('filters report timeline selections', () => {
    expect(selectedTimeline(makeCase()).map(item => item.id)).toEqual(['t1'])
  })

  it('creates an extractable PDF and ZIP with verified file hashes', async () => {
    const caseRecord = makeCase()
    const pdf = await generateReportPdf(caseRecord, [evidence])
    expect(new Uint8Array(await pdf.arrayBuffer()).slice(0, 4)).toEqual(new Uint8Array([37, 80, 68, 70]))
    const zipBlob = await generateZip(caseRecord, [evidence], [], pdf)
    const archive = await JSZip.loadAsync(await zipBlob.arrayBuffer())
    expect(Object.keys(archive.files)).toEqual(expect.arrayContaining(['trace-report.pdf', 'manifest.json', 'README.txt', 'originals/proof.png']))
    const manifest = JSON.parse(await archive.file('manifest.json')!.async('string'))
    const bytes = await archive.file('originals/proof.png')!.async('uint8array')
    const exported = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer])
    expect(manifest.files[0].sha256).toBe(await sha256Blob(exported))
  })
})
