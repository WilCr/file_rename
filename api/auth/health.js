/**
 * Public liveness probe. Detailed config is not exposed.
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

  return res.status(200).json({
    ok: jwtConfigured && databaseConfigured,
  })
}
