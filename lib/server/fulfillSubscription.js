import { tierFromPriceId } from './stripeTier.js'
import { resetCurrentMonthUsage } from './usage.js'

/**
 * Apply a Stripe subscription to the matching app user.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {import('stripe').default} stripe
 * @param {{
 *   userId: string,
 *   customerId: string,
 *   subscriptionId: string,
 *   resetUsage?: boolean,
 * }} opts
 */
export async function fulfillSubscription(prisma, stripe, opts) {
  const { userId, customerId, subscriptionId, resetUsage = false } = opts

  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = sub.items.data[0]?.price?.id
  const tier = tierFromPriceId(priceId)
  const active = sub.status === 'active' || sub.status === 'trialing'

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: sub.status,
      subscriptionTier: active ? tier : 'free',
    },
  })

  // When someone upgrades after hitting the free cap, give them a clean Pro month.
  if (resetUsage && active && tier !== 'free') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
    await resetCurrentMonthUsage(prisma, userId, user?.email)
  }

  return { tier: active ? tier : 'free', status: sub.status }
}
