import {
  Download,
  Loader2,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react'

const PATTERNS = [
  { id: 'date', label: 'Date Prefix (YYYY-MM-DD_filename)' },
  { id: 'sequential', label: 'Sequential Numbers (file_001, file_002)' },
  { id: 'lowercase', label: 'Lowercase & Underscores' },
  { id: 'clean', label: 'Clean Special Characters' },
]

/**
 * @param {{
 *   fileCount: number,
 *   disabled?: boolean,
 *   isProcessing?: boolean,
 *   processingLabel?: string,
 *   pattern: string,
 *   onPatternChange: (id: string) => void,
 *   onAISuggest: () => void,
 *   onApplyPattern: () => void,
 *   onApplyOwnerToAll: () => void,
 *   onClearAll: () => void,
 *   onDownloadAll: () => void,
 * }} props
 */
export function ControlPanel({
  fileCount,
  disabled,
  isProcessing,
  processingLabel,
  pattern,
  onPatternChange,
  onAISuggest,
  onApplyPattern,
  onApplyOwnerToAll,
  onClearAll,
  onDownloadAll,
}) {
  const busy = disabled || isProcessing

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
            aria-live="polite"
          >
            {fileCount} file{fileCount === 1 ? '' : 's'}
          </span>
          {isProcessing && (
            <span className="flex items-center gap-2 text-sm text-violet-700">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span aria-live="polite">{processingLabel}</span>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
          <button
            type="button"
            onClick={onAISuggest}
            disabled={busy || fileCount === 0}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            aria-busy={isProcessing}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            AI Suggest Names
          </button>

          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center">
            <label htmlFor="pattern-select" className="sr-only">
              Apply naming pattern
            </label>
            <select
              id="pattern-select"
              value={pattern}
              onChange={(e) => onPatternChange(e.target.value)}
              disabled={busy || fileCount === 0}
              className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
            >
              {PATTERNS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onApplyPattern}
              disabled={busy || fileCount === 0}
              className="min-h-[44px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              Apply Pattern
            </button>
          </div>

          <button
            type="button"
            onClick={onApplyOwnerToAll}
            disabled={busy || fileCount === 0}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Apply Owner to All
          </button>

          <button
            type="button"
            onClick={onClearAll}
            disabled={busy || fileCount === 0}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Clear All
          </button>

          <button
            type="button"
            onClick={onDownloadAll}
            disabled={busy || fileCount === 0}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download All
          </button>
        </div>
      </div>
    </div>
  )
}
