export const DATA_VERSION = 1 as const

export type SignalStatus = 'Available' | 'Not present' | 'Inconsistent' | 'Unsupported' | 'Inconclusive'
export type EvidenceKind = 'image' | 'video' | 'audio' | 'pdf'
export type RedactionMode = 'solid' | 'blur'

export interface SafeMetadata {
  width?: number
  height?: number
  duration?: number
  capturedAt?: string
  cameraMake?: string
  cameraModel?: string
  software?: string
  gpsPresent?: boolean
  c2paDetected: boolean
  warnings: string[]
}

export interface EvidenceContext {
  description: string
  source: string
  firstSeenAt: string
  accounts: string
  privateNotes: string
}

export interface EvidenceRecord {
  version: 1
  id: string
  caseId: string
  filename: string
  mimeType: string
  kind: EvidenceKind
  size: number
  importedAt: string
  fileLastModified: string
  sha256: string
  originalBlob: Blob
  metadata: SafeMetadata
  context: EvidenceContext
}

export interface DerivedFileRecord {
  version: 1
  id: string
  caseId: string
  evidenceId: string
  kind: 'working-copy'
  mode: RedactionMode
  filename: string
  mimeType: string
  size: number
  createdAt: string
  sha256: string
  blob: Blob
}

export interface TimelineEntry {
  id: string
  occurredAt: string
  title: string
  description: string
  evidenceIds: string[]
}

export interface ReportSettings {
  evidenceIds: string[]
  timelineIds: string[]
  copyChoice: Record<string, 'original' | 'working-copy'>
  includeContext: boolean
  includeNotes: boolean
  includeMetadata: boolean
  includeHashes: boolean
}

export interface CaseRecord {
  version: 1
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  timeline: TimelineEntry[]
  report: ReportSettings
}

export interface ExportManifestFile {
  evidenceId: string
  relationship: 'original' | 'derived'
  sourceEvidenceId?: string
  path: string
  originalFilename: string
  mimeType: string
  fileSize: number
  sha256: string
  context?: Partial<EvidenceContext>
}

export interface ExportManifest {
  formatVersion: 1
  caseId: string
  exportedAt: string
  files: ExportManifestFile[]
}
