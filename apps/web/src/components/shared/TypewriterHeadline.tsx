'use client'

import { useEffect, useState } from 'react'

const BEFORE = 'Claim gas. '
const HIGHLIGHT = 'Walk in VIP'
const AFTER = '.'
const FULL = BEFORE + HIGHLIGHT + AFTER

const TYPE_MS = 55

export function TypewriterHeadline() {
  const [text, setText] = useState('')
  const done = text.length >= FULL.length

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => setText(FULL.slice(0, text.length + 1)), TYPE_MS)
    return () => clearTimeout(t)
  }, [text, done])

  const typedBefore = text.slice(0, BEFORE.length)
  const typedHighlight = text.slice(BEFORE.length, BEFORE.length + HIGHLIGHT.length)
  const typedAfter = text.slice(BEFORE.length + HIGHLIGHT.length)

  return (
    <h1 className="font-display text-[clamp(2.4rem,6.5vw,4.75rem)] font-bold leading-[1.08] tracking-[-0.02em] text-white">
      <span className="block min-h-[2.4em] sm:min-h-[1.2em]">
        {typedBefore}
        <span className="bg-linear-to-br from-[#F3D888] via-gold to-[#B8912B] bg-clip-text font-extrabold text-transparent">
          {typedHighlight}
        </span>
        {typedAfter}
        {!done ? <Cursor /> : null}
      </span>
    </h1>
  )
}

function Cursor() {
  return (
    <span
      aria-hidden="true"
      className="ml-1 inline-block w-[0.08em] animate-pulse select-none bg-gold align-[-0.08em]"
      style={{ height: '0.9em' }}
    />
  )
}
