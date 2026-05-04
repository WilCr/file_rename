import { buffer } from 'micro'
import Stripe from 'stripe'
import { prisma } from '../../lib/server/prisma.js'
import { tierFromPriceId } from '../../lib/server/stripeTier.js'

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  const secret = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !whSecret) {
    console.error('Stripe webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const stripe = new Stripe(secret)
  let event

  try {
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']
    if (!sig || typeof sig !== 'string') {
      return res.status(400).send('Missing stripe-signature')
    }
    event = stripe.webhooks.constructEvent(buf, sig, whSecret)
  } catch (err) {
    console.error('Webhook signature:', err?.message || err)
    return res.status(400).send(`Webhook Error: ${err?.message || 'invalid'}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.client_reference_id || session.metadata?.userId
        if (!userId || typeof userId !== 'string') break

        const customerId = session.customer
        const subscriptionId = session.subscription
        if (typeof customerId !== 'string') break

        if (subscriptionId && typeof subscriptionId === 'string') {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = sub.items.data[0]?.price?.id
          const tier = tierFromPriceId(priceId)

          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: sub.status,
              subscriptionTier: tier,
            },
          })
        } else {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const customerId = sub.customer
        if (typeof customerId !== 'string') break

        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (!user) break

        const priceId = sub.items.data[0]?.price?.id
        const tier = tierFromPriceId(priceId)
        const active = sub.status === 'active' || sub.status === 'trialing'

        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeSubscriptionId: sub.id,
            subscriptionStatus: sub.status,
            subscriptionTier: active ? tier : 'free',
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const customerId = sub.customer
        if (typeof customerId !== 'string') break

        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (!user) break

        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeSubscriptionId: null,
            subscriptionStatus: 'canceled',
            subscriptionTier: 'free',
          },
        })
        break
      }

      default:
        break
    }

    return res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler:', err)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }
}
