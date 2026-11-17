import { useMemo, useState } from 'react'
import type { CaseRecord, DerivedFileRecord, EvidenceContext, EvidenceRecord, TimelineEntry } from '../types'
import { deleteEvidence, getEvidence, listDerived, putCase, putDerived, putEvidence } from '../lib/db'
import { Logo } from './Logo'
import { Importer } from './Importer'
import { EvidenceDetail } from './EvidenceDetail'
import { Timeline } from './Timeline'
import { ReportBuilder } from './ReportBuilder'
import { RedactionEditor } from './RedactionEditor'
import { ConfirmDialog } from './ConfirmDialog'

type Tab = 'evidence' | 'timeline' | 'report'
interface Props { initialCase: CaseRecord; initialEvidence: EvidenceRecord[]; onBack: () => void; onRefresh: () => Promise<void>; announce: (message: string) => void }

const download = (blob: Blob, filename: string) => { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }

export function Workspace({ initialCase, initialEvidence, onBack, onRefresh, announce }: Props) {
  const [caseRecord, setCaseRecord] = useState(initialCase)
  const [evidence, setEvidence] = useState(initialEvidence)
  const [derived, setDerived] = useState<DerivedFileRecord[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [tab, setTab] = useState<Tab>('evidence')
  const [redacting, setRedacting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const selected = useMemo(() => evidence.find(item => item.id === selectedId), [evidence, selectedId])
  const saveCase = async (next: CaseRecord) => { setCaseRecord(next); await putCase(next); await onRefresh() }
  const imported = async (record: EvidenceRecord) => { await putEvidence(record); setEvidence(current => [...current, record]); const next = { ...caseRecord, updatedAt: new Date().toISOString() }; setCaseRecord(next); await putCase(next); await onRefresh(); setSelectedId(record.id) }
  const select = async (id: string) => { setSelectedId(id); setDerived(await listDerived(id)) }
  const saveContext = async (context: EvidenceContext) => { if (!selected) return; const next = { ...selected, context }; await putEvidence(next); setEvidence(current => current.map(item => item.id === next.id ? next : item)); announce('Context saved separately from the original file.') }
  const saveTimeline = (timeline: TimelineEntry[]) => saveCase({ ...caseRecord, timeline, updatedAt: new Date().toISOString() })
  const saveDerived = async (record: DerivedFileRecord) => { for (const old of derived) { /* Older copies remain until explicit evidence deletion to preserve history. */ void old } await putDerived(record); setDerived(current => [...current, record]) }
  const removeEvidence = async () => { if (!selected) return; await deleteEvidence(selected.id); setEvidence(current => current.filter(item => item.id !== selected.id)); setSelectedId(undefined); setDerived([]); setDeleteOpen(false); announce(`${selected.filename} and its working copies were deleted.`); await onRefresh() }
  const chosen = () => evidence.filter(item => caseRecord.report.evidenceIds.includes(item.id))
  const exportPdf = async () => { setExporting(true); announce('Generating the PDF locally.'); try { const { generateReportPdf } = await import('../lib/export'); const pdf = await generateReportPdf(caseRecord, chosen()); download(pdf, `${caseRecord.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-trace-report.pdf`); announce('PDF report generated locally.') } catch { announce('PDF export failed. No files were uploaded.') } finally { setExporting(false) } }
  const exportZip = async () => { setExporting(true); announce('Generating the ZIP package locally.'); try { const { generateReportPdf, generateZip } = await import('../lib/export'); const files = chosen(); const allDerived = (await Promise.all(files.map(item => listDerived(item.id)))).flat(); const pdf = await generateReportPdf(caseRecord, files); const zip = await generateZip(caseRecord, files, allDerived, pdf); download(zip, `${caseRecord.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-trace-package.zip`); announce('ZIP evidence package generated and hashed locally.') } catch { announce('ZIP export failed. No files were uploaded.') } finally { setExporting(false) } }
  return <div className="workspace-shell">
    <header className="workspace-header"><button className="brand-button" onClick={onBack}><Logo/></button><button className="case-crumb" onClick={onBack}>Cases <span>/</span> <strong>{caseRecord.title}</strong></button><div className="local-badge"><span/>Local only</div></header>
    <nav className="workspace-tabs" aria-label="Case sections"><button className={tab === 'evidence' ? 'active' : ''} onClick={() => setTab('evidence')}>Evidence <span>{evidence.length}</span></button><button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>Timeline <span>{caseRecord.timeline.length}</span></button><button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>Report</button></nav>
    <main className="workspace-main">
      {tab === 'evidence' && !selected && <><header className="case-title"><p className="eyebrow">Case workspace</p><h1>{caseRecord.title}</h1><p>{caseRecord.description || 'No case description'}</p></header><Importer caseId={caseRecord.id} onImported={imported} announce={announce}/>{evidence.length > 0 && <section className="evidence-library"><div className="section-line"><h2>Evidence library</h2><p>{evidence.length} local item{evidence.length === 1 ? '' : 's'}</p></div><div className="evidence-list">{evidence.map(item => <button key={item.id} onClick={() => select(item.id)}><div className={`file-kind ${item.kind}`}>{item.kind === 'image' ? 'IMG' : item.kind.toUpperCase()}</div><div><strong>{item.filename}</strong><span>{item.mimeType} · {(item.size / 1024).toFixed(1)} KB</span></div><code>{item.sha256.slice(0, 12)}…</code><span aria-hidden="true">→</span></button>)}</div></section>}</>}
      {tab === 'evidence' && selected && <><button className="text-button back-link" onClick={() => { setSelectedId(undefined); setDerived([]) }}>← Evidence library</button><EvidenceDetail evidence={selected} onSave={saveContext} onRedact={() => setRedacting(true)} hasWorkingCopy={derived.length > 0} onDelete={() => setDeleteOpen(true)}/></>}
      {tab === 'timeline' && <Timeline entries={caseRecord.timeline} evidence={evidence} onChange={saveTimeline}/>}
      {tab === 'report' && <ReportBuilder caseRecord={caseRecord} evidence={evidence} derived={derived} onChange={saveCase} onExportPdf={exportPdf} onExportZip={exportZip} exporting={exporting}/>}
    </main>
    {selected && <RedactionEditor evidence={selected} open={redacting} onClose={() => setRedacting(false)} onSave={saveDerived} announce={announce}/>}
    <ConfirmDialog open={deleteOpen} title="Delete this evidence?" confirmLabel="Delete evidence" onCancel={() => setDeleteOpen(false)} onConfirm={removeEvidence}><p>The original Blob, its context, and all associated working copies will be removed from this browser. This cannot guarantee physical disk erasure.</p></ConfirmDialog>
  </div>
}
