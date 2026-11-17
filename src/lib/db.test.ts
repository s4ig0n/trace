import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { CaseRecord, DerivedFileRecord, EvidenceRecord } from '../types'
import { DATA_VERSION } from '../types'
import { deleteCaseData, findDuplicate, getDB, listCases, listDerived, listEvidence, putCase, putDerived, putEvidence, resetDBForTests } from './db'

const caseRecord: CaseRecord = { version: DATA_VERSION, id: 'case-1', title: 'Test', description: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', timeline: [], report: { evidenceIds: [], timelineIds: [], copyChoice: {}, includeContext: true, includeNotes: false, includeMetadata: true, includeHashes: true } }
const evidence: EvidenceRecord = { version: DATA_VERSION, id: 'evidence-1', caseId: caseRecord.id, filename: 'original.txt', mimeType: 'application/pdf', kind: 'pdf', size: 8, importedAt: caseRecord.createdAt, fileLastModified: caseRecord.createdAt, sha256: 'hash-1', originalBlob: new Blob(['original']), metadata: { c2paDetected: false, warnings: [] }, context: { description: '', source: '', firstSeenAt: '', accounts: '', privateNotes: 'private' } }
const derived: DerivedFileRecord = { version: DATA_VERSION, id: 'derived-1', caseId: caseRecord.id, evidenceId: evidence.id, kind: 'working-copy', mode: 'solid', filename: 'derived.png', mimeType: 'image/png', size: 7, createdAt: caseRecord.createdAt, sha256: 'hash-2', blob: new Blob(['derived']) }

beforeEach(async () => { resetDBForTests(); await new Promise<void>(resolve => { const request = indexedDB.deleteDatabase('trace-local-v1'); request.onsuccess = () => resolve(); request.onerror = () => resolve(); request.onblocked = () => resolve() }) })
afterEach(async () => { (await getDB()).close(); resetDBForTests() })

describe('IndexedDB storage', () => {
  it('creates and reads cases and evidence Blobs', async () => {
    await putCase(caseRecord); await putEvidence(evidence)
    expect((await listCases())[0].title).toBe('Test')
    expect(await (await listEvidence(caseRecord.id))[0].originalBlob.text()).toBe('original')
  })

  it('keeps the original and derived file separate', async () => {
    await putCase(caseRecord); await putEvidence(evidence); await putDerived(derived)
    expect(await (await listEvidence(caseRecord.id))[0].originalBlob.text()).toBe('original')
    expect(await (await listDerived(evidence.id))[0].blob.text()).toBe('derived')
  })

  it('detects a duplicate within a case', async () => {
    await putCase(caseRecord); await putEvidence(evidence)
    expect((await findDuplicate(caseRecord.id, evidence.sha256))?.id).toBe(evidence.id)
    expect(await findDuplicate('another-case', evidence.sha256)).toBeUndefined()
  })

  it('deletes a case and all associated records', async () => {
    await putCase(caseRecord); await putEvidence(evidence); await putDerived(derived); await deleteCaseData(caseRecord.id)
    expect(await listCases()).toEqual([])
    expect(await listEvidence(caseRecord.id)).toEqual([])
    expect(await listDerived(evidence.id)).toEqual([])
  })
})
