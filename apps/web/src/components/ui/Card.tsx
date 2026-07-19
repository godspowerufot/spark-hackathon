import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('panel p-6', className)}>{children}</div>
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'ok' | 'warn' | 'danger' | 'neutral' | 'gold'
}) {
  const tones = {
    ok: 'border-emerald/25 bg-emerald/10 text-emerald',
    warn: 'border-gold/30 bg-gold/10 text-gold',
    danger: 'border-danger/25 bg-danger/10 text-danger-soft',
    neutral: 'border-hair bg-glass text-muted',
    gold: 'border-hair bg-gold/10 text-ink',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-white/[0.05]', className)} />
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card className="px-8 py-14 text-center">
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  )
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card className="transition duration-300 hover:-translate-y-1 hover:border-gold/40">
      <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
        {label}
      </div>
      <div className="mt-3 font-mono text-2xl text-gold md:text-3xl">{value}</div>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </Card>
  )
}
