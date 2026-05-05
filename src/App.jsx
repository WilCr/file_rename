import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import ForgotPassword from './components/Auth/ForgotPassword'
import ResetPassword from './components/Auth/ResetPassword'
import { ControlPanel } from './components/ControlPanel'
import { DropZone } from './components/DropZone'
import { FileList } from './components/FileList'
import { Header } from './components/Header'
import Hero from './components/Hero'
import PricingModal from './components/Paywall/PricingModal'
import UpgradePrompt from './components/Paywall/UpgradePrompt'
import UsageIndicator from './components/Paywall/UsageIndicator'
import { ToastContainer } from './components/Toast'
import { useFileProcessor } from './hooks/useFileProcessor'
import { pushRecentOwner, useLocalStorage } from './hooks/useLocalStorage'
import { getStoredToken, logout, setStoredToken, verifySession } from './services/auth'
import { redirectToBillingPortal } from './services/stripe'
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
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetToken, setResetToken] = useState(null)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [usageLimitedBanner, setUsageLimitedBanner] = useState(false)
  const [usageRefreshKey, setUsageRefreshKey] = useState(0)

  const [preferredPattern, setPreferredPattern] = useLocalStorage('ai-renamer-preferred-pattern', 'lowercase')
  const [recentOwners, setRecentOwners] = useLocalStorage('ai-renamer-recent-owners', [])
  const [toasts, setToasts] = useState([])
  const [downloadStatus, setDownloadStatus] = useState(null)
  const itemsRef = useRef(items)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const getToken = useCallback(() => getStoredToken(), [])

  const bumpUsage = useCallback(() => {
    setUsageRefreshKey((k) => k + 1)
  }, [])

  const pushToast = useCallback((message, type = 'info') => {
    const id = randomId()
    setToasts((t) => [...t, { id, message, type }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const { isProcessing, processingProgress, processingTotal, error, resetError, runAISuggestions, cancel } =
    useFileProcessor({ getToken, onUsageUpdate: bumpUsage })

  useEffect(() => () => cancel(), [cancel])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const token = getStoredToken()
      if (!token) {
        setUser(null)
        setAuthReady(true)
        return
      }
      try {
        const data = await verifySession(token)
        if (!cancelled) setUser(data.user)
      } catch {
        if (!cancelled) {
          setStoredToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reset = params.get('reset')
    if (reset) {
      setResetToken(reset)
      setShowResetPassword(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      pushToast('Thanks! Your subscription will update in a moment.', 'success')
      window.history.replaceState({}, '', window.location.pathname)
      bumpUsage()
      const t = getStoredToken()
      if (t) {
        verifySession(t)
          .then((data) => setUser(data.user))
          .catch(() => {})
      }
    }
    if (params.get('checkout') === 'canceled') {
      pushToast('Checkout canceled.', 'info')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [bumpUsage, pushToast])

  useEffect(() => {
    if (error) pushToast(error, 'error')
  }, [error, pushToast])

  const handleAuthSuccess = useCallback((data) => {
    setUser(data.user)
    bumpUsage()
  }, [bumpUsage])

  const handleSignOut = useCallback(() => {
    logout()
    setUser(null)
    setUsageLimitedBanner(false)
  }, [])

  const handleManageBilling = useCallback(async () => {
    try {
      await redirectToBillingPortal()
    } catch (e) {
      pushToast(e?.message || 'Could not open billing portal.', 'error')
    }
  }, [pushToast])

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

  const handlePatternChange = useCallback(
    (id) => {
      setPreferredPattern(id)
      const list = itemsRef.current
      if (list.length === 0) return
      const dateStr = new Date().toISOString().slice(0, 10)
      setItems((prev) =>
        prev.map((it, index) => {
          const { stem } = splitFilename(it.originalName)
          const base = it.newStem || stem
          const { stem: outStem, datePrefix } = applyNamingPattern(id, base, {
            index,
            dateStr,
          })
          return {
            ...it,
            newStem: outStem,
            datePrefix: id === 'date' ? datePrefix : null,
            suggested: false,
          }
        }),
      )
    },
    [setPreferredPattern],
  )

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

  const handleAISuggest = useCallback(async () => {
    resetError()
    setUsageLimitedBanner(false)
    const list = itemsRef.current
    if (list.length === 0) return
    if (!getStoredToken()) {
      setShowLogin(true)
      pushToast('Sign in to use AI rename.', 'info')
      return
    }
    const result = await runAISuggestions(list, (id, update) => {
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
    if (result?.ok) {
      pushToast('AI suggestions applied. Review names before downloading.', 'success')
    }
    if (result?.usageLimited) {
      setUsageLimitedBanner(true)
      setPricingOpen(true)
    }
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

  const listForUi = useMemo(() => {
    const previews = computeFinalNames(items)
    return items.map((it, i) => ({
      id: it.id,
      originalName: it.originalName,
      size: it.file.size,
      mime: it.file.type || 'application/octet-stream',
      newStem: it.newStem,
      owner: it.owner,
      suggested: it.suggested,
      previewName: previews[i],
    }))
  }, [items])

  const token = getStoredToken()

  return (
    <div className="min-h-svh bg-[#f3f4f6] font-sans text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>

      <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 lg:max-w-4xl">
        <Header
          user={user}
          onSignIn={() => {
            setShowRegister(false)
            setShowLogin(true)
          }}
          onSignUp={() => {
            setShowLogin(false)
            setShowRegister(true)
          }}
          onSignOut={handleSignOut}
          onManageBilling={handleManageBilling}
          onOpenPricing={() => setPricingOpen(true)}
        />

        <Hero />

        <section className="mt-2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
          <h2 className="sr-only">Account</h2>
          {!authReady ? (
            <p className="text-sm text-slate-600">Loading session…</p>
          ) : (
            <details className="group rounded-xl border border-slate-100 bg-slate-50/90 p-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-700 outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-violet-400 [&::-webkit-details-marker]:hidden">
                Account &amp; more options
              </summary>
              <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-600">
                  Sign in for AI rename credits. Owner labels and extra actions are below.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyOwnerToAll}
                    disabled={items.length === 0 || busy}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Apply owner to all
                  </button>
                  <button
                    type="button"
                    onClick={clearOwnerHistory}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Clear owner history
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={items.length === 0 || busy}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
                  >
                    Clear all files
                  </button>
                </div>
                {recentOwners.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Recent: {recentOwners.slice(0, 5).join(', ')}
                    {recentOwners.length > 5 ? '…' : ''}
                  </p>
                )}
              </div>
            </details>
          )}
        </section>

        <main id="main" className="mt-6 space-y-5">
          {usageLimitedBanner && (
            <UpgradePrompt onUpgrade={() => setPricingOpen(true)} onDismiss={() => setUsageLimitedBanner(false)} />
          )}

          {user && (
            <UsageIndicator
              token={token}
              refreshKey={usageRefreshKey}
              onUpgradeClick={() => setPricingOpen(true)}
            />
          )}

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
            onPatternChange={handlePatternChange}
            onAISuggest={handleAISuggest}
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

        <footer className="mt-10 text-center text-xs text-slate-500">
          Files stay in your browser. Ctrl+Enter to download all.
        </footer>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={() => {
            setShowLogin(false)
            setShowRegister(true)
          }}
          onForgotPassword={() => {
            setShowLogin(false)
            setShowForgot(true)
          }}
        />
      )}
      {showRegister && (
        <Register
          onClose={() => setShowRegister(false)}
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => {
            setShowRegister(false)
            setShowLogin(true)
          }}
        />
      )}
      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}
      {showResetPassword && resetToken && (
        <ResetPassword
          token={resetToken}
          onClose={() => {
            setShowResetPassword(false)
            setResetToken(null)
          }}
          onSuccess={() => {
            pushToast('Password updated. Sign in with your new password.', 'success')
            setShowLogin(true)
          }}
        />
      )}
      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />
    </div>
  )
}
