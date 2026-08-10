'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useSignMessage } from 'wagmi'
import { parseEther, type Hex } from 'viem'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChainSwitcher } from '@/components/shared/ChainSwitcher'
import { FlowStepper, type FlowStep } from '@/components/shared/FlowStepper'
import { VipPassCard } from '@/components/shared/VipPassCard'
import { useWallet } from '@/hooks/useLedger'
import { useFirstPayment } from '@/hooks/usePayment'
import { formatMon, humanError } from '@/lib/utils'
import { vipMemo, type SparkEvent } from '@/types/events'
import { arcTestnet } from '@/config/chains'
import { saveLocalPass } from '@/lib/passes'
import type { BuyVipIntent } from '@/lib/agentIntent'

const STEPS: FlowStep[] = [
  { id: 'intent', label: 'Sign intent', hint: 'Authorize buy-vip as agent.' },
  { id: 'pay', label: 'Settle', hint: 'Pay USDC on Arc.' },
  { id: 'done', label: 'Verify', hint: 'QR proves the purchase.' },
]

export default function EventVipPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const { address, isConnected, chainId } = useWallet()
  const onArc = chainId === arcTestnet.id
  const { signMessageAsync } = useSignMessage()

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
  const [intent, setIntent] = useState<BuyVipIntent | null>(null)
  const [intentMessage, setIntentMessage] = useState('')
  const [intentSig, setIntentSig] = useState<Hex | undefined>()
  const [signing, setSigning] = useState(false)

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
      agent: true,
      intentSignature: intentSig,
    })
  }, [address, event, hash, intentSig, isSuccess])

  async function signIntent() {
    if (!address || !event) return
    setSigning(true)
    try {
      const res = await fetch('/api/agent/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, agent: address }),
      })
      const json = (await res.json()) as {
        ok?: boolean
        intent?: BuyVipIntent
        message?: string
        error?: string
      }
      if (!res.ok || !json.intent || !json.message) throw new Error(json.error || 'Intent failed')
      const signature = await signMessageAsync({ message: json.message })
      setIntent(json.intent)
      setIntentMessage(json.message)
      setIntentSig(signature)
      toast.success('Intent signed — settle on Arc')
    } catch (e) {
      toast.error(humanError(e))
    } finally {
      setSigning(false)
    }
  }

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

  const flowStep = passTx ? 2 : intentSig ? 1 : 0

  const verifyUrl =
    typeof window !== 'undefined' && passTx && address && intentSig && intentMessage
      ? `${window.location.origin}/verify?event=${event.id}&tx=${passTx}&holder=${address}&intent=${intentSig}&msg=${encodeURIComponent(intentMessage)}`
      : undefined

  if (passTx && address) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
            Agent ticket
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold">Purchased & verified</h1>
          <p className="mt-2 text-muted">
            Signed intent + Arc payment. Scan the QR to prove this agent bought the ticket.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="ok">Intent signed</Badge>
          <Badge tone="ok">On-chain paid</Badge>
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
          <Button onClick={() => router.push(verifyUrl?.replace(window.location.origin, '') || '/verify')}>
            Open verify
          </Button>
          <Button variant="secondary" onClick={() => router.push('/agent')}>
            Agent desk
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
          <h1 className="mt-3 font-display text-3xl font-semibold">Agent buy · {event.vipLabel}</h1>
          <p className="mt-2 text-muted">
            Sign a buy-vip intent, then settle USDC on Arc. Prefer fully autonomous?{' '}
            <Link href="/agent" className="text-gold hover:underline">
              Agent desk
            </Link>
          </p>
        </div>
        <ChainSwitcher />
      </div>

      <FlowStepper steps={STEPS} current={flowStep} />

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
          <div className="mt-2 flex justify-between">
            <span>Intent</span>
            <Badge tone={intentSig ? 'ok' : 'neutral'}>
              {intentSig ? 'Signed' : 'Required'}
            </Badge>
          </div>
        </div>

        {intentMessage ? (
          <pre className="overflow-x-auto rounded-xl border border-hair bg-black/40 p-3 font-mono text-[0.65rem] text-muted-2">
            {intentMessage}
          </pre>
        ) : null}

        {!isConnected ? (
          <ConnectButton />
        ) : !intentSig ? (
          <Button className="w-full" disabled={!onArc || signing} onClick={() => void signIntent()}>
            {signing ? 'Sign in wallet…' : '1. Sign buy-vip intent'}
          </Button>
        ) : !enoughBalance ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Intent signed. Need sponsored USDC to settle.</p>
            <Link href={`/claim?event=${event.id}`}>
              <Button className="w-full">Claim gas</Button>
            </Link>
          </div>
        ) : (
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full"
              disabled={!onArc || !enabled || isPending || !paymentAddress}
              onClick={() => void pay(intent?.memo || vipMemo(event.id))}
            >
              {isPending ? 'Settling…' : `2. Pay ${event.vipPriceUsdc} USDC`}
            </Button>
          </motion.div>
        )}
      </Card>
    </div>
  )
}
