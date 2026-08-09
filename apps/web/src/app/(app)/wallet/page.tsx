'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useBalance } from 'wagmi'
import { Card, Badge } from '@/components/ui/Card'
import { ChainSwitcher } from '@/components/shared/ChainSwitcher'
import { useActiveLedger, useWallet } from '@/hooks/useLedger'
import { formatMon, shortAddress } from '@/lib/utils'
import { isSupportedAppChain } from '@/config/chains'

export default function WalletPage() {
  const { address, isConnected, chainId } = useWallet()
  const { gasSymbol, explorerUrl, chainLabel } = useActiveLedger()
  const balance = useBalance({ address })
  const supported = isSupportedAppChain(chainId)

  if (!isConnected || !address) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <h1 className="font-display text-3xl font-semibold">Wallet</h1>
        <p className="text-muted">Connect to view network status and gas balance.</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">Wallet</div>
          <h1 className="mt-2 font-display text-3xl font-semibold">Connected profile</h1>
        </div>
        <ChainSwitcher />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Address</span>
          <span className="font-mono text-sm">{shortAddress(address, 6)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Network</span>
          {supported ? (
            <Badge tone="ok">{chainLabel}</Badge>
          ) : (
            <Badge tone="danger">Unsupported network</Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Balance</span>
          <span className="font-mono text-gold">
            {balance.data ? formatMon(balance.data.value) : '—'} {gasSymbol}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Explorer</span>
          <a
            href={`${explorerUrl}/address/${address}`}
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
