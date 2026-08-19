import { hashPassword } from '../../lib/server/auth.js'
import { getJsonBody } from '../../lib/server/parseBody.js'
import { prisma } from '../../lib/server/prisma.js'
import { consumeRateLimit, getClientIp, tooManyRequests } from '../../lib/server/rateLimit.js'
import { hashSecretToken } from '../../lib/server/tokens.js'

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
    const ipLimit = await consumeRateLimit(`reset:ip:${ip}`, 10, 60 * 60 * 1000)
    if (!ipLimit.ok) return tooManyRequests(res, ipLimit.retryAfterSec)

    const { token, password } = getJsonBody(req)
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Reset token is required' })
    }
    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be 8–128 characters' })
    }

    const tokenHash = hashSecretToken(token.trim())
    const row = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    })

    if (!row || row.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Request a new one.' })
    }

    const passwordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
    ])

    return res.status(200).json({ ok: true, message: 'Password updated. You can sign in now.' })
  } catch (err) {
    console.error('reset-password:', err)
    return res.status(500).json({ error: 'Could not reset password' })
  }
}
