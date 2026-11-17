import type { EvidenceKind, SafeMetadata } from '../types'

export function getEvidenceKind(type: string): EvidenceKind | null {
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  if (type === 'application/pdf') return 'pdf'
  return null
}

async function mediaDimensions(file: Blob, kind: EvidenceKind): Promise<Partial<SafeMetadata>> {
  if (kind === 'pdf') return {}
  const url = URL.createObjectURL(file)
  try {
    if (kind === 'image') {
      const image = new Image()
      image.src = url
      await image.decode()
      return { width: image.naturalWidth, height: image.naturalHeight }
    }
    const media: HTMLMediaElement = document.createElement(kind === 'video' ? 'video' : 'audio')
    media.preload = 'metadata'
    media.src = url
    await new Promise<void>((resolve, reject) => {
      media.onloadedmetadata = () => resolve()
      media.onerror = () => reject(new Error('Media metadata could not be read'))
    })
    const video = kind === 'video' ? media as HTMLVideoElement : undefined
    return { duration: Number.isFinite(media.duration) ? media.duration : undefined, ...(video ? { width: video.videoWidth, height: video.videoHeight } : {}) }
  } finally { URL.revokeObjectURL(url) }
}

export async function extractSafeMetadata(file: File, kind: EvidenceKind): Promise<SafeMetadata> {
  const result: SafeMetadata = { c2paDetected: false, warnings: [] }
  try { Object.assign(result, await mediaDimensions(file, kind)) } catch { result.warnings.push('Some media properties could not be read by this browser.') }
  if (kind === 'image') {
    try {
      const exifr = await import('exifr')
      const parsed = await exifr.parse(file, { tiff: true, exif: true, gps: false, xmp: true, icc: false })
      if (parsed) {
        result.capturedAt = parsed.DateTimeOriginal?.toISOString?.() ?? parsed.CreateDate?.toISOString?.()
        result.cameraMake = parsed.Make
        result.cameraModel = parsed.Model
        result.software = parsed.Software
        result.gpsPresent = Boolean(parsed.GPSLatitude || parsed.latitude || parsed.GPSLongitude || parsed.longitude)
        result.c2paDetected = Boolean(parsed['c2pa'] || parsed['C2PA'])
      }
    } catch { result.warnings.push('Embedded image metadata was absent or could not be safely parsed.') }
  }
  return result
}
