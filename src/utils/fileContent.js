import { splitFilename } from './fileUtils'

/** Serverless request bodies are capped (~4.5MB); base64 adds ~33% overhead. */
export const MAX_INLINE_BYTES = 3 * 1024 * 1024
/** Only extracted text is uploaded for these, so the file itself can be larger. */
const MAX_ARCHIVE_BYTES = 25 * 1024 * 1024
const MAX_TEXT_CHARS = 20_000

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])
const TEXT_MIME = new Set(['application/json', 'application/xml', 'application/csv'])
const TEXT_EXT = new Set([
  '.txt',
  '.md',
  '.csv',
  '.json',
  '.xml',
  '.html',
  '.htm',
  '.log',
  '.yml',
  '.yaml',
])

/**
 * @param {File} file
 */
function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Could not read "${file.name}"`))
    reader.onload = () => {
      const result = String(reader.result || '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : '')
    }
    reader.readAsDataURL(file)
  })
}

/**
 * A .docx is a ZIP archive; the body text lives in word/document.xml. Unzipping
 * here means only the extracted text is uploaded, never the document itself.
 * JSZip is loaded on demand so it stays out of the initial bundle.
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
async function extractDocxText(file) {
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const entry = zip.file('word/document.xml')
  if (!entry) return ''

  const doc = new DOMParser().parseFromString(await entry.async('string'), 'application/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) return ''

  const paragraphs = []
  let total = 0
  for (const p of doc.getElementsByTagNameNS(WORD_NS, 'p')) {
    let line = ''
    for (const node of p.getElementsByTagNameNS(WORD_NS, '*')) {
      if (node.localName === 't') line += node.textContent || ''
      else if (node.localName === 'tab') line += '\t'
      else if (node.localName === 'br') line += '\n'
    }
    const trimmed = line.trim()
    if (!trimmed) continue
    paragraphs.push(trimmed)
    total += trimmed.length + 1
    if (total > MAX_TEXT_CHARS) break
  }

  return paragraphs.join('\n').slice(0, MAX_TEXT_CHARS)
}

/**
 * Extract content the AI can actually analyse. Falls back to `null` so the
 * caller can still request a filename-only suggestion.
 *
 * @param {File} file
 * @returns {Promise<{ kind: 'pdf' | 'image' | 'text', data: string, mediaType?: string } | null>}
 */
export async function readFileForAI(file) {
  const { ext } = splitFilename(file.name)
  const mime = file.type || ''

  const isPdf = mime === 'application/pdf' || ext === '.pdf'
  const isImage = IMAGE_MIME.has(mime) || IMAGE_EXT.has(ext)
  const isText = mime.startsWith('text/') || TEXT_MIME.has(mime) || TEXT_EXT.has(ext)
  const isDocx = mime === DOCX_MIME || ext === '.docx'

  if (isDocx) {
    if (file.size > MAX_ARCHIVE_BYTES) return null
    try {
      const text = await extractDocxText(file)
      return text.trim() ? { kind: 'text', data: text } : null
    } catch {
      return null
    }
  }

  if (!isPdf && !isImage && !isText) return null
  if (file.size > MAX_INLINE_BYTES) return null

  try {
    if (isText) {
      const text = await file.text()
      const trimmed = text.slice(0, MAX_TEXT_CHARS)
      return trimmed.trim() ? { kind: 'text', data: trimmed } : null
    }

    const data = await readAsBase64(file)
    if (!data) return null

    if (isPdf) {
      return { kind: 'pdf', data, mediaType: 'application/pdf' }
    }
    return { kind: 'image', data, mediaType: IMAGE_MIME.has(mime) ? mime : 'image/png' }
  } catch {
    return null
  }
}
