import { getJsonBody } from '../../lib/server/parseBody.js'
import { prisma } from '../../lib/server/prisma.js'
import { isEmailConfigured, sendPasswordResetEmail } from '../../lib/server/sendResetEmail.js'
import { getTrustedAppUrl, isLocalDev } from '../../lib/server/appUrl.js'
import { consumeRateLimit, getClientIp, tooManyRequests } from '../../lib/server/rateLimit.js'
import { hashSecretToken, newResetToken } from '../../lib/server/tokens.js'

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
    const ip = getClientIp(req)
    const ipLimit = await consumeRateLimit(`forgot:ip:${ip}`, 10, 60 * 60 * 1000)
    if (!ipLimit.ok) return tooManyRequests(res, ipLimit.retryAfterSec)

    const body = getJsonBody(req)
    const { email } = body
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' })
    }

    const emailReady = isEmailConfigured()
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'

    if (!emailReady && isProd) {
      return res.status(503).json({
        error:
          'Password reset email is not configured on the server. Set RESEND_API_KEY and EMAIL_FROM in Vercel, then redeploy.',
        code: 'EMAIL_NOT_CONFIGURED',
      })
    }

    const normalized = email.trim().toLowerCase()
    const emailLimit = await consumeRateLimit(`forgot:email:${normalized}`, 5, 60 * 60 * 1000)
    if (!emailLimit.ok) return tooManyRequests(res, emailLimit.retryAfterSec)

    const user = await prisma.user.findUnique({ where: { email: normalized } })

    const generic = {
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    }

    if (!user) {
      return res.status(200).json(generic)
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    const token = newResetToken()
    const expiresAt = new Date(Date.now() + EXPIRY_MS)

    await prisma.passwordResetToken.create({
      data: { token: hashSecretToken(token), userId: user.id, expiresAt },
    })

    const appUrl = getTrustedAppUrl()
    const resetUrl = `${appUrl}/?reset=${encodeURIComponent(token)}`

    if (!emailReady) {
      if (isLocalDev()) {
        console.info('[forgot-password] Email not configured. Local reset URL:', resetUrl)
        return res.status(200).json({
          ...generic,
          emailSent: false,
          devResetUrl: resetUrl,
        })
      }
      return res.status(503).json({
        error:
          'Password reset email is not configured on the server. Set RESEND_API_KEY and EMAIL_FROM, then redeploy.',
        code: 'EMAIL_NOT_CONFIGURED',
      })
    }

    const result = await sendPasswordResetEmail(user.email, resetUrl)
    if (!result.ok) {
      console.error('[forgot-password] send failed:', result.reason, result.status)
      if (result.reason === 'invalid_from') {
        return res.status(503).json({
          error: result.message || 'EMAIL_FROM is invalid. Use an email address, not a URL.',
          code: 'EMAIL_NOT_CONFIGURED',
        })
      }
      return res.status(502).json({
        error: 'Could not send reset email. Please try again in a moment.',
        code: 'EMAIL_SEND_FAILED',
      })
    }

    return res.status(200).json({ ...generic, emailSent: true })
  } catch (err) {
    console.error('forgot-password:', err)
    return res.status(500).json({ error: 'Could not process request' })
  }
}
