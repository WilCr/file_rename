import { useMemo } from 'react'

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|_[^_]+_)/g

/**
 * Renders the small Markdown subset used by PRIVACY.md and TERMS.md: headings,
 * paragraphs, bullet lists, bold, inline code, italics, and links.
 * @param {string} text
 * @param {string} keyPrefix
 */
function renderInline(text, keyPrefix) {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((part, i) => {
      const key = `${keyPrefix}-${i}`
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={key} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] text-slate-800">
            {part.slice(1, -1)}
          </code>
        )
      }
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        return (
          <a
            key={key}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 underline"
          >
            {link[1]}
          </a>
        )
      }
      if (part.startsWith('_') && part.endsWith('_')) {
        return <em key={key}>{part.slice(1, -1)}</em>
      }
      return <span key={key}>{part}</span>
    })
}

/**
 * @param {string} src
 */
function parseBlocks(src) {
  const blocks = []
  /** @type {string[]} */
  let para = []
  /** @type {string[]} */
  let list = []

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join(' ') })
      para = []
    }
  }
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'ul', items: list })
      list = []
    }
  }

  for (const line of src.replace(/\r\n/g, '\n').split('\n')) {
    const t = line.trim()
    if (!t) {
      flushPara()
      flushList()
      continue
    }
    if (t.startsWith('## ')) {
      flushPara()
      flushList()
      blocks.push({ type: 'h2', text: t.slice(3) })
      continue
    }
    if (t.startsWith('# ')) {
      flushPara()
      flushList()
      blocks.push({ type: 'h1', text: t.slice(2) })
      continue
    }
    if (t.startsWith('- ')) {
      flushPara()
      list.push(t.slice(2))
      continue
    }
    if (list.length) {
      list[list.length - 1] += ` ${t}`
      continue
    }
    para.push(t)
  }
  flushPara()
  flushList()
  return blocks
}

/**
 * @param {{ source: string }} props
 */
export default function Markdown({ source }) {
  const blocks = useMemo(() => parseBlocks(source), [source])

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.type === 'h1') {
          return (
            <h1 key={i} className="font-display text-xl font-semibold text-slate-900">
              {block.text}
            </h1>
          )
        }
        if (block.type === 'h2') {
          return (
            <h2 key={i} className="pt-2 font-display text-base font-semibold text-slate-900">
              {block.text}
            </h2>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, `${i}-${j}`)}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-slate-600">
            {renderInline(block.text, String(i))}
          </p>
        )
      })}
    </div>
  )
}
