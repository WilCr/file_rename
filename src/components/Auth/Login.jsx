import { useState } from 'react'
import { login } from '../../services/auth'

/**
 * @param {{
 *   onClose: () => void,
 *   onSuccess: (data: { user: object }) => void,
 *   onSwitchToRegister: () => void,
 *   onForgotPassword: () => void,
 * }} props
 */
export default function Login({ onClose, onSuccess, onSwitchToRegister, onForgotPassword }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      onSuccess(data)
      onClose()
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-labelledby="login-title"
      >
        <h2 id="login-title" className="font-display text-xl font-semibold text-slate-900">
          Sign in
        </h2>
        <p className="mt-1 text-sm text-slate-600">Use your account to run AI-powered renames.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <button type="button" onClick={onSwitchToRegister} className="text-violet-600 hover:underline">
            Create an account
          </button>
          <span aria-hidden>·</span>
          <button type="button" onClick={onForgotPassword} className="text-slate-500 hover:underline">
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  )
}
