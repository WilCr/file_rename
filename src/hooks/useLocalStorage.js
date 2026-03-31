import { useEffect, useState } from 'react'

/**
 * @template T
 * @param {string} key
 * @param {T} initialValue
 * @returns {[T, (v: T | ((prev: T) => T)) => void]}
 */
export function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return initialValue
      return JSON.parse(raw)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* ignore quota */
    }
  }, [key, state])

  return [state, setState]
}

/**
 * @param {string} owner
 * @param {string[]} recent
 * @returns {string[]}
 */
export function pushRecentOwner(owner, recent) {
  const o = owner.trim()
  if (!o) return recent
  const next = [o, ...recent.filter((x) => x !== o)]
  return next.slice(0, 10)
}
