import { useRef, useState } from 'react'
import type { EvidenceRecord } from '../types'
import { DATA_VERSION } from '../types'
import { findDuplicate } from '../lib/db'
import { sha256Blob } from '../lib/hash'
import { extractSafeMetadata, getEvidenceKind } from '../lib/metadata'

interface Props { caseId: string; onImported: (record: EvidenceRecord) => Promise<void>; announce: (message: string) => void }

export function Importer({ caseId, onImported, announce }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [active, setActive] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const process = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const kind = getEvidenceKind(file.type)
      if (!kind) { announce(`${file.name} is not a supported image, video, audio, or PDF.`); continue }
      if (file.size > 500 * 1024 * 1024 && !confirm(`${file.name} is larger than 500 MB. Importing may use substantial memory. Continue?`)) continue
      announce(`Hashing ${file.name} locally.`)
      try {
        const hash = await sha256Blob(file, value => setProgress(current => ({ ...current, [file.name]: value })))
        const duplicate = await findDuplicate(caseId, hash)
        if (duplicate && !confirm(`${file.name} has the same SHA-256 hash as ${duplicate.filename} in this case. Keep another copy?`)) { setProgress(current => { const next = { ...current }; delete next[file.name]; return next }); continue }
        const record: EvidenceRecord = { version: DATA_VERSION, id: crypto.randomUUID(), caseId, filename: file.name, mimeType: file.type, kind, size: file.size, importedAt: new Date().toISOString(), fileLastModified: new Date(file.lastModified).toISOString(), sha256: hash, originalBlob: file, metadata: await extractSafeMetadata(file, kind), context: { description: '', source: '', firstSeenAt: '', accounts: '', privateNotes: '' } }
        await onImported(record); announce(`${file.name} was imported and stored locally.`)
      } catch (error) { announce(`Import failed for ${file.name}. ${error instanceof Error ? error.message : 'Storage may be unavailable or full.'}`) }
      finally { setProgress(current => { const next = { ...current }; delete next[file.name]; return next }) }
    }
  }
  return <section className={`importer ${active ? 'active' : ''}`} onDragEnter={e => { e.preventDefault(); setActive(true) }} onDragOver={e => e.preventDefault()} onDragLeave={e => { if (e.currentTarget === e.target) setActive(false) }} onDrop={e => { e.preventDefault(); setActive(false); process(e.dataTransfer.files) }}>
    <div className="import-icon" aria-hidden="true">+</div><p className="eyebrow">Add evidence</p><h2>Drop files here, or choose from your device.</h2><p>Images, video, audio, and PDFs stay on this device. trace records file identity without modifying the original. You control exports and deletion.</p>
    <input ref={input} className="sr-only" type="file" accept="image/*,video/*,audio/*,application/pdf" multiple onChange={e => e.target.files && process(e.target.files)}/><button className="button" onClick={() => input.current?.click()}>Choose files</button>
    {Object.entries(progress).map(([name, value]) => <div className="hash-progress" key={name}><span>{name}</span><progress value={value} max="100">{value}%</progress><strong>{value}%</strong></div>)}
  </section>
}
