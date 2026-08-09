'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Badge, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TxHistoryList } from '@/components/shared/TxHistory'
import { ChainSwitcher } from '@/components/shared/ChainSwitcher'
import { FlowStepper, ONBOARDING_FLOW } from '@/components/shared/FlowStepper'
import {
  useCanClaim,
  useClaim,
  useHasClaimed,
  useLedgerHistory,
  useTreasury,
  useWallet,
} from '@/hooks/useLedger'
import { arcTestnet } from '@/config/chains'
import { formatMon, shortAddress } from '@/lib/utils'

function ClaimInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') || 'arc-summit-vip'
  const { address, isConnected, chainId } = useWallet()
  const { stats, demo, gasSymbol, explorerUrl, chainLabel, supported } = useTreasury()
  const { canClaim, isLoading: checking } = useCanClaim(address)
  const { hasClaimed } = useHasClaimed(address)
  const { claim, isPending, hash, gasless } = useClaim()
  const history = useLedgerHistory()
  const onArc = chainId === arcTestnet.id

  let statusTone: 'ok' | 'warn' | 'danger' | 'neutral' = 'neutral'
  let statusLabel = 'Connect wallet'
  if (isConnected) {
    if (!supported) {
      statusTone = 'danger'
      statusLabel = 'Switch to Monad or Arc'
    } else if (hasClaimed) {
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

  useEffect(() => {
    if (!hash || !onArc) return
    const t = window.setTimeout(() => {
      router.push(`/events/${eventId}/vip?fromClaim=1&tx=${hash}`)
    }, 1400)
    return () => window.clearTimeout(t)
  }, [eventId, hash, onArc, router])

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">Claim</div>
          <h1 className="mt-2 font-display text-3xl font-semibold">Claim sponsored gas</h1>
          <p className="mt-2 text-muted">
            Step 1 for event VIP · up to{' '}
            <span className="font-mono text-gold">
              {stats ? formatMon(stats.maxClaimAmount) : '0.1'} {gasSymbol}
            </span>
            {gasless ? (
              <>
                {' '}
                · <span className="text-emerald">gasless</span>
              </>
            ) : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={demo ? 'warn' : 'ok'}>{demo ? 'Demo mode' : chainLabel}</Badge>
            <Badge tone="gold">Event: {eventId}</Badge>
          </div>
        </div>
        <ChainSwitcher />
      </div>

      {onArc ? <FlowStepper steps={ONBOARDING_FLOW} current={hash ? 1 : 0} /> : null}

      {!isConnected ? (
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Connect any wallet — even with zero {gasSymbol}.
          </p>
          <ConnectButton />
        </Card>
      ) : null}

      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge tone={statusTone}>{checking ? 'Checking…' : statusLabel}</Badge>
          {address ? (
            <span className="font-mono text-sm text-muted">{shortAddress(address)}</span>
          ) : null}
        </div>

        <ol className="space-y-3 border-l border-hair pl-5 text-sm text-muted">
          <li>Switch to Arc</li>
          <li>Sign once — relayer pays gas</li>
          <li>Continue to VIP ticket for your event</li>
        </ol>

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            className="w-full"
            disabled={!isConnected || !supported || !canClaim || isPending || hasClaimed}
            onClick={() => void claim()}
          >
            {isPending
              ? 'Claiming…'
              : hasClaimed
                ? 'Already claimed'
                : 'Claim gas (free — sign only)'}
          </Button>
        </motion.div>

        {hasClaimed && onArc && !hash ? (
          <Link href={`/events/${eventId}/vip`}>
            <Button variant="secondary" className="w-full">
              Continue to VIP
            </Button>
          </Link>
        ) : null}

        {hash ? (
          <div className="rounded-xl border border-emerald/25 bg-emerald/10 px-4 py-3 text-sm text-emerald">
            Claim confirmed — opening VIP checkout…
            <div className="mt-2 font-mono text-xs">
              <a
                href={`${explorerUrl}/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-gold hover:underline"
              >
                {hash.slice(0, 12)}…
              </a>
            </div>
          </div>
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

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl py-16 text-center text-sm text-muted">Loading…</div>
      }
    >
      <ClaimInner />
    </Suspense>
  )
}
