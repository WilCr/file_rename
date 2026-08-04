import { useEffect } from 'react'
import privacySource from '../../PRIVACY.md?raw'
import Markdown from './Markdown'

/**
 * @param {{ onClose: () => void }} props
 */
export default function PrivacyModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Privacy note"
      >
        <div className="overflow-y-auto p-6">
          <Markdown source={privacySource} />
        </div>
        <div className="border-t border-slate-100 p-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
