const TOKEN_KEY = 'authToken'

/**
 * @returns {string | null}
 */
export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * @param {string | null} token
 */
export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} email
 * @param {string} password
 * @param {string} [name]
 */
export async function register(email, password, name) {
  const base = import.meta.env.VITE_API_URL || '/api'
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  const contentType = res.headers.get('content-type') || ''
  let data = {}
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => ({}))
  } else {
    const text = await res.text().catch(() => '')
    if (!res.ok) {
      const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 160)
      throw new Error(snippet || `Request failed (${res.status})`)
    }
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = {}
    }
  }
  if (!res.ok) {
    throw new Error(formatApiError(data, `Registration failed (${res.status})`))
  }
  setStoredToken(data.token)
  return data
}

/**
 * Prefer a single clear message (avoid "error — error" when detail duplicates error).
 * @param {{ error?: string, detail?: string }} data
 * @param {string} fallback
 */
function formatApiError(data, fallback) {
  const error = typeof data?.error === 'string' ? data.error.trim() : ''
  const detail = typeof data?.detail === 'string' ? data.detail.trim() : ''
  if (error && detail && error !== detail) return `${error} — ${detail}`
  return error || detail || fallback
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function login(email, password) {
  const base = import.meta.env.VITE_API_URL || '/api'
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const contentType = res.headers.get('content-type') || ''
  let data = {}
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => ({}))
  } else {
    const text = await res.text().catch(() => '')
    if (!res.ok) {
      const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 160)
      throw new Error(snippet || `Request failed (${res.status})`)
    }
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = {}
    }
  }
  if (!res.ok) {
    throw new Error(formatApiError(data, `Login failed (${res.status})`))
  }
  setStoredToken(data.token)
  return data
}

export function logout() {
  setStoredToken(null)
}

/**
 * @param {string} email
 * @returns {Promise<{ ok?: boolean, message?: string, devResetUrl?: string, error?: string }>}
 */
export async function requestPasswordReset(email) {
  const base = import.meta.env.VITE_API_URL || '/api'
  let res
  try {
    res = await fetch(`${base}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  } catch {
    throw new Error('Could not reach the server. Check your connection and that the API is deployed.')
  }

  const contentType = res.headers.get('content-type') || ''
  let data = {}
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => ({}))
  } else {
    const text = await res.text().catch(() => '')
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          'Password reset API not found (404). The live site may still be the old Next.js deploy — redeploy the Vite app on Vercel.',
        )
      }
      throw new Error(text.replace(/\s+/g, ' ').trim().slice(0, 160) || `Request failed (${res.status})`)
    }
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = {}
    }
  }

  if (!res.ok) {
    throw new Error(formatApiError(data, `Request failed (${res.status})`))
  }
  return data
}

/**
 * @param {string} token
 * @param {string} password
 */
export async function resetPasswordWithToken(token, password) {
  const base = import.meta.env.VITE_API_URL || '/api'
  const res = await fetch(`${base}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Reset failed')
  }
  return data
}

/**
 * Permanently deletes the signed-in account and clears the local session.
 * @param {string} password
 * @param {string} token
 */
export async function deleteAccount(password, token) {
  const base = import.meta.env.VITE_API_URL || '/api'
  const res = await fetch(`${base}/account/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(formatApiError(data, `Could not delete account (${res.status})`))
  }
  setStoredToken(null)
  return data
}

/**
 * @param {string} token
 */
export async function verifySession(token) {
  const base = import.meta.env.VITE_API_URL || '/api'
  const res = await fetch(`${base}/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Session expired')
  }
  return data
}
