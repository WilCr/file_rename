import { prisma } from './prisma.js'

/**
 * @param {import('http').IncomingMessage} req
 */
export function getClientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim().slice(0, 64)
  }
  const realIp = req.headers?.['x-real-ip']
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim().slice(0, 64)
  }
  return 'unknown'
}

/**
 * Best-effort sliding window stored in Postgres so it works across serverless isolates.
 * @param {string} key
 * @param {number} max
 * @param {number} windowMs
 * @returns {Promise<{ ok: true } | { ok: false, retryAfterSec: number }>}
 */
export async function consumeRateLimit(key, max, windowMs) {
  const now = Date.now()
  const row = await prisma.rateLimit.findUnique({ where: { key } })

  if (!row || now - row.windowStart.getTime() >= windowMs) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: new Date(now) },
      update: { count: 1, windowStart: new Date(now) },
    })
    return { ok: true }
  }

  if (row.count >= max) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - row.windowStart.getTime())) / 1000))
    return { ok: false, retryAfterSec }
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  })
  return { ok: true }
}

/**
 * @param {import('http').ServerResponse} res
 * @param {number} retryAfterSec
 */
export function tooManyRequests(res, retryAfterSec) {
  res.setHeader('Retry-After', String(retryAfterSec))
  return res.status(429).json({ error: 'Too many requests. Please wait and try again.' })
}
