'use client'

import { useSwitchChain } from 'wagmi'
import { arcTestnet, monadTestnet } from '@/config/chains'
import { useWallet } from '@/hooks/useLedger'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { id: monadTestnet.id, label: 'Monad', symbol: 'MON' },
  { id: arcTestnet.id, label: 'Arc', symbol: 'USDC' },
] as const

export function ChainSwitcher({ className }: { className?: string }) {
  const { chainId, isConnected } = useWallet()
  const { switchChain, isPending } = useSwitchChain()

  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-hair bg-white/[0.02] p-0.5',
        className,
      )}
      role="group"
      aria-label="Select chain"
    >
      {OPTIONS.map((opt) => {
        const active = chainId === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            disabled={isPending || (isConnected && active)}
            onClick={() => {
              if (!isConnected) return
              switchChain({ chainId: opt.id })
            }}
            className={cn(
              'rounded-md px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] transition',
              active
                ? 'bg-gold/15 text-gold'
                : 'text-muted hover:text-ink',
              !isConnected && 'opacity-60',
            )}
          >
            {opt.label}
            <span className="ml-1 opacity-60">{opt.symbol}</span>
          </button>
        )
      })}
    </div>
  )
}
