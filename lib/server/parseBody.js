/**
 * Vercel Node handlers sometimes expose JSON as string/Buffer or leave body empty.
 * @param {import('http').IncomingMessage & { body?: unknown }} req
 */
export function getJsonBody(req) {
  const b = req.body
  if (b == null) return {}
  if (typeof b === 'object' && !Buffer.isBuffer(b)) return /** @type {Record<string, unknown>} */ (b)
  if (typeof b === 'string') {
    try {
      const parsed = JSON.parse(b || '{}')
      return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
      return {}
    }
  }
  if (Buffer.isBuffer(b)) {
    try {
      const parsed = JSON.parse(b.toString('utf8') || '{}')
      return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

/**
 * @param {unknown} err
 * @returns {string | null} Safe message for API JSON or null to use generic
 */
export function mapAuthDbError(err) {
  const msg = typeof err?.message === 'string' ? err.message : ''
  if (msg.includes('JWT_SECRET') || msg.includes('not configured')) {
    return 'Sign-up is not fully configured on the server (missing JWT_SECRET).'
  }
  const code = err?.code
  if (code === 'P2002') return 'Email already registered'
  // Prisma connection / auth / unreachable
  if (typeof code === 'string' && /^P10\d\d$/.test(code)) {
    return 'Cannot reach the database. Check DATABASE_URL on the server and try again.'
  }
  if (typeof code === 'string' && ['P2024', 'P2034'].includes(code)) {
    return 'Database is busy or unavailable. Please try again in a moment.'
  }
  if (/Can't reach database|ECONNREFUSED|ENOTFOUND|P1001|P1000/i.test(msg)) {
    return 'Cannot reach the database. Check DATABASE_URL on the server and try again.'
  }
  return null
}
