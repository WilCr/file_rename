import { signToken, verifyPassword } from '../../lib/server/auth.js'
import { prisma } from '../../lib/server/prisma.js'

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body || {}
    if (!email || typeof email !== 'string' || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken({ id: user.id, email: user.email })

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscriptionTier,
        billingPortalAvailable: !!user.stripeCustomerId,
      },
    })
  } catch (err) {
    console.error('login:', err)
    return res.status(500).json({ error: 'Login failed' })
  }
}
