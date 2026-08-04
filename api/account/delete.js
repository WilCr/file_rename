import Stripe from 'stripe'
import { getUserFromRequest, verifyPassword } from '../../lib/server/auth.js'
import { getJsonBody } from '../../lib/server/parseBody.js'
import { prisma } from '../../lib/server/prisma.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { password } = getJsonBody(req)
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Enter your password to confirm deletion.' })
    }

    const passwordOk = await verifyPassword(password, user.passwordHash)
    if (!passwordOk) {
      return res.status(403).json({ error: 'Password is incorrect.' })
    }

    // Stop billing first: deleting the account would otherwise leave a
    // subscription we can no longer reach from our side.
    if (user.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        await stripe.subscriptions.cancel(user.stripeSubscriptionId)
      } catch (err) {
        if (err?.code !== 'resource_missing') {
          console.error('account/delete: stripe cancel failed', err?.message)
          return res.status(502).json({
            error:
              'Could not cancel your subscription automatically. Open Manage billing, cancel there, then delete your account.',
          })
        }
      }
    }

    // Usage rows and password reset tokens cascade with the user.
    await prisma.user.delete({ where: { id: user.id } })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('account/delete:', err)
    return res.status(500).json({ error: 'Could not delete account' })
  }
}
