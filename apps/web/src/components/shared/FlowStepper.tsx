'use client'

import { cn } from '@/lib/utils'

export type FlowStep = {
  id: string
  label: string
  hint: string
}

export function FlowStepper({
  steps,
  current,
  className,
}: {
  steps: FlowStep[]
  current: number
  className?: string
}) {
  return (
    <ol className={cn('grid gap-3 sm:grid-cols-3', className)}>
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <li
            key={step.id}
            className={cn(
              'rounded-xl border px-4 py-3 transition',
              active && 'border-gold/40 bg-gold/10',
              done && 'border-emerald/30 bg-emerald/10',
              !active && !done && 'border-hair bg-white/[0.02]',
            )}
          >
            <div className="flex items-center gap-2 font-mono text-[0.58rem] uppercase tracking-[0.16em]">
              <span
                className={cn(
                  'inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem]',
                  active && 'bg-gold text-[#050505]',
                  done && 'bg-emerald text-[#050505]',
                  !active && !done && 'bg-white/10 text-muted',
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className={active || done ? 'text-ink' : 'text-muted-2'}>{step.label}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{step.hint}</p>
          </li>
        )
      })}
    </ol>
  )
}

export const ONBOARDING_FLOW: FlowStep[] = [
  {
    id: 'claim',
    label: 'Claim gas',
    hint: 'Get sponsored USDC on Arc — sign only, relayer pays.',
  },
  {
    id: 'pay',
    label: 'Buy VIP',
    hint: 'Pay event VIP with that USDC. Gas is money.',
  },
  {
    id: 'done',
    label: 'VIP pass',
    hint: 'Shareable card backed by your Arc payment tx.',
  },
]
