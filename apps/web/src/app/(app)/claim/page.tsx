'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Badge, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TxHistoryList } from '@/components/shared/TxHistory'
import {
  useCanClaim,
  useClaim,
  useHasClaimed,
  useLedgerHistory,
  useTreasury,
  useWallet,
} from '@/hooks/useLedger'
import { env } from '@/config/env'
import { formatMon, shortAddress } from '@/lib/utils'

export default function ClaimPage() {
  const { address, isConnected } = useWallet()
  const { stats, demo } = useTreasury()
  const { canClaim, isLoading: checking } = useCanClaim(address)
  const { hasClaimed } = useHasClaimed(address)
  const { claim, isPending, hash } = useClaim()
  const history = useLedgerHistory()

  let statusTone: 'ok' | 'warn' | 'danger' | 'neutral' = 'neutral'
  let statusLabel = 'Connect wallet'
  if (isConnected) {
    if (hasClaimed) {
      statusTone = 'warn'
      statusLabel = 'Already claimed'
    } else if (stats?.paused) {
      statusTone = 'danger'
      statusLabel = 'Paused'
    } else if (canClaim) {
      statusTone = 'ok'
      statusLabel = 'Eligible'
    } else {
      statusTone = 'danger'
      statusLabel = 'Not eligible'
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">Claim</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Claim sponsored gas</h1>
        <p className="mt-2 text-muted">
          One claim per wallet · up to{' '}
          <span className="font-mono text-gold">
            {stats ? formatMon(stats.maxClaimAmount) : '0.01'} MON
          </span>
        </p>
        <div className="mt-3">
          <Badge tone={demo ? 'warn' : 'ok'}>{demo ? 'Demo mode' : 'On-chain'}</Badge>
        </div>
      </div>

      {!isConnected ? (
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">Connect to check eligibility and claim.</p>
          <ConnectButton />
        </Card>
      ) : null}

      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
              Eligibility
            </div>
            <div className="mt-2">
              <Badge tone={statusTone}>{checking ? 'Checking…' : statusLabel}</Badge>
            </div>
          </div>
          {address ? (
            <span className="font-mono text-sm text-muted">{shortAddress(address)}</span>
          ) : null}
        </div>

        <ol className="space-y-3 border-l border-hair pl-5 text-sm text-muted">
          <li>Wallet connected to Monad</li>
          <li>Never claimed before</li>
          <li>Treasury ≥ max claim</li>
          <li>Contract not paused</li>
        </ol>

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            className="w-full"
            disabled={!isConnected || !canClaim || isPending || hasClaimed}
            onClick={() => void claim()}
          >
            {isPending ? 'Claiming…' : hasClaimed ? 'Already claimed' : 'Claim gas'}
          </Button>
        </motion.div>

        {hash ? (
          <p className="font-mono text-xs text-muted">
            Pending tx:{' '}
            <a
              href={`${env.explorerUrl}/tx/${hash}`}
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:underline"
            >
              {hash.slice(0, 10)}…
            </a>
          </p>
        ) : null}
      </Card>

      <TxHistoryList
        title="Recent claims"
        items={history.claims}
        empty="No claims yet."
        isLoading={history.isLoading}
        kind="claim"
      />
    </div>
  )
}
