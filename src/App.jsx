import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ControlPanel } from './components/ControlPanel'
import { DropZone } from './components/DropZone'
import { FileList } from './components/FileList'
import { Header } from './components/Header'
import { ToastContainer } from './components/Toast'
import { useFileProcessor } from './hooks/useFileProcessor'
import { pushRecentOwner, useLocalStorage } from './hooks/useLocalStorage'
import { downloadAllSequential } from './utils/downloadUtils'
import {
  applyNamingPattern,
  buildFullFilename,
  LARGE_FILE_BYTES,
  resolveDuplicateNames,
  splitFilename,
} from './utils/fileUtils'

function randomId() {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function computeFinalNames(items) {
  const previews = items.map((it) => {
    const { stem: origStem, ext } = splitFilename(it.originalName)
    const extUse = ext || ''
    const stemUse = it.newStem || origStem
    return buildFullFilename({
      datePrefix: it.datePrefix,
      owner: it.owner,
      stem: stemUse,
      ext: extUse,
    })
  })
  return resolveDuplicateNames(previews)
}

export default function App() {
  const [items, setItems] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [storedApiKey, setStoredApiKey] = useState('')
  const [preferredPattern, setPreferredPattern] = useLocalStorage('ai-renamer-preferred-pattern', 'date')
  const [recentOwners, setRecentOwners] = useLocalStorage('ai-renamer-recent-owners', [])
  const [toasts, setToasts] = useState([])
  const [downloadStatus, setDownloadStatus] = useState(null)
  const itemsRef = useRef(items)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    try {
      setStoredApiKey(localStorage.getItem('ai-renamer-api-key') || '')
    } catch {
      /* ignore */
    }
  }, [])

  const getApiKey = useCallback(() => {
    return import.meta.env.VITE_CLAUDE_API_KEY || storedApiKey
  }, [storedApiKey])

  const { isProcessing, processingProgress, processingTotal, error, resetError, runAISuggestions, cancel } =
    useFileProcessor({ getApiKey })

  useEffect(() => () => cancel(), [cancel])

  const persistApiKey = useCallback((value) => {
    try {
      if (value) localStorage.setItem('ai-renamer-api-key', value)
      else localStorage.removeItem('ai-renamer-api-key')
    } catch {
      /* ignore */
    }
    setStoredApiKey(value)
  }, [])

  const pushToast = useCallback((message, type = 'info') => {
    const id = randomId()
    setToasts((t) => [...t, { id, message, type }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  useEffect(() => {
    if (error) pushToast(error, 'error')
  }, [error, pushToast])

  const addFiles = useCallback(
    (fileList) => {
      const arr = Array.from(fileList)
      const next = arr.map((file) => {
        if (file.size > LARGE_FILE_BYTES) {
          pushToast(`"${file.name}" is over 50MB — rename still works, but downloads may be slow.`, 'info')
        }
        const { stem } = splitFilename(file.name)
        return {
          id: randomId(),
          file,
          originalName: file.name,
          newStem: stem,
          owner: '',
          suggested: false,
          datePrefix: null,
        }
      })
      setItems((prev) => [...prev, ...next])
    },
    [pushToast],
  )

  const updateStem = useCallback((id, v) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, newStem: v, suggested: false, datePrefix: null } : it,
      ),
    )
  }, [])

  const updateOwner = useCallback((id, v) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, owner: v } : it)))
  }, [])

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const clearAll = useCallback(() => setItems([]), [])

  const applyOwnerToAll = useCallback(() => {
    const list = itemsRef.current
    if (list.length === 0) return
    const first = list[0].owner.trim()
    if (!first) {
      pushToast('Enter an owner on the first file first.', 'info')
      return
    }
    setItems((prev) => prev.map((it) => ({ ...it, owner: first })))
    setRecentOwners((r) => pushRecentOwner(first, r))
    pushToast(`Owner "${first}" applied to all files.`, 'success')
  }, [pushToast, setRecentOwners])

  const applyPattern = useCallback(() => {
    const dateStr = new Date().toISOString().slice(0, 10)
    setItems((prev) =>
      prev.map((it, index) => {
        const { stem } = splitFilename(it.originalName)
        const base = it.newStem || stem
        const { stem: outStem, datePrefix } = applyNamingPattern(preferredPattern, base, {
          index,
          dateStr,
        })
        return {
          ...it,
          newStem: outStem,
          datePrefix: preferredPattern === 'date' ? datePrefix : null,
          suggested: false,
        }
      }),
    )
    pushToast('Pattern applied.', 'success')
  }, [preferredPattern, pushToast])

  const handleAISuggest = useCallback(async () => {
    resetError()
    const list = itemsRef.current
    if (list.length === 0) return
    const ok = await runAISuggestions(list, (id, update) => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                newStem: update.newStem,
                suggested: update.suggested,
                datePrefix: update.datePrefix ?? it.datePrefix,
              }
            : it,
        ),
      )
    })
    if (ok) pushToast('AI suggestions applied. Review names before downloading.', 'success')
  }, [pushToast, resetError, runAISuggestions])

  const handleDownloadAll = useCallback(async () => {
    const list = itemsRef.current
    if (list.length === 0) return
    resetError()
    const names = computeFinalNames(list)
    const invalid = names.some((n) => !n?.trim() || /[/\\]/.test(n))
    if (invalid) {
      pushToast('One or more filenames are invalid. Check for empty names.', 'error')
      return
    }
    setDownloadStatus({ current: 0, total: list.length })
    try {
      const payload = list.map((it, i) => ({ file: it.file, filename: names[i] }))
      await downloadAllSequential(payload, {
        delayMs: 450,
        onProgress: (cur, total) => setDownloadStatus({ current: cur, total }),
      })
      pushToast(`${list.length} file${list.length === 1 ? '' : 's'} downloaded successfully!`, 'success')
    } catch (e) {
      pushToast(e?.message || 'Download failed.', 'error')
    } finally {
      setDownloadStatus(null)
    }
  }, [pushToast, resetError])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (itemsRef.current.length > 0) handleDownloadAll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleDownloadAll])

  const busy = isProcessing || !!downloadStatus

  const processingLabel = useMemo(() => {
    if (!isProcessing || processingTotal === 0) return ''
    return `Processing ${processingProgress} of ${processingTotal} files...`
  }, [isProcessing, processingProgress, processingTotal])

  const clearOwnerHistory = useCallback(() => {
    setRecentOwners([])
    pushToast('Recent owner history cleared.', 'success')
  }, [pushToast, setRecentOwners])

  const listForUi = useMemo(
    () =>
      items.map((it) => ({
        id: it.id,
        originalName: it.originalName,
        size: it.file.size,
        mime: it.file.type || 'application/octet-stream',
        newStem: it.newStem,
        owner: it.owner,
        suggested: it.suggested,
      })),
    [items],
  )

  return (
    <div className="min-h-svh bg-slate-100 font-sans text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Header />
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="sr-only">API settings</h2>
          <details className="group rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <summary className="cursor-pointer list-none font-medium text-slate-800 outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-violet-500 [&::-webkit-details-marker]:hidden">
              Settings — Claude API key & history
            </summary>
            <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600">
                For production, prefer setting <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">VITE_CLAUDE_API_KEY</code> in
                your environment. You can also paste a key here — it is stored only in this browser (
                <span className="font-medium">localStorage</span>).
              </p>
              <label className="block text-sm font-medium text-slate-700" htmlFor="api-key-input">
                API key (optional override)
              </label>
              <input
                id="api-key-input"
                type="password"
                autoComplete="off"
                value={storedApiKey}
                onChange={(e) => persistApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full max-w-xl rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={clearOwnerHistory}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  Clear owner history
                </button>
                {recentOwners.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Recent: {recentOwners.slice(0, 5).join(', ')}
                    {recentOwners.length > 5 ? '…' : ''}
                  </p>
                )}
              </div>
            </div>
          </details>
        </section>

        <main id="main" className="mt-8 space-y-6">
          <DropZone
            disabled={busy}
            isDragging={isDragging}
            onDraggingChange={setIsDragging}
            onFiles={addFiles}
          />

          <ControlPanel
            fileCount={items.length}
            disabled={busy}
            isProcessing={isProcessing || !!downloadStatus}
            processingLabel={
              downloadStatus
                ? `Downloading ${downloadStatus.current} of ${downloadStatus.total}...`
                : processingLabel
            }
            pattern={preferredPattern}
            onPatternChange={(id) => setPreferredPattern(id)}
            onAISuggest={handleAISuggest}
            onApplyPattern={applyPattern}
            onApplyOwnerToAll={applyOwnerToAll}
            onClearAll={clearAll}
            onDownloadAll={handleDownloadAll}
          />

          <FileList
            items={listForUi}
            disabled={busy}
            onStemChange={updateStem}
            onOwnerChange={updateOwner}
            onRemove={removeItem}
          />
        </main>

        <footer className="mt-12 pb-6 text-center text-xs text-slate-500">
          Files stay in your browser. Keyboard: Ctrl+Enter to download all.
        </footer>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
