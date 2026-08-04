import { useState } from 'react'
import { deleteAccount } from '../../services/auth'

/**
 * @param {{ token: string, email?: string, onClose: () => void, onDeleted: () => void }} props
 */
export default function DeleteAccount({ token, email, onClose, onDeleted }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await deleteAccount(password, token)
      onDeleted()
    } catch (err) {
      setError(err?.message || 'Could not delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-labelledby="delete-account-title"
      >
        <h2 id="delete-account-title" className="font-display text-xl font-semibold text-slate-900">
          Delete account
        </h2>

        <p className="mt-3 text-sm text-slate-600">
          This permanently deletes {email ? <strong>{email}</strong> : 'your account'}, your usage
          history, and any pending reset links. An active subscription is cancelled. This cannot be
          undone.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Files on your computer are never touched — we do not store them.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="delete-password" className="block text-sm font-medium text-slate-700">
              Confirm your password
            </label>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
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
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {loading ? 'Deleting…' : 'Delete my account'}
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
