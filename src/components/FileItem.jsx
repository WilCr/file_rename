import { memo, useMemo } from 'react'
import {
  Archive,
  AudioWaveform,
  Code2,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Presentation,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react'
import { formatFileSize, getFileCategory } from '../utils/fileUtils'

/**
 * @param {{ mime: string, name: string }} p
 */
function TypeIcon({ mime, name }) {
  const cat = getFileCategory(mime, name)
  const map = {
    image: ImageIcon,
    document: FileText,
    spreadsheet: FileSpreadsheet,
    presentation: Presentation,
    archive: Archive,
    code: Code2,
    audio: AudioWaveform,
    video: Video,
    other: FileText,
  }
  const Icon = map[cat] || FileText
  const label = `${cat} file`
  return <Icon className="h-5 w-5 text-slate-500" aria-label={label} title={label} />
}

/**
 * @param {{
 *   id: string,
 *   originalName: string,
 *   size: number,
 *   mime: string,
 *   newStem: string,
 *   owner: string,
 *   suggested: boolean,
 *   disabled?: boolean,
 *   onStemChange: (id: string, v: string) => void,
 *   onOwnerChange: (id: string, v: string) => void,
 *   onRemove: (id: string) => void,
 * }} props
 */
function FileItemInner({
  id,
  originalName,
  size,
  mime,
  newStem,
  owner,
  suggested,
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

  return (
    <li className="file-row-enter flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <TypeIcon mime={mime} name={originalName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800" title={originalName}>
            {originalName}
          </p>
          <p className="text-xs text-slate-500">{formatFileSize(size)}</p>
        </div>
      </div>

      <div className="grid w-full gap-3 sm:max-w-xl sm:flex-1 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
            New filename
            {suggested && (
              <Sparkles
                className="h-3.5 w-3.5 text-violet-500"
                aria-label="AI suggested"
                title="AI suggested"
              />
            )}
          </span>
          <div className="flex rounded-lg border border-slate-200 bg-white focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/20">
            <input
              type="text"
              value={newStem}
              onChange={(e) => onStemChange(id, e.target.value)}
              disabled={disabled}
              className="min-w-0 flex-1 rounded-l-lg px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-50"
              aria-label={`New filename for ${originalName}`}
              autoComplete="off"
            />
            <span className="flex items-center rounded-r-lg bg-slate-50 px-2.5 text-xs text-slate-500 tabular-nums">
              {ext || ' '}
            </span>
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Owner / person (optional)</span>
          <input
            type="text"
            value={owner}
            onChange={(e) => onOwnerChange(id, e.target.value)}
            disabled={disabled}
            placeholder="e.g. sarah_johnson"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 disabled:bg-slate-50"
            aria-label={`Owner for ${originalName}`}
            autoComplete="off"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => onRemove(id)}
        disabled={disabled}
        className="self-end rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50 sm:self-center"
        aria-label={`Remove ${originalName}`}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </li>
  )
}

export const FileItem = memo(FileItemInner)
