import { useState } from 'react'
import { register } from '../../services/auth'

/**
 * @param {{
 *   onClose: () => void,
 *   onSuccess: (data: { user: object }) => void,
 *   onSwitchToLogin: () => void,
 * }} props
 */
export default function Register({ onClose, onSuccess, onSwitchToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await register(email, password, name || undefined)
      onSuccess(data)
      onClose()
    } catch (err) {
      setError(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-labelledby="register-title"
      >
        <h2 id="register-title" className="font-display text-xl font-semibold text-slate-900">
          Create account
        </h2>
        <p className="mt-1 text-sm text-slate-600">Free tier includes 10 AI renames per month.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700">
              Name <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
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
              {loading ? 'Creating…' : 'Create account'}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="text-violet-600 hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
