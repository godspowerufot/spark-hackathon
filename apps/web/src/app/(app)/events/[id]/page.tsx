'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChainSwitcher } from '@/components/shared/ChainSwitcher'
import { FlowStepper, ONBOARDING_FLOW } from '@/components/shared/FlowStepper'
import { useWallet } from '@/hooks/useLedger'
import { useBalance } from 'wagmi'
import { parseEther } from 'viem'
import { arcTestnet } from '@/config/chains'
import type { SparkEvent } from '@/types/events'
import { shortAddress } from '@/lib/utils'

const tierTone: Record<string, 'gold' | 'ok' | 'neutral' | 'warn'> = {
  platinum: 'gold',
  gold: 'gold',
  silver: 'neutral',
  community: 'ok',
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { address, isConnected, chainId } = useWallet()
  const onArc = chainId === arcTestnet.id
  const balance = useBalance({ address, chainId })

  const { data, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`)
      const json = (await res.json()) as { event?: SparkEvent; error?: string }
      if (!res.ok) throw new Error(json.error || 'Event not found')
      return json.event!
    },
  })

  const event = data
  const priceWei = event ? parseEther(event.vipPriceUsdc) : 0n
  const canAfford = balance.data != null && balance.data.value >= priceWei
  const step = canAfford ? 1 : 0

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <Card className="mx-auto max-w-xl">
        <p className="text-sm text-danger-soft">
          {error instanceof Error ? error.message : 'Event not found'}
        </p>
        <Link href="/events" className="mt-4 inline-block text-gold hover:underline">
          ← All events
        </Link>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/events"
            className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted hover:text-gold"
          >
            ← Events
          </Link>
          <h1 className="mt-3 font-display text-4xl font-semibold">{event.name}</h1>
          <p className="mt-2 text-lg text-muted">{event.tagline}</p>
        </div>
        <ChainSwitcher />
      </div>

      <div
        className="overflow-hidden rounded-2xl border border-hair px-6 py-10"
        style={{ background: event.coverGradient }}
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="gold">{event.vipLabel}</Badge>
          <Badge tone="ok">{event.vipPriceUsdc} USDC</Badge>
          <Badge tone="neutral">{event.date}</Badge>
        </div>
        <p className="mt-6 max-w-xl text-muted">{event.description}</p>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-muted-2">
          {event.venue}
          {event.merchantAddress ? (
            <>
              {' '}
              · Listed by {shortAddress(event.merchantAddress, 4)}
            </>
          ) : null}
        </p>
      </div>

      <FlowStepper steps={ONBOARDING_FLOW} current={step} />

      <Card className="space-y-4">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
          Sponsors
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {event.sponsors.map((s) => (
            <div
              key={s.name}
              className="flex items-start justify-between gap-3 rounded-xl border border-hair bg-white/[0.02] px-4 py-3"
            >
              <div>
                <div className="font-display text-lg">{s.name}</div>
                {s.blurb ? <p className="mt-1 text-sm text-muted">{s.blurb}</p> : null}
              </div>
              <Badge tone={tierTone[s.tier] || 'neutral'}>{s.tier}</Badge>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted">
          Sponsors deposit USDC into the SparkGas vault so attendees can claim gas before buying
          VIP.{' '}
          <Link href="/sponsor" className="text-gold hover:underline">
            Deposit as sponsor →
          </Link>
        </p>
      </Card>

      <Card className="space-y-5">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
          Your path
        </div>
        {!isConnected ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Connect wallet to claim gas and buy VIP.</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-3 text-sm text-muted">
            <p>
              Balance:{' '}
              <span className="font-mono text-gold">
                {balance.data ? Number(balance.data.formatted).toFixed(4) : '—'} USDC
              </span>
              {!onArc ? ' · switch to Arc' : null}
            </p>
            <div className="flex flex-wrap gap-3">
              {!canAfford ? (
                <Link href={`/claim?event=${event.id}`}>
                  <Button variant="secondary">Claim gas</Button>
                </Link>
              ) : (
                <Badge tone="ok">Gas ready</Badge>
              )}
              <Link href={`/events/${event.id}/vip`}>
                <Button variant={canAfford ? 'primary' : 'secondary'}>
                  Agent buy · {event.vipLabel}
                </Button>
              </Link>
              <Link href="/agent">
                <Button variant="ghost">Autonomous desk</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
