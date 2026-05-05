/** Characters invalid in Windows/macOS filenames */
export const INVALID_FILENAME_CHARS = /[/\\:*?"<>|]/g

/**
 * @param {string} str
 * @returns {string}
 */
export function sanitizeSegment(str) {
  if (!str) return ''
  return str
    .replace(INVALID_FILENAME_CHARS, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .trim()
}

/**
 * @param {string} filename
 * @returns {{ stem: string, ext: string }}
 */
export function splitFilename(filename) {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return { stem: filename, ext: '' }
  }
  return {
    stem: filename.slice(0, lastDot),
    ext: filename.slice(lastDot).toLowerCase(),
  }
}

/**
 * Pattern: clean — keep alphanumerics, underscores, dots
 * @param {string} stem
 * @returns {string}
 */
export function cleanStem(stem) {
  return stem
    .replace(/[^a-zA-Z0-9._]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Build final filename: optional date prefix, optional owner, then stem. All sanitized, lowercase.
 * @param {{ datePrefix?: string | null, owner?: string, stem: string, ext: string }} p
 * @returns {string}
 */
export function buildFullFilename({ datePrefix, owner, stem, ext }) {
  const s = sanitizeSegment(stem).toLowerCase()
  const o = owner ? sanitizeSegment(owner).toLowerCase() : ''
  /** @type {string[]} */
  const parts = []
  if (datePrefix) {
    const d = sanitizeSegment(datePrefix)
    if (d) parts.push(d)
  }
  if (o) parts.push(o)
  parts.push(s || 'file')
  const base = parts.join('_')
  return `${base}${ext}`
}

/**
 * Ensures unique filenames (case-insensitive).
 * @param {string[]} fullNames
 * @returns {string[]}
 */
export function resolveDuplicateNames(fullNames) {
  const used = new Map()
  return fullNames.map((full) => {
    const { stem, ext } = splitFilename(full)
    let base = stem
    let candidate = `${base}${ext}`
    let n = 1
    const key = (s) => s.toLowerCase()
    while (used.has(key(candidate))) {
      candidate = `${base}_${n}${ext}`
      n += 1
    }
    used.set(key(candidate), true)
    return candidate
  })
}

/**
 * Short label for file rows (PDF, DOC, IMG, …)
 * @param {string} name
 * @param {string} mime
 */
export function getTypeBadgeLabel(name, mime) {
  const { ext } = splitFilename(name)
  const e = ext.replace(/^\./, '').toUpperCase()
  if (e === 'PDF') return 'PDF'
  if (e === 'DOC' || e === 'DOCX') return 'DOC'
  if (mime.startsWith('image/') || /^(JPG|JPEG|PNG|GIF|WEBP|SVG|HEIC)$/i.test(e)) return 'IMG'
  if (/^(XLS|XLSX|CSV)$/i.test(e)) return 'XLS'
  if (/^(PPT|PPTX)$/i.test(e)) return 'PPT'
  if (mime.startsWith('video/') || /^(MP4|MOV|WEBM|MKV)$/i.test(e)) return 'VID'
  if (mime.startsWith('audio/') || /^(MP3|WAV|FLAC|AAC|OGG)$/i.test(e)) return 'AUD'
  if (/^(ZIP|RAR|7Z|TAR|GZ)$/i.test(e)) return 'ZIP'
  if (e && e.length <= 4) return e.slice(0, 4)
  return 'FILE'
}

export function getFileCategory(mime, name) {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    /\.(xlsx?|csv)$/i.test(name)
  ) {
    return 'spreadsheet'
  }
  if (mime.includes('presentation') || /\.pptx?$/i.test(name)) {
    return 'presentation'
  }
  if (mime.includes('zip') || mime.includes('compressed') || /\.(zip|rar|7z)$/i.test(name)) {
    return 'archive'
  }
  if (
    mime.includes('javascript') ||
    mime.includes('json') ||
    /\.(js|ts|tsx|jsx|py|rs|go)$/i.test(name)
  ) {
    return 'code'
  }
  if (mime.includes('pdf') || mime.includes('word') || mime.includes('text') || mime.includes('document')) {
    return 'document'
  }
  if (/\.(pdf|docx?|txt|md|rtf)$/i.test(name)) return 'document'
  return 'other'
}

const MB = 1024 * 1024
export const LARGE_FILE_BYTES = 50 * MB

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / MB).toFixed(1)} MB`
}

/**
 * @param {'date'|'sequential'|'lowercase'|'clean'} pattern
 * @param {string} stem
 * @param {{ index: number, dateStr?: string }} ctx
 * @returns {{ stem: string, datePrefix: string | null }}
 */
export function applyNamingPattern(pattern, stem, ctx) {
  const { index, dateStr } = ctx
  const today = dateStr || new Date().toISOString().slice(0, 10)
  switch (pattern) {
    case 'date': {
      const rest = sanitizeSegment(stem).toLowerCase().replace(/\s+/g, '_')
      return { stem: rest, datePrefix: today }
    }
    case 'sequential': {
      const n = String(index + 1).padStart(3, '0')
      return { stem: `file_${n}`, datePrefix: null }
    }
    case 'lowercase':
      return {
        stem: sanitizeSegment(stem).toLowerCase().replace(/\s+/g, '_'),
        datePrefix: null,
      }
    case 'clean':
      return {
        stem: cleanStem(sanitizeSegment(stem)).toLowerCase(),
        datePrefix: null,
      }
    default:
      return { stem, datePrefix: null }
  }
}
