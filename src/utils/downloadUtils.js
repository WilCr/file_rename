/**
 * Trigger a single file download in the browser.
 * @param {Blob|File} blob
 * @param {string} filename
 * @returns {Promise<void>}
 */
export function downloadBlob(blob, filename) {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.rel = 'noopener'
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      requestAnimationFrame(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        resolve()
      })
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Download files one-by-one with delay to reduce browser blocking.
 * @param {{ file: File, filename: string }[]} items
 * @param {{ delayMs?: number, onProgress?: (index: number, total: number) => void }} [opts]
 * @returns {Promise<void>}
 */
export async function downloadAllSequential(items, opts = {}) {
  const delayMs = opts.delayMs ?? 400
  const total = items.length
  for (let i = 0; i < total; i += 1) {
    const { file, filename } = items[i]
    opts.onProgress?.(i + 1, total)
    await downloadBlob(file, filename)
    if (i < total - 1) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}
