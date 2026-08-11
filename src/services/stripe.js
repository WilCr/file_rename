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
