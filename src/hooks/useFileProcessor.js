import { useCallback, useRef, useState } from 'react'
import { getAISuggestion, UsageLimitError } from '../services/api'
import { formatFileSize, splitFilename } from '../utils/fileUtils'

/**
 * @typedef {{ id: string, file: File }} FileEntry
 */

/**
 * @param {{ getToken: () => string | null, onUsageUpdate?: () => void }} opts
 */
export function useFileProcessor({ getToken, onUsageUpdate }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingTotal, setProcessingTotal] = useState(0)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const resetError = useCallback(() => setError(null), [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  /**
   * @param {FileEntry[]} entries
   * @param {(id: string, update: { newStem: string, suggested: boolean, datePrefix?: string | null }) => void} onItemDone
   * @returns {Promise<{ ok: boolean, usageLimited?: boolean }>}
   */
  const runAISuggestions = useCallback(
    async (entries, onItemDone) => {
      const token = getToken()?.trim()
      if (!token) {
        setError('Sign in to use AI rename.')
        return { ok: false }
      }

      setError(null)
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const signal = abortRef.current.signal

      setIsProcessing(true)
      setProcessingTotal(entries.length)
      setProcessingProgress(0)

      try {
        for (let i = 0; i < entries.length; i += 1) {
          if (signal.aborted) return { ok: false }
          const entry = entries[i]
          const file = entry.file
          const typeLabel = file.type || 'unknown'
          const sizeLabel = formatFileSize(file.size)
          const data = await getAISuggestion(file.name, typeLabel, sizeLabel, {
            signal,
            token,
          })
          const suggested = typeof data.suggestion === 'string' ? data.suggestion : ''
          const { stem } = splitFilename(suggested)
          const cleanStem = stem || splitFilename(file.name).stem
          onItemDone(entry.id, {
            newStem: cleanStem,
            suggested: true,
            datePrefix: null,
          })
          setProcessingProgress(i + 1)
          onUsageUpdate?.()
        }
        return { ok: true }
      } catch (e) {
        if (!signal.aborted) {
          if (e instanceof UsageLimitError) {
            setError('You have reached your monthly AI rename limit.')
            return { ok: false, usageLimited: true }
          }
          setError(e?.message || 'AI request failed.')
        }
        return { ok: false }
      } finally {
        setIsProcessing(false)
      }
    },
    [getToken, onUsageUpdate],
  )

  return {
    isProcessing,
    processingProgress,
    processingTotal,
    error,
    setError,
    resetError,
    runAISuggestions,
    cancel,
  }
}
