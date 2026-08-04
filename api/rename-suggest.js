import Anthropic from '@anthropic-ai/sdk'
import { getUserFromRequest } from '../lib/server/auth.js'
import { getJsonBody } from '../lib/server/parseBody.js'
import { getUsageState, incrementUsage } from '../lib/server/usage.js'
import { prisma } from '../lib/server/prisma.js'

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'
const MODEL =
  typeof process.env.CLAUDE_MODEL === 'string' && process.env.CLAUDE_MODEL.trim()
    ? process.env.CLAUDE_MODEL.trim()
    : DEFAULT_MODEL
const IMAGE_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

export const config = { maxDuration: 60 }

function getApiKey() {
  const key = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
  return typeof key === 'string' && key.trim() ? key.trim() : null
}

/**
 * @param {string} filename
 * @param {string} typeLabel
 * @param {string} sizeLabel
 * @param {boolean} hasContent
 */
function buildInstructions(filename, typeLabel, sizeLabel, hasContent) {
  const lastDot = filename.lastIndexOf('.')
  const ext = lastDot > 0 ? filename.slice(lastDot) : ''

  return `${
    hasContent
      ? 'Read the attached document and name it based on what it actually contains.'
      : 'No readable content is available, so infer the best name from the filename alone.'
  }

Original filename: ${filename}
File type: ${typeLabel}
File size: ${sizeLabel}

First identify what the document is. Examples: property title, warranty deed, quitclaim deed, mortgage, promissory note, closing statement, invoice, receipt, bank statement, tax return, insurance policy, contract, lease, permit, resume, medical record, ID document.

Then build the filename from the details you can actually see, in this order, skipping anything the document does not show:
1. Main party, owner, or property address
2. Document type, e.g. Property_Title, Warranty_Deed, Promissory_Note, Invoice
3. The organisation or counterparty it concerns, when that is someone else, e.g. the employer, lender, insurer, or vendor
4. Reference, instrument, policy, or account number
5. Date as DD-MM-YYYY

Example of the target style: Angel_J_Perez_Lopez_Note_2411041846_20-02-2025${ext || '.pdf'}

Rules:
- Separate words with underscores, never spaces
- Capitalise each word as in the example
- Never invent names, numbers, or dates that are not in the document
- Drop noise words such as copy, final, scan, v2, untitled
- Keep the extension ${ext || '(same as the original)'}
- Stay under 90 characters

Return ONLY the filename, nothing else.`
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI rename is not configured on the server (missing CLAUDE_API_KEY).',
      code: 'AI_NOT_CONFIGURED',
    })
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const usage = await getUsageState(prisma, user.id, user)
    if (usage.exceeded) {
      return res.status(403).json({
        error: 'Usage limit exceeded',
        code: 'USAGE_LIMIT_EXCEEDED',
        limit: usage.limit,
        used: usage.used,
      })
    }

    const { filename, fileType, fileSize, content } = getJsonBody(req)
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'filename is required' })
    }

    const typeLabel = typeof fileType === 'string' ? fileType : 'unknown'
    const sizeLabel = typeof fileSize === 'string' ? fileSize : String(fileSize ?? 'unknown')

    /** @type {Array<Record<string, unknown>>} */
    const blocks = []
    const kind = content && typeof content === 'object' ? content.kind : null
    const data = content && typeof content.data === 'string' ? content.data : ''

    if (kind === 'pdf' && data) {
      blocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data },
      })
    } else if (kind === 'image' && data) {
      const mediaType = IMAGE_MEDIA_TYPES.has(content.mediaType) ? content.mediaType : 'image/png'
      blocks.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data } })
    } else if (kind === 'text' && data) {
      blocks.push({ type: 'text', text: `Document contents:\n\n${data.slice(0, 20_000)}` })
    }

    const analysedContent = blocks.length > 0
    blocks.push({ type: 'text', text: buildInstructions(filename, typeLabel, sizeLabel, analysedContent) })

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: blocks }],
    })

    const block = message.content?.find((c) => c.type === 'text')
    const text = block?.type === 'text' ? block.text?.trim() : ''
    if (!text) {
      return res.status(502).json({ error: 'Empty response from AI' })
    }

    const suggestion = text.split('\n').pop().replace(/^["'`]|["'`]$/g, '').trim()

    await incrementUsage(prisma, user.id, usage.month)

    const nextUsed = usage.used + 1
    return res.status(200).json({
      suggestion,
      analysedContent,
      remainingCredits: Math.max(0, usage.limit - nextUsed),
      used: nextUsed,
      limit: usage.limit,
    })
  } catch (err) {
    console.error('rename-suggest:', err)
    const status = err?.status
    if (status === 401 || status === 403) {
      return res.status(503).json({ error: 'AI provider rejected the API key. Check CLAUDE_API_KEY.' })
    }
    if (status === 404) {
      return res.status(503).json({
        error: `AI model "${MODEL}" is not available to this API key. Set CLAUDE_MODEL to a model your account can use.`,
        code: 'AI_MODEL_UNAVAILABLE',
      })
    }
    if (status === 413) {
      return res.status(413).json({ error: 'Document is too large to analyse.' })
    }
    if (status === 429) {
      return res.status(429).json({ error: 'AI provider is rate limiting. Try again shortly.' })
    }
    if (status === 400) {
      const detail = typeof err?.error?.error?.message === 'string' ? err.error.error.message : ''
      return res.status(502).json({
        error: detail ? `AI provider rejected the request: ${detail.slice(0, 200)}` : 'AI provider rejected the request.',
      })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
}
