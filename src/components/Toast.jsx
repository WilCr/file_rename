import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

/**
 * @typedef {{ id: string, message: string, type: 'success' | 'error' | 'info' }} ToastItem
 */

/**
 * @param {{
 *   toasts: ToastItem[],
 *   onDismiss: (id: string) => void,
 * }} props
 */
export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

/**
 * @param {{ toast: ToastItem, onDismiss: (id: string) => void }} props
 */
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const ms = toast.type === 'error' ? 8000 : 5000
    const id = setTimeout(() => onDismiss(toast.id), ms)
    return () => clearTimeout(id)
  }, [toast.id, toast.type, onDismiss])

  const styles =
    toast.type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : toast.type === 'error'
        ? 'border-red-200 bg-red-50 text-red-900'
        : 'border-slate-200 bg-white text-slate-800'

  const Icon =
    toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${styles}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <p className="flex-1 text-sm leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-md p-1 text-current opacity-70 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
