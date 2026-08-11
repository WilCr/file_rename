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
  const claudeConfigured = Boolean(
    (typeof process.env.CLAUDE_API_KEY === 'string' && process.env.CLAUDE_API_KEY.trim()) ||
      (typeof process.env.ANTHROPIC_API_KEY === 'string' && process.env.ANTHROPIC_API_KEY.trim()),
  )
  const stripeSecret = typeof process.env.STRIPE_SECRET_KEY === 'string' ? process.env.STRIPE_SECRET_KEY.trim() : ''
  const stripeConfigured = /^sk_(test|live)_/.test(stripeSecret)
  const stripePricesConfigured = Boolean(
    typeof process.env.STRIPE_PRICE_PRO === 'string' &&
      process.env.STRIPE_PRICE_PRO.trim() &&
      typeof process.env.STRIPE_PRICE_BUSINESS === 'string' &&
      process.env.STRIPE_PRICE_BUSINESS.trim(),
  )

  return res.status(200).json({
    ok: jwtConfigured && databaseConfigured,
    jwtConfigured,
    databaseConfigured,
    claudeConfigured,
    emailConfigured,
    appUrlConfigured,
    stripeConfigured,
    stripePricesConfigured,
  })
}
