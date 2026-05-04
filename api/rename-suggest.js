import Anthropic from '@anthropic-ai/sdk'
import { getUserFromRequest } from '../lib/server/auth.js'
import { getUsageState, incrementUsage } from '../lib/server/usage.js'
import { prisma } from '../lib/server/prisma.js'

const MODEL = 'claude-sonnet-4-20250514'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' })
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

    const { filename, fileType, fileSize } = req.body || {}
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'filename is required' })
    }

    const typeLabel = typeof fileType === 'string' ? fileType : 'unknown'
    const sizeLabel = typeof fileSize === 'string' ? fileSize : String(fileSize ?? 'unknown')

    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Analyze this filename and suggest a descriptive, professional new name.
Original filename: ${filename}
File type: ${typeLabel}
File size: ${sizeLabel}

Suggest a clear, concise filename that:
- Describes the content/purpose
- Uses underscores instead of spaces
- Is lowercase
- Removes unnecessary words like "copy", "final", "v2"
- Keeps the file extension

Return ONLY the suggested filename, nothing else.`,
        },
      ],
    })

    const block = message.content?.[0]
    const text = block?.type === 'text' ? block.text?.trim() : ''
    if (!text) {
      return res.status(502).json({ error: 'Empty response from AI' })
    }

    const suggestion = text.replace(/^["']|["']$/g, '').trim()

    await incrementUsage(prisma, user.id, usage.month)

    const nextUsed = usage.used + 1
    return res.status(200).json({
      suggestion,
      remainingCredits: Math.max(0, usage.limit - nextUsed),
      used: nextUsed,
      limit: usage.limit,
    })
  } catch (err) {
    console.error('rename-suggest:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
