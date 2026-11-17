import { useEffect, useRef, useState } from 'react'
import type { DerivedFileRecord, EvidenceRecord, RedactionMode } from '../types'
import { DATA_VERSION } from '../types'
import { sha256Blob } from '../lib/hash'

interface Box { x: number; y: number; width: number; height: number; mode: RedactionMode }
interface Props { evidence: EvidenceRecord; open: boolean; onClose: () => void; onSave: (record: DerivedFileRecord) => void; announce: (message: string) => void }

export function RedactionEditor({ evidence, open, onClose, onSave, announce }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const image = useRef<HTMLImageElement | undefined>(undefined)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [redo, setRedo] = useState<Box[]>([])
  const [mode, setMode] = useState<RedactionMode>('solid')
  const [start, setStart] = useState<{ x: number; y: number }>()
  const draw = (draft?: Box) => {
    const ctx = canvas.current?.getContext('2d'); const img = image.current
    if (!ctx || !img || !canvas.current) return
    ctx.drawImage(img, 0, 0, canvas.current.width, canvas.current.height)
    for (const box of [...boxes, ...(draft ? [draft] : [])]) {
      if (box.mode === 'solid') { ctx.fillStyle = '#111114'; ctx.fillRect(box.x, box.y, box.width, box.height) }
      else { ctx.save(); ctx.filter = 'blur(12px)'; ctx.drawImage(canvas.current, box.x, box.y, box.width, box.height, box.x, box.y, box.width, box.height); ctx.restore(); ctx.fillStyle = 'rgba(17,17,20,.16)'; ctx.fillRect(box.x, box.y, box.width, box.height) }
    }
  }
  useEffect(() => { if (open && !dialog.current?.open) dialog.current?.showModal(); if (!open && dialog.current?.open) dialog.current.close() }, [open])
  useEffect(() => {
    if (!open) return
    const url = URL.createObjectURL(evidence.originalBlob); const img = new Image()
    img.onload = () => { image.current = img; if (canvas.current) { const max = 1200; const scale = Math.min(1, max / img.naturalWidth); canvas.current.width = Math.round(img.naturalWidth * scale); canvas.current.height = Math.round(img.naturalHeight * scale); draw() } }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [open, evidence])
  useEffect(() => { draw() }, [boxes])
  const point = (event: React.PointerEvent) => { const rect = canvas.current!.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (canvas.current!.width / rect.width), y: (event.clientY - rect.top) * (canvas.current!.height / rect.height) } }
  const save = async () => {
    if (!canvas.current) return
    const blob = await new Promise<Blob>((resolve, reject) => canvas.current!.toBlob(value => value ? resolve(value) : reject(new Error('Could not render the working copy')), 'image/png'))
    const record: DerivedFileRecord = { version: DATA_VERSION, id: crypto.randomUUID(), caseId: evidence.caseId, evidenceId: evidence.id, kind: 'working-copy', mode, filename: `${evidence.filename.replace(/\.[^.]+$/, '')}-redacted.png`, mimeType: 'image/png', size: blob.size, createdAt: new Date().toISOString(), sha256: await sha256Blob(blob), blob }
    onSave(record); announce('Redacted working copy saved separately from the original.'); onClose()
  }
  return <dialog ref={dialog} className="redaction-dialog" onCancel={event => { event.preventDefault(); onClose() }}>
    <header><div><p className="eyebrow">Working copy editor</p><h2>Redact a separate copy</h2><p>The original remains available and unchanged.</p></div><button className="icon-button" onClick={onClose}>Close</button></header>
    <div className="redaction-toolbar" aria-label="Redaction controls"><div role="group" aria-label="Redaction mode"><button className={mode === 'solid' ? 'selected' : ''} onClick={() => setMode('solid')}>Solid cover</button><button className={mode === 'blur' ? 'selected' : ''} onClick={() => setMode('blur')}>Blur</button></div><button disabled={!boxes.length} onClick={() => { const last = boxes.at(-1); if (last) { setRedo(current => [...current, last]); setBoxes(current => current.slice(0, -1)) } }}>Undo</button><button disabled={!redo.length} onClick={() => { const next = redo.at(-1); if (next) { setBoxes(current => [...current, next]); setRedo(current => current.slice(0, -1)) } }}>Redo</button><button disabled={!boxes.length} onClick={() => { setBoxes([]); setRedo([]) }}>Reset</button></div>
    <div className="canvas-wrap"><canvas ref={canvas} aria-label="Image redaction canvas. Drag to place a rectangle." onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setStart(point(e)) }} onPointerMove={e => { if (!start) return; const end = point(e); draw({ x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y), mode }) }} onPointerUp={e => { if (!start) return; const end = point(e); const box = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y), mode }; if (box.width > 4 && box.height > 4) setBoxes(current => [...current, box]); setRedo([]); setStart(undefined) }}/></div>
    <footer><p>{boxes.length} redaction {boxes.length === 1 ? 'area' : 'areas'}</p><button className="button" onClick={save} disabled={!boxes.length}>Save working copy</button></footer>
  </dialog>
}
