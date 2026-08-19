import { signToken, verifyPassword, publicUser } from '../../lib/server/auth.js'
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
    const ipLimit = await consumeRateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000)
    if (!ipLimit.ok) return tooManyRequests(res, ipLimit.retryAfterSec)

    const body = getJsonBody(req)
    const { email, password } = body
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    const normalized = email.trim().toLowerCase()
    const emailLimit = await consumeRateLimit(`login:email:${normalized}`, 8, 15 * 60 * 1000)
    if (!emailLimit.ok) return tooManyRequests(res, emailLimit.retryAfterSec)

    const user = await prisma.user.findUnique({ where: { email: normalized } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken(user)

    return res.status(200).json({
      token,
      user: publicUser(user),
    })
  } catch (err) {
    console.error('login:', err)
    const mapped = mapAuthDbError(err)
    return res.status(500).json({
      error: mapped || 'Login failed',
    })
  }
}
