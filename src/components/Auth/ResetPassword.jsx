import { useState } from 'react'
import { resetPasswordWithToken } from '../../services/auth'

/**
 * @param {{
 *   token: string,
 *   onClose: () => void,
 *   onSuccess: () => void,
 * }} props
 */
export default function ResetPassword({ token, onClose, onSuccess }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await resetPasswordWithToken(token, password)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err?.message || 'Could not reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-labelledby="reset-title"
      >
        <h2 id="reset-title" className="font-display text-xl font-semibold text-slate-900">
          Choose a new password
        </h2>
        <p className="mt-2 text-sm text-slate-600">Your reset link is valid for a limited time.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reset-password" className="block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div>
            <label htmlFor="reset-confirm" className="block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
              {loading ? 'Saving…' : 'Update password'}
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
      </div>
    </div>
  )
}
