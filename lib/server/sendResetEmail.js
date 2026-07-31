import { Resend } from 'resend'

/**
 * @param {string} from
 */
function isValidFromAddress(from) {
  // Accept "Name <email@domain>" or bare "email@domain"
  if (!from || /^https?:\/\//i.test(from)) return false
  return /<?[^\s<>]+@[^\s<>]+\.[^\s<>]+>?/.test(from)
}

/**
 * Send password reset email via Resend when RESEND_API_KEY + EMAIL_FROM are set.
 * @param {string} to
 * @param {string} resetUrl
 * @returns {Promise<{ ok: boolean, reason?: string, status?: number, message?: string }>}
 */
export async function sendPasswordResetEmail(to, resetUrl) {
  const key = typeof process.env.RESEND_API_KEY === 'string' ? process.env.RESEND_API_KEY.trim() : ''
  const from = typeof process.env.EMAIL_FROM === 'string' ? process.env.EMAIL_FROM.trim() : ''
  if (!key || !from) {
    return { ok: false, reason: 'missing_config' }
  }
  if (!isValidFromAddress(from)) {
    return {
      ok: false,
      reason: 'invalid_from',
      message:
        'EMAIL_FROM must be an email address (e.g. AI Renamer <onboarding@resend.dev>), not a website URL.',
    }
  }

  try {
    const resend = new Resend(key)
    const { error } = await resend.emails.send({
      from,
      to,
      subject: 'Reset your AI File Renamer password',
      html: `<p>Click the link below to choose a new password. It expires in one hour.</p>
<p><a href="${resetUrl}">Reset password</a></p>
<p style="color:#64748b;font-size:12px;">If you did not request this, you can ignore this email.</p>`,
    })

    if (error) {
      console.error('[sendResetEmail] Resend error', error)
      return {
        ok: false,
        reason: 'provider_error',
        status: error.statusCode,
        message: typeof error.message === 'string' ? error.message.slice(0, 240) : undefined,
      }
    }

    return { ok: true }
  } catch (err) {
    console.error('[sendResetEmail]', err)
    return { ok: false, reason: 'network_error' }
  }
}

export function isEmailConfigured() {
  const key = typeof process.env.RESEND_API_KEY === 'string' ? process.env.RESEND_API_KEY.trim() : ''
  const from = typeof process.env.EMAIL_FROM === 'string' ? process.env.EMAIL_FROM.trim() : ''
  return Boolean(key && from && isValidFromAddress(from))
}
