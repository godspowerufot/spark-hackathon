'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { VipPassCard } from '@/components/shared/VipPassCard'
import { getChainConfig, arcTestnet } from '@/config/chains'

function VerifyInner() {
  const search = useSearchParams()
  const tx = search.get('tx') || ''
  const holder = search.get('holder') || ''
  const eventId = search.get('event') || ''
  const intent = search.get('intent') || ''
  const msg = search.get('msg') || ''
  const cfg = getChainConfig(arcTestnet.id)

  const { data, isLoading, error } = useQuery({
    queryKey: ['verify', tx, holder, eventId, intent, msg],
    queryFn: async () => {
      const q = new URLSearchParams({ tx, holder, event: eventId })
      if (intent) q.set('intent', intent)
      if (msg) q.set('msg', msg)
      const res = await fetch(`/api/verify?${q}`)
      return res.json() as Promise<{
        ok: boolean
        verified?: boolean
        agentPurchase?: boolean
        intentVerified?: boolean | null
        error?: string
        explorerUrl?: string
        pass?: {
          eventId: string
          eventName: string
          vipLabel: string
          amountLabel: string
          txHash: string
          holder: string
          paymentId: string
        }
      }>
    },
    enabled: Boolean(tx && holder),
  })

  if (!tx || !holder) {
    return (
      <Card className="mx-auto max-w-lg">
        <p className="text-sm text-muted">Invalid verify link. Scan an agent ticket QR.</p>
        <Link href="/agent" className="mt-4 inline-block text-gold hover:underline">
          Agent desk
        </Link>
      </Card>
    )
  }

  if (isLoading) {
    return <Skeleton className="mx-auto h-72 max-w-lg" />
  }

  const verified = Boolean(data?.verified && data.pass)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
          Agent door check
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Verify ticket</h1>
        <p className="mt-2 text-muted">
          Confirms the Arc VIP payment and, when present, the agent’s signed buy-vip intent.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {verified ? (
          <Badge tone="ok">On-chain purchase verified</Badge>
        ) : (
          <Badge tone="danger">Not verified</Badge>
        )}
        {data?.agentPurchase ? <Badge tone="gold">Agent purchase</Badge> : null}
        {data?.intentVerified === true ? <Badge tone="ok">Intent signature valid</Badge> : null}
        {data?.intentVerified === false ? <Badge tone="danger">Intent invalid</Badge> : null}
      </div>

      {verified && data?.pass ? (
        <VipPassCard
          eventName={data.pass.eventName}
          vipLabel={data.pass.vipLabel}
          holder={data.pass.holder}
          amountLabel={data.pass.amountLabel}
          txHash={data.pass.txHash}
          explorerUrl={cfg.explorerUrl}
          eventId={data.pass.eventId}
          paymentId={data.pass.paymentId}
          verifyUrl={typeof window !== 'undefined' ? window.location.href : undefined}
        />
      ) : (
        <Card className="space-y-3">
          <p className="text-sm text-danger-soft">
            {data?.error || error?.message || 'Could not verify this ticket'}
          </p>
          {data?.explorerUrl || tx ? (
            <a
              href={data?.explorerUrl || `${cfg.explorerUrl}/tx/${tx}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-gold hover:underline"
            >
              View transaction on ArcScan
            </a>
          ) : null}
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/agent">
          <Button variant="secondary">Agent desk</Button>
        </Link>
        <Link href="/passes">
          <Button variant="ghost">Passes</Button>
        </Link>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-72 max-w-lg" />}>
      <VerifyInner />
    </Suspense>
  )
}
