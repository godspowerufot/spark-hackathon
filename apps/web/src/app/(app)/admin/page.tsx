'use client'

import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAdminControls, useTreasury, useWallet } from '@/hooks/useLedger'
import { explorerAddress, formatMon, shortAddress } from '@/lib/utils'
import { env } from '@/config/env'

export default function AdminPage() {
  const { address, isConnected } = useWallet()
  const { stats, ledgerAddress, demo } = useTreasury()
  const { setPaused, isPending } = useAdminControls()
  const isOwner =
    Boolean(address && stats?.owner) &&
    address!.toLowerCase() === stats!.owner.toLowerCase()

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">Admin</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Treasury controls</h1>
        <p className="mt-2 text-muted">
          Owner-only operations. {demo ? 'Demo mode simulates pause locally.' : null}
        </p>
        {ledgerAddress ? (
          <a
            href={explorerAddress(env.explorerUrl, ledgerAddress)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block font-mono text-xs text-gold hover:underline"
          >
            {ledgerAddress}
          </a>
        ) : null}
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Status</span>
          {stats?.paused ? (
            <Badge tone="danger">Paused</Badge>
          ) : (
            <Badge tone="ok">Active</Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Treasury</span>
          <span className="font-mono text-gold">
            {stats ? formatMon(stats.treasuryBalance) : '—'} MON
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Owner</span>
          <span className="font-mono text-muted">
            {stats?.owner ? shortAddress(stats.owner, 6) : '—'}
          </span>
        </div>
        {!demo && isConnected && !isOwner ? (
          <p className="text-sm text-danger-soft">
            Connected wallet is not the contract owner. Pause/unpause will revert.
          </p>
        ) : null}
        <div className="flex gap-3 pt-2">
          <Button
            variant="danger"
            disabled={!isConnected || isPending || stats?.paused || (!demo && !isOwner)}
            onClick={() => void setPaused(true)}
          >
            Pause
          </Button>
          <Button
            variant="secondary"
            disabled={!isConnected || isPending || !stats?.paused || (!demo && !isOwner)}
            onClick={() => void setPaused(false)}
          >
            Unpause
          </Button>
        </div>
        <p className="text-xs text-muted-2">
          Emergency withdraw is available on-chain while paused via{' '}
          <code>emergencyWithdraw(to)</code> using the owner wallet.
        </p>
      </Card>
    </div>
  )
}
