import Stripe from 'stripe'
import { getUserFromRequest } from '../../lib/server/auth.js'
import { isAllowedCheckoutPriceId } from '../../lib/server/stripeTier.js'

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    return res.status(500).json({ error: 'Stripe is not configured' })
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { priceId } = req.body || {}
    if (!priceId || typeof priceId !== 'string' || !isAllowedCheckoutPriceId(priceId)) {
      return res.status(400).json({ error: 'Invalid price' })
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173'
    const stripe = new Stripe(secret)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl.replace(/\/$/, '')}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl.replace(/\/$/, '')}/?checkout=canceled`,
      client_reference_id: user.id,
      metadata: { userId: user.id },
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email }),
    })

    return res.status(200).json({ sessionId: session.id })
  } catch (err) {
    console.error('create-checkout:', err)
    return res.status(500).json({ error: 'Payment error' })
  }
}
