import Stripe from 'stripe'
import { getUserFromRequest } from '../../lib/server/auth.js'

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
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account yet. Subscribe to a plan first.' })
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173'
    const stripe = new Stripe(secret)

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl.replace(/\/$/, '')}/`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('portal:', err)
    return res.status(500).json({ error: 'Could not open billing portal' })
  }
}
