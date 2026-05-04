/**
 * @param {{ onUpgrade: () => void, onDismiss?: () => void }} props
 */
export default function UpgradePrompt({ onUpgrade, onDismiss }) {
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-violet-950">You have reached your AI rename limit for this month.</p>
          <p className="mt-1 text-sm text-violet-900/80">Upgrade for more renames or wait until next month.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onUpgrade}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            View plans
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm text-violet-900 hover:bg-violet-100/80"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
