const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1000
const ANTHROPIC_VERSION = '2023-06-01'

const DEFAULT_MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

/**
 * @param {number} attempt 0-based
 */
function backoffDelayMs(attempt) {
  return BASE_DELAY_MS * 2 ** attempt + Math.random() * 300
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * @param {string} apiKey
 * @param {string} filename
 * @param {string} typeLabel
 * @param {string} sizeLabel
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<string>} suggested filename only
 */
export async function suggestFilenameWithClaude(
  apiKey,
  filename,
  typeLabel,
  sizeLabel,
  opts = {},
) {
  const prompt = `Analyze this filename and suggest a descriptive, professional new name.
Original filename: ${filename}
File type: ${typeLabel}
File size: ${sizeLabel}

Suggest a clear, concise filename that:
- Describes the content/purpose
- Uses underscores instead of spaces
- Is lowercase
- Removes unnecessary words like "copy", "final", "v2"
- Keeps the file extension

Return ONLY the suggested filename, nothing else.`

  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  }

  let lastErr
  for (let attempt = 0; attempt < DEFAULT_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)
    const onParentAbort = () => controller.abort()
    if (opts.signal) {
      if (opts.signal.aborted) controller.abort()
      else opts.signal.addEventListener('abort', onParentAbort)
    }

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
      })

      clearTimeout(timeout)
      if (opts.signal) opts.signal.removeEventListener('abort', onParentAbort)

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        const err = new Error(
          res.status === 429
            ? 'Rate limited. Please wait and try again.'
            : res.status === 401
              ? 'Invalid API key.'
              : `API error ${res.status}: ${errText.slice(0, 200)}`,
        )
        err.status = res.status
        lastErr = err
        if (res.status >= 500 || res.status === 429) {
          await sleep(backoffDelayMs(attempt))
          continue
        }
        throw err
      }

      const data = await res.json()
      const text = data?.content?.[0]?.text?.trim()
      if (!text) {
        throw new Error('Empty response from AI.')
      }
      return text.replace(/^["']|["']$/g, '').trim()
    } catch (e) {
      clearTimeout(timeout)
      if (opts.signal) opts.signal.removeEventListener('abort', onParentAbort)
      lastErr = e
      if (e?.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds.')
      }
      if (attempt < DEFAULT_MAX_RETRIES - 1 && isRetriable(e)) {
        await sleep(backoffDelayMs(attempt))
        continue
      }
      throw e
    }
  }
  throw lastErr || new Error('Request failed after retries.')
}

/**
 * @param {unknown} e
 */
function isRetriable(e) {
  const status = e?.status
  if (status >= 500 || status === 429) return true
  if (e?.message?.includes('network') || e?.message?.includes('fetch')) return true
  return false
}
