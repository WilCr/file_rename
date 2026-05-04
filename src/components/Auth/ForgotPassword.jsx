import { useState } from 'react'
import { requestPasswordReset } from '../../services/auth'

/**
 * @param {{ onClose: () => void }} props
 */
export default function ForgotPassword({ onClose }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [devResetUrl, setDevResetUrl] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setDevResetUrl(null)
    try {
      const data = await requestPasswordReset(email)
      setDone(true)
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl)
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-labelledby="forgot-title"
      >
        <h2 id="forgot-title" className="font-display text-xl font-semibold text-slate-900">
          Reset password
        </h2>

        {!done ? (
          <>
            <p className="mt-3 text-sm text-slate-600">
              Enter your account email. We will send a one-time link to set a new password (expires in one hour).
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-600">
              If an account exists for that email, a reset link has been sent. Check your inbox (and spam folder).
            </p>
            {devResetUrl && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <p className="font-medium">Development mode</p>
                <p className="mt-1 text-amber-900/90">
                  Email was not sent (configure <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> and{' '}
                  <code className="rounded bg-amber-100 px-1">EMAIL_FROM</code>). Open this link to reset:
                </p>
                <a
                  href={devResetUrl}
                  className="mt-2 block break-all text-violet-700 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {devResetUrl}
                </a>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
