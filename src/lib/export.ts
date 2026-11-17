import JSZip from 'jszip'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { CaseRecord, DerivedFileRecord, EvidenceRecord, ExportManifest, ExportManifestFile, TimelineEntry } from '../types'
import { sha256Blob } from './hash'

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, '_')

export function selectedTimeline(caseRecord: CaseRecord): TimelineEntry[] {
  return caseRecord.timeline.filter(item => caseRecord.report.timelineIds.includes(item.id))
}

export async function generateReportPdf(caseRecord: CaseRecord, evidence: EvidenceRecord[]): Promise<Blob> {
  const pdf = await PDFDocument.create()
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const pink = rgb(0.73, 0.27, 0.45)
  const dark = rgb(0.12, 0.11, 0.12)
  const muted = rgb(0.38, 0.36, 0.38)
  let page = pdf.addPage([612, 792]); let y = 730
  const draw = (text: string, size = 10, font = regular, color = dark) => {
    if (y < 70) { page = pdf.addPage([612, 792]); y = 730 }
    const lines = text.match(/.{1,88}(?:\s|$)/g) ?? [text]
    for (const line of lines) { page.drawText(line.trim(), { x: 54, y, size, font, color }); y -= size + 6 }
  }
  draw('trace', 24, bold, pink); draw(caseRecord.title, 22, bold); y -= 6
  draw(`Generated locally ${new Date().toLocaleString()}`, 9, regular, muted)
  draw(caseRecord.description || 'No case summary was included.', 11); y -= 14
  if (selectedTimeline(caseRecord).length) { draw('Selected timeline', 15, bold); for (const item of selectedTimeline(caseRecord)) { draw(`${item.occurredAt || 'Date not supplied'}  ${item.title}`, 11, bold); draw(item.description, 10) } y -= 10 }
  draw('Selected evidence', 15, bold)
  for (const item of evidence) {
    draw(item.filename, 11, bold)
    draw(item.context.description || 'No caption supplied.', 10)
    if (caseRecord.report.includeContext) draw(`Source: ${item.context.source || 'Not supplied'} | First seen: ${item.context.firstSeenAt || 'Not supplied'} | Accounts: ${item.context.accounts || 'Not supplied'}`, 9, regular, muted)
    if (caseRecord.report.includeNotes && item.context.privateNotes) draw(`Included note: ${item.context.privateNotes}`, 9)
    if (caseRecord.report.includeMetadata) draw(`Type: ${item.mimeType} | Size: ${item.size} bytes | Imported: ${item.importedAt}`, 9, regular, muted)
    if (caseRecord.report.includeHashes) draw(`SHA-256: ${item.sha256}`, 8, regular, muted)
    y -= 10
  }
  y -= 10; draw('Limitations', 14, bold)
  draw('trace records integrity without judging whether content is true. Metadata may be absent, altered, or unsupported. Visual manipulation detection is not available in this MVP. This report is not legal advice or a forensic determination.', 9, regular, muted)
  const pages = pdf.getPages()
  pages.forEach((p, index) => p.drawText(`Generated locally by trace  |  ${index + 1} of ${pages.length}`, { x: 54, y: 28, size: 8, font: regular, color: muted }))
  return new Blob([new Uint8Array(await pdf.save())], { type: 'application/pdf' })
}

export async function buildManifest(caseRecord: CaseRecord, evidence: EvidenceRecord[], derived: DerivedFileRecord[], exportedAt = new Date().toISOString()): Promise<ExportManifest> {
  const files: ExportManifestFile[] = []
  for (const item of evidence) {
    const choice = caseRecord.report.copyChoice[item.id] ?? 'original'
    const working = derived.find(file => file.evidenceId === item.id)
    const useDerived = choice === 'working-copy' && working
    const blob = useDerived ? working.blob : item.originalBlob
    const filename = useDerived ? working.filename : item.filename
    files.push({
      evidenceId: useDerived ? working.id : item.id,
      relationship: useDerived ? 'derived' : 'original',
      sourceEvidenceId: useDerived ? item.id : undefined,
      path: `${useDerived ? 'derived' : 'originals'}/${safeName(filename)}`,
      originalFilename: item.filename,
      mimeType: blob.type || (useDerived ? working.mimeType : item.mimeType),
      fileSize: blob.size,
      sha256: await sha256Blob(blob),
      context: caseRecord.report.includeContext ? { description: item.context.description, source: item.context.source, firstSeenAt: item.context.firstSeenAt, accounts: item.context.accounts, ...(caseRecord.report.includeNotes ? { privateNotes: item.context.privateNotes } : {}) } : undefined,
    })
  }
  return { formatVersion: 1, caseId: caseRecord.id, exportedAt, files }
}

export async function generateZip(caseRecord: CaseRecord, evidence: EvidenceRecord[], derived: DerivedFileRecord[], pdf: Blob): Promise<Blob> {
  const zip = new JSZip()
  const manifest = await buildManifest(caseRecord, evidence, derived)
  zip.file('trace-report.pdf', pdf)
  for (const entry of manifest.files) {
    const original = evidence.find(item => item.id === (entry.sourceEvidenceId ?? entry.evidenceId))!
    const derivedFile = derived.find(item => item.id === entry.evidenceId)
    zip.file(entry.path, derivedFile?.blob ?? original.originalBlob)
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))
  zip.file('README.txt', 'trace evidence package\n\nGenerated entirely in your browser. SHA-256 values describe the included files. They do not verify that content is true or authentic. Keep this package only where you intend to share it.\n')
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}
