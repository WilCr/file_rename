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
 *     previewName: string,
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
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Files className="h-7 w-7" strokeWidth={1.25} aria-hidden />
        </div>
        <p className="font-medium text-slate-700">No files yet</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">Add files above to preview renames here.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4">
      <ul
        className="custom-scrollbar max-h-[min(60vh,520px)] space-y-2 overflow-y-auto pr-0.5"
        aria-label="Files to rename"
      >
        {items.map((item) => (
          <FileItem
            key={item.id}
            id={item.id}
            originalName={item.originalName}
            mime={item.mime}
            newStem={item.newStem}
            owner={item.owner}
            suggested={item.suggested}
            previewName={item.previewName}
            disabled={disabled}
            onStemChange={onStemChange}
            onOwnerChange={onOwnerChange}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </div>
  )
}
