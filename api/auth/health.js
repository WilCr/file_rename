import { isEmailConfigured } from '../../lib/server/sendResetEmail.js'

/**
 * Lightweight config check (does not expose secret values).
 * GET /api/auth/health
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const jwtConfigured = Boolean(
    typeof process.env.JWT_SECRET === 'string' && process.env.JWT_SECRET.trim(),
  )
  const databaseConfigured = Boolean(
    (typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.trim()) ||
      (typeof process.env.POSTGRES_PRISMA_URL === 'string' && process.env.POSTGRES_PRISMA_URL.trim()),
  )
  const emailConfigured = isEmailConfigured()
  const appUrlConfigured = Boolean(typeof process.env.APP_URL === 'string' && process.env.APP_URL.trim())

  return res.status(200).json({
    ok: jwtConfigured && databaseConfigured,
    jwtConfigured,
    databaseConfigured,
    emailConfigured,
    appUrlConfigured,
  })
}
