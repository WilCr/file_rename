import { hashPassword } from '../../lib/server/auth.js'
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
    const { token, password } = req.body || {}
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Reset token is required' })
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const row = await prisma.passwordResetToken.findUnique({
      where: { token: token.trim() },
      include: { user: true },
    })

    if (!row || row.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Request a new one.' })
    }

    const passwordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
    ])

    return res.status(200).json({ ok: true, message: 'Password updated. You can sign in now.' })
  } catch (err) {
    console.error('reset-password:', err)
    return res.status(500).json({ error: 'Could not reset password' })
  }
}
