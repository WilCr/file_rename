import { getUserFromRequest } from '../../lib/server/auth.js'
import { getUsageState } from '../../lib/server/usage.js'
import { prisma } from '../../lib/server/prisma.js'

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const usage = await getUsageState(prisma, user.id, user)

    return res.status(200).json({
      used: usage.used,
      limit: usage.limit,
      remaining: usage.remaining,
      month: usage.month,
    })
  } catch (err) {
    console.error('usage check:', err)
    return res.status(500).json({ error: 'Failed to load usage' })
  }
}
