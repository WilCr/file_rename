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
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed')
  }
  setStoredToken(data.token)
  return data
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
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Login failed')
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
  const res = await fetch(`${base}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
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
