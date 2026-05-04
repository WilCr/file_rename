import { useEffect, useState } from 'react'
import { checkUsage } from '../../services/api'

/**
 * @param {string | null} token
 * @param {number} [refreshKey]
 * @param {() => void} [onUpgradeClick]
 */
export default function UsageIndicator({ token, refreshKey = 0, onUpgradeClick }) {
  const [usage, setUsage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await checkUsage(token)
        if (!cancelled) {
          setUsage(data)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load usage')
          setUsage(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, refreshKey])

  if (!token) return null
  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        {error}
      </div>
    )
  }
  if (!usage) return null

  const percentage = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0
  const isNearLimit = percentage > 80

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">AI renames this month</span>
        <span className={`text-sm font-bold ${isNearLimit ? 'text-red-600' : 'text-slate-900'}`}>
          {usage.used} / {usage.limit === 999999 ? '∞' : usage.limit}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-[calc(100%)] rounded-full transition-all ${isNearLimit ? 'bg-red-500' : 'bg-violet-600'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="mt-2 text-xs text-red-600">
          You are running low on credits.{' '}
          {onUpgradeClick ? (
            <button type="button" onClick={onUpgradeClick} className="font-medium underline">
              Upgrade
            </button>
          ) : (
            <span>Upgrade to continue.</span>
          )}
        </p>
      )}
    </div>
  )
}
