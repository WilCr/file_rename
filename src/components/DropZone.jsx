import { useCallback, useRef } from 'react'
import { Upload } from 'lucide-react'

/**
 * @param {{
 *   disabled?: boolean,
 *   isDragging: boolean,
 *   onDraggingChange: (v: boolean) => void,
 *   onFiles: (files: FileList | File[]) => void,
 * }} props
 */
export function DropZone({ disabled, isDragging, onDraggingChange, onFiles }) {
  const inputRef = useRef(null)

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) onDraggingChange(true)
    },
    [disabled, onDraggingChange],
  )

  const handleDragLeave = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      onDraggingChange(false)
    },
    [onDraggingChange],
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      onDraggingChange(false)
      if (disabled) return
      const { files } = e.dataTransfer
      if (files?.length) onFiles(files)
    },
    [disabled, onDraggingChange, onFiles],
  )

  const handleChange = useCallback(
    (e) => {
      const { files } = e.target
      if (files?.length) onFiles(files)
      e.target.value = ''
    },
    [onFiles],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop files here or click to browse"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={[
        'group relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-14 transition-all duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500',
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-50/50 opacity-60'
          : isDragging
            ? 'scale-[1.02] border-violet-500 bg-violet-50/80 shadow-lg shadow-violet-500/15'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/80',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        disabled={disabled}
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          className={[
            'inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200',
            isDragging ? 'scale-110 bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600',
          ].join(' ')}
          aria-hidden
        >
          <Upload className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <div>
          <p className="font-medium text-slate-800">Drag & drop files here</p>
          <p className="mt-1 text-sm text-slate-500">or click to choose — multiple files supported</p>
        </div>
      </div>
    </div>
  )
}
