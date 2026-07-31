/**
 * Send password reset email via Resend when RESEND_API_KEY + EMAIL_FROM are set.
 * @param {string} to
 * @param {string} resetUrl
 * @returns {Promise<{ ok: boolean, reason?: string, status?: number }>}
 */
export async function sendPasswordResetEmail(to, resetUrl) {
  const key = typeof process.env.RESEND_API_KEY === 'string' ? process.env.RESEND_API_KEY.trim() : ''
  const from = typeof process.env.EMAIL_FROM === 'string' ? process.env.EMAIL_FROM.trim() : ''
  if (!key || !from) {
    return { ok: false, reason: 'missing_config' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'Reset your AI File Renamer password',
        html: `<p>Click the link below to choose a new password. It expires in one hour.</p>
<p><a href="${resetUrl}">Reset password</a></p>
<p style="color:#64748b;font-size:12px;">If you did not request this, you can ignore this email.</p>`,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[sendResetEmail] Resend error', res.status, body.slice(0, 400))
      return { ok: false, reason: 'provider_error', status: res.status }
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
  return Boolean(key && from)
}
