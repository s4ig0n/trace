import { openDB, type DBSchema } from 'idb'
import type { CaseRecord, DerivedFileRecord, EvidenceRecord } from '../types'

interface TraceDB extends DBSchema {
  cases: { key: string; value: CaseRecord }
  evidence: { key: string; value: EvidenceRecord; indexes: { 'by-case': string; 'by-case-hash': [string, string] } }
  derived: { key: string; value: DerivedFileRecord; indexes: { 'by-case': string; 'by-evidence': string } }
}

let dbPromise: ReturnType<typeof openDB<TraceDB>> | undefined
export const getDB = () => dbPromise ??= openDB<TraceDB>('trace-local-v1', 1, {
  upgrade(db) {
    db.createObjectStore('cases', { keyPath: 'id' })
    const evidence = db.createObjectStore('evidence', { keyPath: 'id' })
    evidence.createIndex('by-case', 'caseId')
    evidence.createIndex('by-case-hash', ['caseId', 'sha256'])
    const derived = db.createObjectStore('derived', { keyPath: 'id' })
    derived.createIndex('by-case', 'caseId')
    derived.createIndex('by-evidence', 'evidenceId')
  },
  blocked() { window.dispatchEvent(new CustomEvent('trace-db-blocked')) },
})

export const resetDBForTests = () => { dbPromise = undefined }
export const listCases = async () => (await getDB()).getAll('cases')
export const getCase = async (id: string) => (await getDB()).get('cases', id)
export const putCase = async (record: CaseRecord) => (await getDB()).put('cases', record)
export const listEvidence = async (caseId: string) => (await getDB()).getAllFromIndex('evidence', 'by-case', caseId)
export const getEvidence = async (id: string) => (await getDB()).get('evidence', id)
export const putEvidence = async (record: EvidenceRecord) => (await getDB()).put('evidence', record)
export const findDuplicate = async (caseId: string, hash: string) => (await getDB()).getFromIndex('evidence', 'by-case-hash', [caseId, hash])
export const listDerived = async (evidenceId: string) => (await getDB()).getAllFromIndex('derived', 'by-evidence', evidenceId)
export const putDerived = async (record: DerivedFileRecord) => (await getDB()).put('derived', record)

export async function deleteEvidence(id: string) {
  const db = await getDB()
  const tx = db.transaction(['evidence', 'derived'], 'readwrite')
  for (const derived of await tx.objectStore('derived').index('by-evidence').getAll(id)) await tx.objectStore('derived').delete(derived.id)
  await tx.objectStore('evidence').delete(id)
  await tx.done
}

export async function deleteCaseData(id: string) {
  const db = await getDB()
  const tx = db.transaction(['cases', 'evidence', 'derived'], 'readwrite')
  for (const item of await tx.objectStore('evidence').index('by-case').getAll(id)) await tx.objectStore('evidence').delete(item.id)
  for (const item of await tx.objectStore('derived').index('by-case').getAll(id)) await tx.objectStore('derived').delete(item.id)
  await tx.objectStore('cases').delete(id)
  await tx.done
}

export async function clearTraceData() {
  const db = await getDB()
  const tx = db.transaction(['cases', 'evidence', 'derived'], 'readwrite')
  await Promise.all([tx.objectStore('cases').clear(), tx.objectStore('evidence').clear(), tx.objectStore('derived').clear()])
  await tx.done
}
