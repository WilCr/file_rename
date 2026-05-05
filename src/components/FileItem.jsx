import { memo, useMemo } from 'react'
import { ArrowRight, Sparkles, Trash2 } from 'lucide-react'
import { getTypeBadgeLabel } from '../utils/fileUtils'

/**
 * @param {{
 *   id: string,
 *   originalName: string,
 *   mime: string,
 *   newStem: string,
 *   owner: string,
 *   suggested: boolean,
 *   previewName: string,
 *   disabled?: boolean,
 *   onStemChange: (id: string, v: string) => void,
 *   onOwnerChange: (id: string, v: string) => void,
 *   onRemove: (id: string) => void,
 * }} props
 */
function FileItemInner({
  id,
  originalName,
  mime,
  newStem,
  owner,
  suggested,
  previewName,
  disabled,
  onStemChange,
  onOwnerChange,
  onRemove,
}) {
  const ext = useMemo(() => {
    const lastDot = originalName.lastIndexOf('.')
    if (lastDot <= 0) return ''
    return originalName.slice(lastDot)
  }, [originalName])

  const badge = useMemo(() => getTypeBadgeLabel(originalName, mime), [originalName, mime])

  const renamed = previewName !== originalName || suggested

  return (
    <li className="file-row-enter group flex min-h-[3.25rem] flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex-nowrap sm:gap-3 sm:px-4">
      <span className="inline-flex w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 px-1.5 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600">
        {badge}
      </span>
      <span className="min-w-0 max-w-[min(100%,12rem)] truncate text-sm text-slate-700 sm:max-w-[14rem]" title={originalName}>
        {originalName}
      </span>
      <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" aria-hidden />
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <input
          type="text"
          value={newStem}
          onChange={(e) => onStemChange(id, e.target.value)}
          disabled={disabled}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent py-1 text-sm font-medium text-violet-700 outline-none placeholder:text-violet-400 focus:border-violet-200 focus:bg-violet-50/50 disabled:opacity-50"
          aria-label={`New name for ${originalName}`}
          autoComplete="off"
        />
        <span className="shrink-0 text-sm font-medium text-violet-600/90 tabular-nums">{ext || ''}</span>
        {suggested && (
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-500" aria-label="AI suggested" title="AI suggested" />
        )}
      </div>
      <label className="sr-only" htmlFor={`owner-${id}`}>
        Owner (optional) for {originalName}
      </label>
      <input
        id={`owner-${id}`}
        type="text"
        value={owner}
        onChange={(e) => onOwnerChange(id, e.target.value)}
        disabled={disabled}
        placeholder="Owner"
        className="hidden w-24 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-violet-300 md:block md:w-28"
      />
      <span
        className={`ml-auto shrink-0 text-right text-xs font-semibold sm:ml-0 ${renamed ? 'text-emerald-600' : 'text-slate-400'}`}
      >
        {renamed ? 'renamed' : 'ready'}
      </span>
      <button
        type="button"
        onClick={() => onRemove(id)}
        disabled={disabled}
        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50"
        aria-label={`Remove ${originalName}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}

export const FileItem = memo(FileItemInner)
