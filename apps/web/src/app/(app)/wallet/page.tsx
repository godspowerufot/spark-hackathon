'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useBalance } from 'wagmi'
import { Card, Badge } from '@/components/ui/Card'
import { useWallet } from '@/hooks/useLedger'
import { env } from '@/config/env'
import { formatMon, shortAddress } from '@/lib/utils'
import { activeChain } from '@/config/env'

export default function WalletPage() {
  const { address, isConnected, chainId } = useWallet()
  const balance = useBalance({ address })
  const onMonad = chainId === activeChain.id

  if (!isConnected || !address) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <h1 className="font-display text-3xl font-semibold">Wallet</h1>
        <p className="text-muted">Connect to view network status and MON balance.</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">Wallet</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Connected profile</h1>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Address</span>
          <span className="font-mono text-sm">{shortAddress(address, 6)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Network</span>
          {onMonad ? (
            <Badge tone="ok">{activeChain.name}</Badge>
          ) : (
            <Badge tone="danger">Wrong network</Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Balance</span>
          <span className="font-mono text-gold">
            {balance.data ? formatMon(balance.data.value) : '—'} MON
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Explorer</span>
          <a
            href={`${env.explorerUrl}/address/${address}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gold hover:underline"
          >
            Open
          </a>
        </div>
      </Card>

      <div className="flex justify-center">
        <ConnectButton />
      </div>
    </div>
  )
}
