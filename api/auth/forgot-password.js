import crypto from 'crypto'
import { prisma } from '../../lib/server/prisma.js'
import { sendPasswordResetEmail } from '../../lib/server/sendResetEmail.js'

const TOKEN_BYTES = 32
const EXPIRY_MS = 60 * 60 * 1000

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body || {}
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' })
    }

    const normalized = email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalized } })

    const generic = {
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    }

    if (!user) {
      return res.status(200).json(generic)
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    const token = crypto.randomBytes(TOKEN_BYTES).toString('hex')
    const expiresAt = new Date(Date.now() + EXPIRY_MS)

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    })

    const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')
    const resetUrl = `${appUrl}/?reset=${encodeURIComponent(token)}`

    const emailed = await sendPasswordResetEmail(user.email, resetUrl)

    if (!emailed) {
      if (process.env.NODE_ENV !== 'production') {
        console.info('[forgot-password] Email not sent (configure RESEND_API_KEY + EMAIL_FROM). Dev reset URL:', resetUrl)
        return res.status(200).json({
          ...generic,
          devResetUrl: resetUrl,
        })
      }
      console.error('[forgot-password] Email not sent; configure RESEND_API_KEY and EMAIL_FROM')
    }

    return res.status(200).json(generic)
  } catch (err) {
    console.error('forgot-password:', err)
    return res.status(500).json({ error: 'Could not process request' })
  }
}
