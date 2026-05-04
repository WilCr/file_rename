/**
 * Send password reset email via Resend when RESEND_API_KEY + EMAIL_FROM are set.
 * @param {string} to
 * @param {string} resetUrl
 * @returns {Promise<boolean>} true if email was sent
 */
export async function sendPasswordResetEmail(to, resetUrl) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) {
    return false
  }

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

  return res.ok
}
