'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useSignMessage } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Badge, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FlowStepper, type FlowStep } from '@/components/shared/FlowStepper'
import { ChainSwitcher } from '@/components/shared/ChainSwitcher'
import { useWallet } from '@/hooks/useLedger'
import { arcTestnet, getChainConfig } from '@/config/chains'
import {
  EVENT_COVERS,
  createEventSignMessage,
  slugifyEventId,
} from '@/types/events'
import { humanError, shortAddress } from '@/lib/utils'

const STEPS: FlowStep[] = [
  { id: 'basics', label: 'Basics', hint: 'Name, when, and where.' },
  { id: 'vip', label: 'VIP offer', hint: 'Price and pass label on Arc.' },
  { id: 'publish', label: 'Publish', hint: 'Sign with your merchant wallet.' },
]

const fieldClass =
  'w-full rounded-xl border border-hair bg-white/[0.02] px-4 py-3 text-sm outline-none focus:border-glass-border'

export default function CreateEventPage() {
  const router = useRouter()
  const { address, isConnected, chainId } = useWallet()
  const { signMessageAsync } = useSignMessage()
  const cfg = getChainConfig(arcTestnet.id)
  const onArc = chainId === arcTestnet.id

  const [step, setStep] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [date, setDate] = useState('2026-09-20')
  const [venue, setVenue] = useState('')
  const [vipPriceUsdc, setVipPriceUsdc] = useState('0.05')
  const [vipLabel, setVipLabel] = useState('VIP Pass')
  const [coverGradient, setCoverGradient] = useState(EVENT_COVERS[0].value)

  const previewName = name.trim() || 'Your event'
  const previewSlug = slugifyEventId(name || 'your-event')

  const canNextBasics = Boolean(name.trim() && date && venue.trim())
  const canNextVip = Boolean(Number(vipPriceUsdc) > 0 && vipLabel.trim())

  const signPreview = useMemo(() => {
    if (!address) return ''
    return createEventSignMessage({
      merchantAddress: address,
      name: name.trim() || '…',
      date,
      vipPriceUsdc,
    })
  }, [address, date, name, vipPriceUsdc])

  async function publish() {
    if (!address) return
    setPublishing(true)
    try {
      const message = createEventSignMessage({
        merchantAddress: address,
        name: name.trim(),
        date,
        vipPriceUsdc,
      })
      const signature = await signMessageAsync({ message })
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          merchantAddress: address,
          signature,
          draft: {
            name: name.trim(),
            tagline: tagline.trim(),
            date,
            venue: venue.trim(),
            vipPriceUsdc,
            vipLabel: vipLabel.trim(),
            coverGradient,
          },
        }),
      })
      const json = (await res.json()) as { ok?: boolean; event?: { id: string }; error?: string }
      if (!res.ok || !json.event) throw new Error(json.error || 'Create failed')
      toast.success('Event live on Arc')
      router.push(`/events/${json.event.id}`)
    } catch (e) {
      toast.error(humanError(e))
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/events"
            className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted hover:text-gold"
          >
            ← Events
          </Link>
          <div className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
            SparkGas · Merchants
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">List on Arc</h1>
          <p className="mt-2 max-w-xl text-muted">
            Create an event, sell VIP in USDC, and let guests verify with QR. Payments route through
            FirstPayment to the protocol merchant wallet.
          </p>
        </div>
        <ChainSwitcher />
      </div>

      <FlowStepper steps={STEPS} current={step} />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-6">
          {!isConnected ? (
            <div className="space-y-4 text-center sm:text-left">
              <p className="text-sm text-muted">Connect the wallet that owns this listing.</p>
              <ConnectButton />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 0 ? (
                <motion.div
                  key="basics"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  <label className="block">
                    <span className="mb-2 block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
                      Event name
                    </span>
                    <input
                      className={fieldClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Night Market VIP"
                      maxLength={64}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
                      Tagline
                    </span>
                    <input
                      className={fieldClass}
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Claim gas. Walk in VIP."
                      maxLength={90}
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
                        Date
                      </span>
                      <input
                        type="date"
                        className={fieldClass}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
                        Venue
                      </span>
                      <input
                        className={fieldClass}
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="Lagos · Arc Testnet"
                        maxLength={80}
                      />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <Button disabled={!canNextBasics} onClick={() => setStep(1)}>
                      Next · VIP offer
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              {step === 1 ? (
                <motion.div
                  key="vip"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  <label className="block">
                    <span className="mb-2 block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
                      Pass label
                    </span>
                    <input
                      className={fieldClass}
                      value={vipLabel}
                      onChange={(e) => setVipLabel(e.target.value)}
                      placeholder="VIP Pass"
                      maxLength={32}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
                      Price (USDC on Arc)
                    </span>
                    <input
                      className={`${fieldClass} font-mono`}
                      value={vipPriceUsdc}
                      onChange={(e) => setVipPriceUsdc(e.target.value)}
                      inputMode="decimal"
                      placeholder="0.05"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['0.02', '0.05', '0.1'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setVipPriceUsdc(p)}
                        className="rounded-lg border border-hair px-3 py-1.5 font-mono text-xs text-muted hover:border-gold/40 hover:text-ink"
                      >
                        {p} USDC
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
                      Cover
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {EVENT_COVERS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCoverGradient(c.value)}
                          className={`h-16 rounded-xl border text-left ${
                            coverGradient === c.value ? 'border-gold/50' : 'border-hair'
                          }`}
                          style={{ background: c.value }}
                        >
                          <span className="m-2 inline-block rounded bg-black/50 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-[#F5E6C0]">
                            {c.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-between gap-3">
                    <Button variant="secondary" onClick={() => setStep(0)}>
                      Back
                    </Button>
                    <Button disabled={!canNextVip} onClick={() => setStep(2)}>
                      Next · Publish
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              {step === 2 ? (
                <motion.div
                  key="publish"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  <div className="rounded-xl border border-hair bg-glass px-4 py-3 text-sm text-muted">
                    <div className="flex justify-between gap-3">
                      <span>Merchant</span>
                      <span className="font-mono text-ink">{shortAddress(address, 5)}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span>Network</span>
                      <Badge tone={onArc ? 'ok' : 'warn'}>
                        {onArc ? 'Arc Testnet' : 'Switch to Arc'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span>Checkout</span>
                      <span className="font-mono text-xs text-gold">
                        {shortAddress(cfg.paymentAddress || '', 4)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-muted-2">
                      VIP buys call FirstPayment with memo VIP:{previewSlug}… Funds forward to the
                      contract merchant. Your wallet is recorded as the listing owner.
                    </p>
                  </div>
                  <pre className="overflow-x-auto rounded-xl border border-hair bg-black/40 p-3 font-mono text-[0.65rem] text-muted-2">
                    {signPreview}
                  </pre>
                  <div className="flex flex-wrap justify-between gap-3">
                    <Button variant="secondary" onClick={() => setStep(1)} disabled={publishing}>
                      Back
                    </Button>
                    <Button disabled={publishing || !canNextBasics || !canNextVip} onClick={() => void publish()}>
                      {publishing ? 'Publishing…' : 'Sign & publish'}
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          )}
        </Card>

        <motion.div
          layout
          className="panel flex min-h-[220px] flex-col justify-between p-6"
          style={{ background: coverGradient }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="gold">{vipLabel.trim() || 'VIP Pass'}</Badge>
              <Badge tone="neutral">{vipPriceUsdc || '0'} USDC</Badge>
            </div>
            <h2 className="mt-4 font-display text-2xl">{previewName}</h2>
            <p className="mt-2 text-sm text-muted">
              {tagline.trim() || 'Claim gas. Buy VIP on Arc.'}
            </p>
          </div>
          <div className="mt-8 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-2">
            {date || '—'} · {venue.trim() || 'Venue TBD'}
            <div className="mt-2 normal-case tracking-normal text-gold/80">/{previewSlug}</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
