'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { SparkEvent } from '@/types/events'

export default function EventsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch('/api/events')
      const json = (await res.json()) as { events?: SparkEvent[]; error?: string }
      if (!res.ok) throw new Error(json.error || 'Failed to load events')
      return json.events ?? []
    },
  })

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">Events</div>
          <h1 className="mt-2 font-display text-3xl font-semibold">Events agents can buy</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Listings with VIP prices in USDC. Dispatch an agent or sign intent yourself, then verify
            on-chain.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/agent">
            <Button>Agent desk</Button>
          </Link>
          <Link href="/events/new">
            <Button variant="secondary">Create event</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : error ? (
        <Card className="space-y-3">
          <p className="text-sm text-danger-soft">
            {error instanceof Error ? error.message : 'Could not load events'}
          </p>
          <Button variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
          <p className="text-xs text-muted">
            If empty, restart the dev server after adding JSONBin keys, then POST seed via{' '}
            <span className="font-mono">/api/events</span>.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className="group block">
              <div
                className="panel flex h-full flex-col justify-between p-6 transition duration-300 group-hover:-translate-y-1"
                style={{ background: event.coverGradient }}
              >
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="gold">{event.vipLabel}</Badge>
                    <Badge tone="neutral">{event.vipPriceUsdc} USDC</Badge>
                  </div>
                  <h2 className="mt-4 font-display text-2xl">{event.name}</h2>
                  <p className="mt-2 text-sm text-muted">{event.tagline}</p>
                </div>
                <div className="mt-6 flex items-end justify-between gap-3">
                  <div className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-2">
                    {event.date} · {event.sponsors.length} sponsors
                  </div>
                  <span className="text-sm text-gold">Open →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
