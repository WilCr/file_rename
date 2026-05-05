import { useCallback, useRef } from 'react'
import { ArrowDown } from 'lucide-react'

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

  const openFilePicker = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) inputRef.current?.click()
    },
    [disabled],
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      role="presentation"
      tabIndex={disabled ? -1 : 0}
      aria-label="Drop files here or click to browse"
      className={[
        'cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:py-14',
        disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100/50 opacity-60' : 'cursor-pointer border-slate-300 bg-white',
        !disabled && isDragging ? 'scale-[1.01] border-violet-400 bg-violet-50/40' : '',
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
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={[
            'flex h-16 w-16 items-center justify-center rounded-full shadow-md transition-transform',
            isDragging ? 'scale-105 bg-violet-700' : 'bg-violet-600',
          ].join(' ')}
          aria-hidden
        >
          <ArrowDown className="h-7 w-7 text-white" strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">Drag & drop files here</p>
          <p className="mt-2 text-sm text-slate-500">
            or{' '}
            <span
              role="button"
              tabIndex={disabled ? -1 : 0}
              onClick={openFilePicker}
              onKeyDown={(e) => {
                if (disabled) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openFilePicker(e)
                }
              }}
              className={`font-medium text-blue-600 underline decoration-blue-400/50 underline-offset-2 hover:text-blue-700 ${disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
            >
              click to browse
            </span>{' '}
            — PDF, DOCX, images, any file type
          </p>
        </div>
      </div>
    </div>
  )
}
