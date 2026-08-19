import { randomUUID } from 'node:crypto'

/** @typedef {'free' | 'pro' | 'business'} Tier */

/**
 * @param {string} tier
 * @returns {number}
 */
export function getMonthlyLimit(tier) {
  switch (tier) {
    case 'pro':
      return 500
    case 'business':
      return 999_999
    default:
      return 10
  }
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} userId
 * @param {string} month
 */
export async function getUsageForMonth(prisma, userId, month) {
  const row = await prisma.usage.findUnique({
    where: { userId_month: { userId, month } },
  })
  return row?.count ?? 0
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} email
 * @param {string} month
 */
async function getEmailUsageForMonth(prisma, email, month) {
  if (!email) return 0
  const row = await prisma.emailUsage.findUnique({
    where: { email_month: { email, month } },
  })
  return row?.count ?? 0
}

/**
 * Usage is the higher of per-user and per-email counts so deleting an account
 * and re-registering the same email cannot reset the free allowance.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} userId
 * @param {{ subscriptionTier: string, email?: string }} user
 */
export async function getUsageState(prisma, userId, user) {
  const month = currentMonth()
  const limit = getMonthlyLimit(user.subscriptionTier)
  const email = normalizeEmail(user.email)
  const [usedUser, usedEmail] = await Promise.all([
    getUsageForMonth(prisma, userId, month),
    getEmailUsageForMonth(prisma, email, month),
  ])
  const used = Math.max(usedUser, usedEmail)
  return {
    month,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    exceeded: used >= limit,
  }
}

/**
 * Atomically reserve one AI rename. Returns the new count, or null if the limit is hit.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ id: string, email: string, subscriptionTier: string }} user
 */
export async function consumeUsage(prisma, user) {
  const month = currentMonth()
  const limit = getMonthlyLimit(user.subscriptionTier)
  const email = normalizeEmail(user.email)
  const userId = user.id

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO "Usage" ("id", "userId", "month", "count", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${userId}, ${month}, 0, NOW(), NOW())
      ON CONFLICT ("userId", "month") DO NOTHING
    `
    if (email) {
      await tx.$executeRaw`
        INSERT INTO "EmailUsage" ("email", "month", "count", "updatedAt")
        VALUES (${email}, ${month}, 0, NOW())
        ON CONFLICT ("email", "month") DO NOTHING
      `
    }

    const usageRows = await tx.$queryRaw`
      SELECT "count" FROM "Usage" WHERE "userId" = ${userId} AND "month" = ${month} FOR UPDATE
    `
    const emailRows = email
      ? await tx.$queryRaw`
          SELECT "count" FROM "EmailUsage" WHERE "email" = ${email} AND "month" = ${month} FOR UPDATE
        `
      : [{ count: 0 }]

    const used = Math.max(Number(usageRows[0]?.count ?? 0), Number(emailRows[0]?.count ?? 0))
    if (used >= limit) {
      return { ok: false, used, limit, month }
    }

    await tx.$executeRaw`
      UPDATE "Usage" SET "count" = "count" + 1, "updatedAt" = NOW()
      WHERE "userId" = ${userId} AND "month" = ${month}
    `
    if (email) {
      await tx.$executeRaw`
        UPDATE "EmailUsage" SET "count" = "count" + 1, "updatedAt" = NOW()
        WHERE "email" = ${email} AND "month" = ${month}
      `
    }

    return { ok: true, used: used + 1, limit, month }
  })
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ id: string, email: string }} user
 * @param {string} month
 */
export async function refundUsage(prisma, user, month) {
  const email = normalizeEmail(user.email)
  await prisma.usage.updateMany({
    where: { userId: user.id, month, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  })
  if (email) {
    await prisma.emailUsage.updateMany({
      where: { email, month, count: { gt: 0 } },
      data: { count: { decrement: 1 } },
    })
  }
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} userId
 * @param {string} [email]
 */
export async function resetCurrentMonthUsage(prisma, userId, email) {
  const month = currentMonth()
  await prisma.usage.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, count: 0 },
    update: { count: 0 },
  })
  const normalized = normalizeEmail(email)
  if (normalized) {
    await prisma.emailUsage.upsert({
      where: { email_month: { email: normalized, month } },
      create: { email: normalized, month, count: 0 },
      update: { count: 0 },
    })
  }
}
