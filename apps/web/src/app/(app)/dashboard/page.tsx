'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Badge, Skeleton, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TxHistoryList } from '@/components/shared/TxHistory'
import { ChainSwitcher } from '@/components/shared/ChainSwitcher'
import { useLedgerHistory, useTreasury, useWallet } from '@/hooks/useLedger'
import { arcTestnet } from '@/config/chains'
import { explorerAddress, formatMon, shortAddress } from '@/lib/utils'
import type { SparkEvent } from '@/types/events'

const paths = [
  {
    href: '/events',
    label: 'Browse events',
    hint: 'Claim gas, buy VIP, get a pass',
    tone: 'gold' as const,
  },
  {
    href: '/passes',
    label: 'My passes',
    hint: 'QR cards proved on Arc',
    tone: 'ok' as const,
  },
  {
    href: '/events/new',
    label: 'Create event',
    hint: 'Merchants list & get paid',
    tone: 'neutral' as const,
  },
  {
    href: '/sponsor',
    label: 'Fund vault',
    hint: 'Sponsor claims for guests',
    tone: 'warn' as const,
  },
]

export default function DashboardPage() {
  const { address, chainId } = useWallet()
  const { stats, isLoading, demo, ledgerAddress, gasSymbol, explorerUrl, chainLabel } =
    useTreasury()
  const history = useLedgerHistory()
  const onArc = chainId === arcTestnet.id

  const eventsQuery = useQuery({
    queryKey: ['events', 'dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/events')
      const json = (await res.json()) as { events?: SparkEvent[]; error?: string }
      if (!res.ok) throw new Error(json.error || 'Failed to load events')
      return json.events ?? []
    },
  })

  const liveEvents = (eventsQuery.data ?? []).slice(0, 3)

  return (
    <div className="space-y-12">
      <div className="relative overflow-hidden rounded-3xl border border-hair px-6 py-10 sm:px-10"
        style={{
          background:
            'linear-gradient(135deg, #1a1408 0%, #0a0a0a 48%, #0c1210 100%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="relative flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <div className="font-display text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
              <span className="text-gold">Spark</span>
              <span className="text-ink">Gas</span>
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
              Event Mode home
            </h1>
            <p className="mt-2 max-w-md text-muted">
              Arc for VIP nights. Monad for classic gas sponsorship. Pick a path — don’t hunt the
              nav.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={onArc ? 'ok' : 'neutral'}>{onArc ? 'On Arc' : chainLabel}</Badge>
              {stats?.paused ? (
                <Badge tone="danger">Vault paused</Badge>
              ) : (
                <Badge tone="gold">{demo ? 'Demo vault' : 'Vault live'}</Badge>
              )}
              {address ? (
                <Badge tone="neutral">{shortAddress(address, 4)}</Badge>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ChainSwitcher />
            <Link href="/events">
              <Button>Open events</Button>
            </Link>
          </div>
        </motion.div>
      </div>

      <section>
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
          Start here
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {paths.map((p, i) => (
            <motion.div
              key={p.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
            >
              <Link
                href={p.href}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-hair bg-white/[0.02] px-5 py-5 transition hover:-translate-y-0.5 hover:border-gold/35"
              >
                <div>
                  <div className="font-display text-xl group-hover:text-gold">{p.label}</div>
                  <p className="mt-1 text-sm text-muted">{p.hint}</p>
                </div>
                <Badge tone={p.tone}>→</Badge>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
              Live on Arc
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold">Tonight’s listings</h2>
          </div>
          <Link href="/events" className="text-sm text-gold hover:underline">
            All events →
          </Link>
        </div>
        {eventsQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : liveEvents.length === 0 ? (
          <div className="rounded-2xl border border-hair px-5 py-8 text-sm text-muted">
            No events yet.{' '}
            <Link href="/events/new" className="text-gold hover:underline">
              Create the first
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {liveEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group flex min-h-[9.5rem] flex-col justify-between rounded-2xl border border-hair p-5 transition hover:-translate-y-0.5 hover:border-gold/40"
                style={{ background: event.coverGradient }}
              >
                <div>
                  <div className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-gold/90">
                    {event.vipPriceUsdc} USDC · {event.vipLabel}
                  </div>
                  <h3 className="mt-2 font-display text-xl group-hover:text-gold">{event.name}</h3>
                </div>
                <p className="mt-4 truncate text-xs text-muted-2">
                  {event.date} · {event.venue}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-muted-2">
              Vault
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              Sponsorship on {chainLabel}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {onArc
                ? 'This USDC funds guest claims before VIP checkout.'
                : 'Switch to Arc for Event Mode gas, or fund Monad for the classic demo.'}
            </p>
            {ledgerAddress ? (
              <a
                href={explorerAddress(explorerUrl, ledgerAddress)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block font-mono text-xs text-gold hover:underline"
              >
                {shortAddress(ledgerAddress, 6)}
              </a>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/sponsor">
              <Button size="sm">Deposit {gasSymbol}</Button>
            </Link>
            <Link href="/claim">
              <Button size="sm" variant="secondary">
                Claim
              </Button>
            </Link>
          </div>
        </div>

        {isLoading || !stats ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Treasury" value={`${formatMon(stats.treasuryBalance)} ${gasSymbol}`} />
            <StatCard
              label="Total sponsored"
              value={`${formatMon(stats.totalSponsored)} ${gasSymbol}`}
            />
            <StatCard label="Users helped" value={stats.usersHelped.toString()} />
            <StatCard
              label="Max claim"
              value={`${formatMon(stats.maxClaimAmount)} ${gasSymbol}`}
              hint={`${stats.depositCount.toString()} deposits`}
            />
          </div>
        )}
      </section>

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
