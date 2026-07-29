import { signToken, verifyPassword } from '../../lib/server/auth.js'
import { getJsonBody, mapAuthDbError } from '../../lib/server/parseBody.js'
import { prisma } from '../../lib/server/prisma.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = getJsonBody(req)
    const { email, password } = body
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
    const mapped = mapAuthDbError(err)
    return res.status(500).json({
      error: mapped || 'Login failed',
      ...(mapped ? { detail: mapped } : process.env.NODE_ENV !== 'production' && err instanceof Error
        ? { detail: err.message.slice(0, 200) }
        : {}),
    })
  }
}
