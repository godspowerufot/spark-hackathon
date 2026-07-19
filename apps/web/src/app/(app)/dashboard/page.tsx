'use client'

import Link from 'next/link'
import { Badge, Skeleton, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TxHistoryList } from '@/components/shared/TxHistory'
import { useLedgerHistory, useTreasury } from '@/hooks/useLedger'
import { env } from '@/config/env'
import { explorerAddress, formatMon } from '@/lib/utils'

export default function DashboardPage() {
  const { stats, isLoading, demo, ledgerAddress } = useTreasury()
  const history = useLedgerHistory()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
            Dashboard
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold">Treasury overview</h1>
          <p className="mt-2 text-muted">
            Live sponsorship metrics {demo ? '(demo ledger)' : 'from GasSponsorLedger'}.
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
        <div className="flex gap-3">
          <Link href="/sponsor">
            <Button>Deposit MON</Button>
          </Link>
          <Link href="/claim">
            <Button variant="secondary">Claim Gas</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {stats?.paused ? <Badge tone="danger">Contract paused</Badge> : <Badge tone="ok">Live</Badge>}
        <Badge tone={demo ? 'warn' : 'gold'}>{demo ? 'Demo mode' : 'On-chain'}</Badge>
      </div>

      {isLoading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Treasury" value={`${formatMon(stats.treasuryBalance)} MON`} />
          <StatCard label="Total sponsored" value={`${formatMon(stats.totalSponsored)} MON`} />
          <StatCard label="Users helped" value={stats.usersHelped.toString()} />
          <StatCard
            label="Max claim"
            value={`${formatMon(stats.maxClaimAmount)} MON`}
            hint={`${stats.depositCount.toString()} deposits`}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <TxHistoryList
          title="Recent deposits"
          items={history.deposits}
          empty="No deposits yet."
          isLoading={history.isLoading}
          kind="deposit"
        />
        <TxHistoryList
          title="Recent claims"
          items={history.claims}
          empty="No claims yet."
          isLoading={history.isLoading}
          kind="claim"
        />
      </div>
    </div>
  )
}
