'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export type AgentReply = {
  id: string
  text: string
  tone?: 'info' | 'ok' | 'warn' | 'error'
}

export function AgentLiveFeed({
  replies,
  live,
  title = 'Agent live',
  className,
}: {
  replies: AgentReply[]
  live?: boolean
  title?: string
  className?: string
}) {
  if (replies.length === 0 && !live) return null

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-hair bg-black/50',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-hair px-4 py-2.5">
        <div className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-2">
          {title}
        </div>
        {live ? (
          <span className="inline-flex items-center gap-2 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-emerald">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
            </span>
            Live
          </span>
        ) : (
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-muted-2">
            Idle
          </span>
        )}
      </div>
      <div className="max-h-48 space-y-2 overflow-y-auto px-4 py-3">
        <AnimatePresence initial={false}>
          {replies.map((r) => (
            <motion.p
              key={r.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'font-mono text-[0.72rem] leading-relaxed',
                r.tone === 'ok' && 'text-emerald',
                r.tone === 'warn' && 'text-gold',
                r.tone === 'error' && 'text-danger-soft',
                (!r.tone || r.tone === 'info') && 'text-muted',
              )}
            >
              <span className="text-gold/70">agent › </span>
              {r.text}
            </motion.p>
          ))}
        </AnimatePresence>
        {live ? (
          <p className="font-mono text-[0.65rem] text-muted-2">
            agent › <span className="animate-pulse">working…</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function makeReply(text: string, tone?: AgentReply['tone']): AgentReply {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    tone,
  }
}
