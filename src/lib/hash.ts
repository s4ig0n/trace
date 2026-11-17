const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('')

export async function sha256Blob(blob: Blob, onProgress?: (percent: number) => void): Promise<string> {
  const chunkSize = 4 * 1024 * 1024
  const chunks: Uint8Array[] = []
  let offset = 0
  while (offset < blob.size) {
    const next = Math.min(offset + chunkSize, blob.size)
    chunks.push(new Uint8Array(await blob.slice(offset, next).arrayBuffer()))
    offset = next
    onProgress?.(Math.round((offset / Math.max(blob.size, 1)) * 90))
    await new Promise<void>(resolve => setTimeout(resolve, 0))
  }
  const joined = new Uint8Array(blob.size)
  let position = 0
  for (const chunk of chunks) { joined.set(chunk, position); position += chunk.length }
  const digest = await crypto.subtle.digest('SHA-256', joined)
  onProgress?.(100)
  return toHex(digest)
}
