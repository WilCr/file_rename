const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export class UsageLimitError extends Error {
  /**
   * @param {object} data
   */
  constructor(data) {
    super('Usage limit exceeded')
    this.name = 'UsageLimitError'
    this.data = data
  }
}

/**
 * @param {string} filename
 * @param {string} fileType
 * @param {string} fileSize
 * @param {{
 *   signal?: AbortSignal,
 *   token?: string,
 *   content?: { kind: string, data: string, mediaType?: string } | null,
 * }} [opts]
 */
export async function getAISuggestion(filename, fileType, fileSize, opts = {}) {
  const token = opts.token ?? getAuthToken()
  if (!token) {
    throw new Error('Sign in to use AI rename.')
  }

  const send = (content) =>
    fetch(`${API_BASE_URL}/rename-suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filename, fileType, fileSize, content }),
      signal: opts.signal,
    })

  let res = await send(opts.content ?? null)

  // Oversized documents still deserve a name, so retry without the attachment.
  if (res.status === 413 && opts.content) {
    res = await send(null)
  }

  const data = await res.json().catch(() => ({}))

  if (res.status === 401) {
    throw new Error('Session expired. Please sign in again.')
  }

  if (res.status === 403 && data.code === 'USAGE_LIMIT_EXCEEDED') {
    throw new UsageLimitError(data)
  }

  if (!res.ok) {
    throw new Error(data.error || 'API request failed')
  }

  return data
}

function getAuthToken() {
  try {
    return localStorage.getItem('authToken')
  } catch {
    return null
  }
}

/**
 * @param {string} token
 */
export async function checkUsage(token) {
  const res = await fetch(`${API_BASE_URL}/usage/check`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load usage')
  }
  return data
}
