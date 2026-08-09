'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { parseEther, type Hex } from 'viem'
import { motion } from 'framer-motion'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChainSwitcher } from '@/components/shared/ChainSwitcher'
import { FlowStepper, ONBOARDING_FLOW } from '@/components/shared/FlowStepper'
import { VipPassCard } from '@/components/shared/VipPassCard'
import { useWallet } from '@/hooks/useLedger'
import { useFirstPayment } from '@/hooks/usePayment'
import { formatMon } from '@/lib/utils'
import { vipMemo, type SparkEvent } from '@/types/events'
import { arcTestnet } from '@/config/chains'
import { saveLocalPass } from '@/lib/passes'

export default function EventVipPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const { address, isConnected, chainId } = useWallet()
  const onArc = chainId === arcTestnet.id

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`)
      const json = (await res.json()) as { event?: SparkEvent; error?: string }
      if (!res.ok) throw new Error(json.error || 'Event not found')
      return json.event!
    },
  })

  const amountWei = useMemo(
    () => (event ? parseEther(event.vipPriceUsdc) : 50_000_000_000_000_000n),
    [event],
  )

  const {
    pay,
    hash,
    isPending,
    isSuccess,
    enoughBalance,
    balance,
    gasSymbol,
    explorerUrl,
    paymentAddress,
    enabled,
  } = useFirstPayment({
    amountWei,
    amountLabel: event?.vipPriceUsdc || '0.05',
    memo: event ? vipMemo(event.id) : 'VIP',
  })

  const [passTx, setPassTx] = useState<Hex | undefined>()

  useEffect(() => {
    if (!hash || !isSuccess || !address || !event) return
    setPassTx(hash)
    saveLocalPass({
      eventId: event.id,
      eventName: event.name,
      vipLabel: event.vipLabel,
      amountLabel: `${event.vipPriceUsdc} USDC`,
      txHash: hash,
      holder: address,
      at: Date.now(),
    })
  }, [address, event, hash, isSuccess])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <Card className="mx-auto max-w-xl">
        <p className="text-sm text-danger-soft">
          {error instanceof Error ? error.message : 'Event not found'}
        </p>
      </Card>
    )
  }

  const verifyUrl =
    typeof window !== 'undefined' && passTx && address
      ? `${window.location.origin}/verify?event=${event.id}&tx=${passTx}&holder=${address}`
      : undefined

  if (passTx && address) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
            VIP pass
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold">You’re in</h1>
          <p className="mt-2 text-muted">
            Scan the QR at the door — it proves this purchase on Arc.
          </p>
        </div>
        <VipPassCard
          eventName={event.name}
          vipLabel={event.vipLabel}
          holder={address}
          amountLabel={`${event.vipPriceUsdc} USDC`}
          txHash={passTx}
          explorerUrl={explorerUrl}
          eventId={event.id}
          verifyUrl={verifyUrl}
        />
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push('/passes')}>View my passes</Button>
          <Button variant="secondary" onClick={() => router.push(`/events/${event.id}`)}>
            Back to event
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/events/${event.id}`}
            className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted hover:text-gold"
          >
            ← {event.name}
          </Link>
          <h1 className="mt-3 font-display text-3xl font-semibold">Buy {event.vipLabel}</h1>
          <p className="mt-2 text-muted">
            Pay with claimed USDC on Arc. You’ll get a shareable VIP pass card.
          </p>
        </div>
        <ChainSwitcher />
      </div>

      <FlowStepper steps={ONBOARDING_FLOW} current={1} />

      <Card className="space-y-5">
        <div className="flex justify-between gap-3">
          <div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
              Ticket
            </div>
            <h2 className="mt-2 font-display text-2xl">{event.vipLabel}</h2>
            <p className="text-sm text-muted">{event.name}</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-3xl text-gold">{event.vipPriceUsdc}</div>
            <div className="font-mono text-xs text-muted-2">USDC</div>
          </div>
        </div>

        <div className="rounded-xl border border-hair bg-glass px-4 py-3 text-sm text-muted">
          <div className="flex justify-between">
            <span>Balance</span>
            <span className="font-mono text-ink">
              {balance != null ? formatMon(balance) : '—'} {gasSymbol}
            </span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Network</span>
            <Badge tone={onArc ? 'ok' : 'warn'}>{onArc ? 'Arc' : 'Switch to Arc'}</Badge>
          </div>
        </div>

        {!isConnected ? (
          <ConnectButton />
        ) : !enoughBalance ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Need sponsored USDC first.</p>
            <Link href={`/claim?event=${event.id}`}>
              <Button className="w-full">Claim gas</Button>
            </Link>
          </div>
        ) : (
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full"
              disabled={!onArc || !enabled || isPending || !paymentAddress}
              onClick={() => void pay()}
            >
              {isPending ? 'Confirming…' : `Pay ${event.vipPriceUsdc} USDC for VIP`}
            </Button>
          </motion.div>
        )}
      </Card>
    </div>
  )
}
