import { Download, Loader2, Sparkles } from 'lucide-react'

const PATTERNS = [
  { id: 'date', label: 'Date Prefix (YYYY-MM-DD_filename)' },
  { id: 'sequential', label: 'Sequential Numbers (file_001, file_002)' },
  { id: 'lowercase', label: 'Lowercase & underscores' },
  { id: 'clean', label: 'Clean Special Characters' },
]

const outlineBtn =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45'

/**
 * @param {{
 *   fileCount: number,
 *   disabled?: boolean,
 *   isProcessing?: boolean,
 *   processingLabel?: string,
 *   pattern: string,
 *   onPatternChange: (id: string) => void,
 *   onAISuggest: () => void,
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
  onDownloadAll,
}) {
  const busy = disabled || isProcessing

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <label htmlFor="pattern-select" className="sr-only">
        Naming convention
      </label>
      <select
        id="pattern-select"
        value={pattern}
        onChange={(e) => onPatternChange(e.target.value)}
        disabled={busy || fileCount === 0}
        className="min-h-[44px] min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-45"
      >
        {PATTERNS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {isProcessing && (
          <span className="flex items-center gap-2 text-sm text-violet-800">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            <span aria-live="polite">{processingLabel}</span>
          </span>
        )}
        <button
          type="button"
          onClick={onAISuggest}
          disabled={busy || fileCount === 0}
          className={outlineBtn}
          aria-busy={isProcessing}
        >
          <Sparkles className="h-4 w-4 text-violet-600" aria-hidden />
          AI suggest names
        </button>
        <button type="button" onClick={onDownloadAll} disabled={busy || fileCount === 0} className={outlineBtn}>
          <Download className="h-4 w-4" aria-hidden />
          Download all
        </button>
      </div>
    </div>
  )
}
