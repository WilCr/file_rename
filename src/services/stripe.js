/**
 * Apply a completed Checkout Session to the signed-in account (plan + usage).
 * @param {string} sessionId
 */
export async function confirmCheckoutSession(sessionId) {
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('Sign in to confirm your subscription.')
  }

  const base = import.meta.env.VITE_API_URL || '/api'
  const response = await fetch(`${base}/stripe/confirm-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Could not confirm checkout')
  }
  return data
}

/**
 * Start Stripe Checkout by creating a session on the server, then navigating
 * to session.url. stripe.redirectToCheckout was removed from Stripe.js.
 *
 * @param {string} priceId
 */
export async function redirectToCheckout(priceId) {
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('Sign in to upgrade.')
  }

  const base = import.meta.env.VITE_API_URL || '/api'
  const response = await fetch(`${base}/stripe/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ priceId }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Could not start checkout')
  }

  if (typeof data.url !== 'string' || !data.url) {
    throw new Error('Invalid checkout response')
  }

  window.location.href = data.url
}

/**
 * Recover plan status from Stripe when Checkout paid but the app still shows Free.
 */
export async function syncSubscription() {
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('Sign in to refresh your plan.')
  }

  const base = import.meta.env.VITE_API_URL || '/api'
  const response = await fetch(`${base}/stripe/sync-subscription`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Could not sync subscription')
  }
  return data
}

export async function redirectToBillingPortal() {
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('Sign in to manage billing.')
  }

  const base = import.meta.env.VITE_API_URL || '/api'
  const response = await fetch(`${base}/stripe/portal`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Could not open billing portal')
  }

  if (data.url) {
    window.location.href = data.url
  }
}
