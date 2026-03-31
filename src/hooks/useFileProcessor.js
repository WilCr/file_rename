import { useCallback, useRef, useState } from 'react'
import { suggestFilenameWithClaude } from '../utils/apiClient'
import { formatFileSize, splitFilename } from '../utils/fileUtils'

/**
 * @typedef {{ id: string, file: File }} FileEntry
 */

/**
 * @param {{ getApiKey: () => string }} opts
 */
export function useFileProcessor({ getApiKey }) {
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
   * @returns {Promise<boolean>}
   */
  const runAISuggestions = useCallback(
    async (entries, onItemDone) => {
      const apiKey = getApiKey()?.trim()
      if (!apiKey) {
        setError('Add your Claude API key in Settings or set VITE_CLAUDE_API_KEY.')
        return false
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
          if (signal.aborted) return false
          const entry = entries[i]
          const file = entry.file
          const typeLabel = file.type || 'unknown'
          const sizeLabel = formatFileSize(file.size)
          const suggested = await suggestFilenameWithClaude(
            apiKey,
            file.name,
            typeLabel,
            sizeLabel,
            { signal },
          )
          const { stem } = splitFilename(suggested)
          const cleanStem = stem || splitFilename(file.name).stem
          onItemDone(entry.id, {
            newStem: cleanStem,
            suggested: true,
            datePrefix: null,
          })
          setProcessingProgress(i + 1)
        }
        return true
      } catch (e) {
        if (!signal.aborted) {
          setError(e?.message || 'AI request failed.')
        }
        return false
      } finally {
        setIsProcessing(false)
      }
    },
    [getApiKey],
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
