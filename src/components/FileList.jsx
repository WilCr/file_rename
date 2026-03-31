import { Files } from 'lucide-react'
import { FileItem } from './FileItem'

/**
 * @param {{
 *   items: Array<{
 *     id: string,
 *     originalName: string,
 *     size: number,
 *     mime: string,
 *     newStem: string,
 *     owner: string,
 *     suggested: boolean,
 *   }>,
 *   disabled?: boolean,
 *   onStemChange: (id: string, v: string) => void,
 *   onOwnerChange: (id: string, v: string) => void,
 *   onRemove: (id: string) => void,
 * }} props
 */
export function FileList({ items, disabled, onStemChange, onOwnerChange, onRemove }) {
  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/40 px-6 py-16 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Files className="h-10 w-10" strokeWidth={1.25} aria-hidden />
        </div>
        <p className="text-lg font-medium text-slate-700">No files yet</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Drag files into the zone above or click to browse. Names you set here stay on your device.
        </p>
      </div>
    )
  }

  return (
    <ul
      className="custom-scrollbar max-h-[min(60vh,560px)] space-y-3 overflow-y-auto pr-1"
      aria-label="Files to rename"
    >
      {items.map((item) => (
        <FileItem
          key={item.id}
          id={item.id}
          originalName={item.originalName}
          size={item.size}
          mime={item.mime}
          newStem={item.newStem}
          owner={item.owner}
          suggested={item.suggested}
          disabled={disabled}
          onStemChange={onStemChange}
          onOwnerChange={onOwnerChange}
          onRemove={onRemove}
        />
      ))}
    </ul>
  )
}
