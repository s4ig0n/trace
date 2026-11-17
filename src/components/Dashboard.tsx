import { useMemo, useState } from 'react'
import type { CaseRecord, EvidenceRecord } from '../types'
import { DATA_VERSION } from '../types'
import { Logo } from './Logo'
import { ConfirmDialog } from './ConfirmDialog'

const formatBytes = (bytes: number) => new Intl.NumberFormat(undefined, { notation: bytes > 999_999 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(bytes > 999_999 ? bytes / 1_000_000 : bytes > 999 ? bytes / 1_000 : bytes) + (bytes > 999_999 ? ' MB' : bytes > 999 ? ' KB' : ' B')

interface Props {
  cases: CaseRecord[]
  evidence: EvidenceRecord[]
  onCreate: (record: CaseRecord) => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onClear: () => void
  onHome: () => void
}

export function Dashboard({ cases, evidence, onCreate, onOpen, onDelete, onClear, onHome }: Props) {
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string>()
  const [clearOpen, setClearOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const summary = useMemo(() => new Map(cases.map(item => { const files = evidence.filter(file => file.caseId === item.id); return [item.id, { count: files.length, size: files.reduce((total, file) => total + file.size, 0) }] })), [cases, evidence])
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!title.trim()) return; const now = new Date().toISOString(); onCreate({ version: DATA_VERSION, id: crypto.randomUUID(), title: title.trim(), description: description.trim(), createdAt: now, updatedAt: now, timeline: [], report: { evidenceIds: [], timelineIds: [], copyChoice: {}, includeContext: true, includeNotes: false, includeMetadata: true, includeHashes: true } }); setTitle(''); setDescription(''); setCreating(false) }
  return <div className="app-shell">
    <header className="app-header"><button className="brand-button" onClick={onHome}><Logo/></button><div className="local-badge"><span/>Stored on this device</div></header>
    <main className="dashboard">
      <div className="dashboard-head"><div><p className="eyebrow">Local cases</p><h1>Your evidence workspace</h1><p>Cases and original files stay in this browser until you export or delete them.</p></div><button className="button pill" onClick={() => setCreating(value => !value)}>{creating ? 'Close form' : 'Create new case'}</button></div>
      {creating && <form className="create-panel" onSubmit={submit}><div><label htmlFor="case-title">Case title</label><input id="case-title" value={title} onChange={e => setTitle(e.target.value)} required autoFocus placeholder="Give this case a name"/></div><div><label htmlFor="case-description">Description <span>optional</span></label><textarea id="case-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A private summary of what you are documenting"/></div><button className="button" type="submit">Create case</button></form>}
      {cases.length === 0 ? <section className="empty-state"><div className="empty-mark"><Logo compact/></div><p className="eyebrow">Nothing stored yet</p><h2>Begin with a case, then add evidence.</h2><p>trace will calculate a local SHA-256 integrity record and preserve the original file unchanged.</p><button className="button pill" onClick={() => setCreating(true)}>Create your first case</button></section> : <section className="case-list" aria-label="Cases">{[...cases].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).map(item => <article className="case-row" key={item.id}><button className="case-open" onClick={() => onOpen(item.id)}><div><p className="case-date">Modified {new Date(item.updatedAt).toLocaleDateString()}</p><h2>{item.title}</h2><p>{item.description || 'No case description'}</p></div><dl><div><dt>Evidence</dt><dd>{summary.get(item.id)?.count ?? 0}</dd></div><div><dt>Storage</dt><dd>{formatBytes(summary.get(item.id)?.size ?? 0)}</dd></div></dl><span className="arrow" aria-hidden="true">↗</span></button><button className="icon-button" aria-label={`Delete ${item.title}`} onClick={() => setDeleteId(item.id)}>Delete</button></article>)}</section>}
      <aside className="privacy-note"><strong>Privacy note</strong><p>trace makes no automatic uploads and no external requests containing evidence. Clearing browser storage will remove these cases. Export anything you need before clearing data.</p></aside>
      {cases.length > 0 && <button className="text-button danger-text" onClick={() => setClearOpen(true)}>Clear all trace data</button>}
    </main>
    <ConfirmDialog open={Boolean(deleteId)} title="Delete this case?" confirmLabel="Delete case" onCancel={() => setDeleteId(undefined)} onConfirm={() => { if (deleteId) onDelete(deleteId); setDeleteId(undefined) }}><p>This removes the case, original evidence, working copies, context, and timeline from this browser. Browser deletion cannot guarantee physical disk erasure.</p></ConfirmDialog>
    <ConfirmDialog open={clearOpen} title="Clear all trace data?" confirmLabel="Clear all data" onCancel={() => setClearOpen(false)} onConfirm={() => { onClear(); setClearOpen(false) }}><p>This permanently removes every local trace case and file from this browser. Export anything you need first.</p></ConfirmDialog>
  </div>
}
