'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, Skeleton } from '@/components/ui/Card'
import { VipPassCard } from '@/components/shared/VipPassCard'
import { getChainConfig, arcTestnet } from '@/config/chains'
import type { SparkEvent } from '@/types/events'

function PassInner() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const tx = search.get('tx') || ''
  const holder = search.get('holder') || ''
  const cfg = getChainConfig(arcTestnet.id)

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${params.id}`)
      const json = (await res.json()) as { event?: SparkEvent; error?: string }
      if (!res.ok) throw new Error(json.error || 'Event not found')
      return json.event!
    },
  })

  if (isLoading) return <Skeleton className="mx-auto h-64 max-w-lg" />
  if (!event || !tx || !holder) {
    return (
      <Card className="mx-auto max-w-lg space-y-3">
        <p className="text-sm text-muted">Pass link incomplete. Buy VIP from the event page.</p>
        <Link href={`/events/${params.id}`} className="text-gold hover:underline">
          Open event
        </Link>
      </Card>
    )
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const verifyUrl = origin
    ? `${origin}/verify?event=${event.id}&tx=${tx}&holder=${holder}`
    : undefined

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
          Shared pass
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold">{event.vipLabel}</h1>
        <p className="mt-2 text-muted">
          {event.name} · scan the QR to verify this purchase on Arc
        </p>
      </div>
      <VipPassCard
        eventName={event.name}
        vipLabel={event.vipLabel}
        holder={holder}
        amountLabel={`${event.vipPriceUsdc} USDC`}
        txHash={tx}
        explorerUrl={cfg.explorerUrl}
        eventId={event.id}
        verifyUrl={verifyUrl}
      />
      <Link href={verifyUrl || `/verify?event=${event.id}&tx=${tx}&holder=${holder}`} className="text-sm text-gold hover:underline">
        Open door verify →
      </Link>
    </div>
  )
}

export default function PassPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-64 max-w-lg" />}>
      <PassInner />
    </Suspense>
  )
}
