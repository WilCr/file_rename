import { hashPassword, signToken } from '../../lib/server/auth.js'
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
    const { email, password, name } = req.body || {}
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' })
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        name: typeof name === 'string' ? name.trim() || null : null,
      },
    })

    const token = signToken({ id: user.id, email: user.email })

    return res.status(201).json({
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
    console.error('register:', err)
    return res.status(500).json({ error: 'Registration failed' })
  }
}
