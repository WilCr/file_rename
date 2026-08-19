import { hashPassword, signToken, publicUser } from '../../lib/server/auth.js'
import { getJsonBody, mapAuthDbError } from '../../lib/server/parseBody.js'
import { prisma } from '../../lib/server/prisma.js'
import { consumeRateLimit, getClientIp, tooManyRequests } from '../../lib/server/rateLimit.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ip = getClientIp(req)
    const ipLimit = await consumeRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000)
    if (!ipLimit.ok) return tooManyRequests(res, ipLimit.retryAfterSec)

    const body = getJsonBody(req)
    const { email, password, name } = body
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' })
    }
    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be 8–128 characters' })
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
        name: typeof name === 'string' ? name.trim().slice(0, 80) || null : null,
      },
    })

    const token = signToken(user)

    return res.status(201).json({
      token,
      user: publicUser(user),
    })
  } catch (err) {
    console.error('register:', err)
    const mapped = mapAuthDbError(err)
    return res.status(500).json({
      error: mapped || 'Registration failed',
    })
  }
}
