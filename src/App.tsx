import { useEffect, useState } from 'react'
import type { CaseRecord, EvidenceRecord } from './types'
import { clearTraceData, deleteCaseData, getCase, listCases, listEvidence, putCase } from './lib/db'
import { Landing } from './components/Landing'
import { Dashboard } from './components/Dashboard'
import { Workspace } from './components/Workspace'

type View = { name: 'landing' } | { name: 'dashboard' } | { name: 'case'; id: string }

export function App() {
  const [view, setView] = useState<View>(() => location.hash.startsWith('#/case/') ? { name: 'case', id: location.hash.slice(7) } : location.hash === '#/cases' ? { name: 'dashboard' } : { name: 'landing' })
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [announcement, setAnnouncement] = useState('')
  const navigate = (next: View) => { setView(next); location.hash = next.name === 'landing' ? '' : next.name === 'dashboard' ? '/cases' : `/case/${next.id}`; scrollTo({ top: 0, behavior: 'instant' }) }
  const refresh = async () => {
    try { const nextCases = await listCases(); const allEvidence = (await Promise.all(nextCases.map(item => listEvidence(item.id)))).flat(); setCases(nextCases); setEvidence(allEvidence) }
    catch { setAnnouncement('Local storage could not be read. A browser update, private mode restriction, or corrupt record may be responsible.') }
    finally { setLoading(false) }
  }
  useEffect(() => { refresh(); const listener = () => setAnnouncement('Another trace tab is updating local storage. Close it and refresh before continuing.'); window.addEventListener('trace-db-blocked', listener); return () => window.removeEventListener('trace-db-blocked', listener) }, [])
  useEffect(() => { const listener = () => { const hash = location.hash; setView(hash.startsWith('#/case/') ? { name: 'case', id: hash.slice(7) } : hash === '#/cases' ? { name: 'dashboard' } : { name: 'landing' }) }; window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener) }, [])
  if (loading) return <main className="loading"><div className="spinner"/><p>Opening your local workspace…</p></main>
  const activeCase = view.name === 'case' ? cases.find(item => item.id === view.id) : undefined
  return <><div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    {view.name === 'landing' && <Landing onStart={() => navigate({ name: 'dashboard' })}/>}
    {view.name === 'dashboard' && <Dashboard cases={cases} evidence={evidence} onCreate={async record => { await putCase(record); await refresh(); navigate({ name: 'case', id: record.id }) }} onOpen={id => navigate({ name: 'case', id })} onDelete={async id => { await deleteCaseData(id); await refresh(); setAnnouncement('Case and associated local data deleted.') }} onClear={async () => { await clearTraceData(); await refresh(); setAnnouncement('All trace data was cleared from this browser.') }} onHome={() => navigate({ name: 'landing' })}/>}
    {view.name === 'case' && activeCase && <Workspace key={activeCase.id} initialCase={activeCase} initialEvidence={evidence.filter(item => item.caseId === activeCase.id)} onBack={() => navigate({ name: 'dashboard' })} onRefresh={refresh} announce={setAnnouncement}/>}
    {view.name === 'case' && !activeCase && <main className="not-found"><h1>Case not found</h1><p>It may have been deleted or the browser’s local data may have been cleared.</p><button className="button" onClick={() => navigate({ name: 'dashboard' })}>Return to cases</button></main>}
  </>
}
