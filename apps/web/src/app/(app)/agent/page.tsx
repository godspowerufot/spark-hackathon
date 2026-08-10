'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { VipPassCard } from '@/components/shared/VipPassCard'
import { FlowStepper, type FlowStep } from '@/components/shared/FlowStepper'
import { getChainConfig, arcTestnet } from '@/config/chains'
import { loadLocalPasses, passVerifyPath, saveLocalPass, type StoredPass } from '@/lib/passes'
import { humanError, shortAddress, shortHash } from '@/lib/utils'
import type { SparkEvent } from '@/types/events'
import type { AgentPurchaseResult } from '@/lib/agentIntent'
import { AgentLiveFeed, makeReply, type AgentReply } from '@/components/shared/AgentLiveFeed'

const STEPS: FlowStep[] = [
  { id: 'intent', label: 'Sign intent', hint: 'Agent authorizes buy-vip.' },
  { id: 'settle', label: 'Settle USDC', hint: 'Claim if needed, pay on Arc.' },
  { id: 'verify', label: 'Verify', hint: 'On-chain proof + QR.' },
]

type AgentStatus = {
  configured: boolean
  agent?: string
  error?: string
  payment?: string | null
}

type ApiPass = StoredPass & { paymentId?: string }

export default function AgentDeskPage() {
  const cfg = getChainConfig(arcTestnet.id)
  const queryClient = useQueryClient()
  const [eventId, setEventId] = useState('arc-summit-vip')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<AgentPurchaseResult | null>(null)
  const [replies, setReplies] = useState<AgentReply[]>([])
  const [selected, setSelected] = useState<ApiPass | null>(null)

  const statusQuery = useQuery({
    queryKey: ['agent-status'],
    queryFn: async () => {
      const res = await fetch('/api/agent/buy-vip')
      return res.json() as Promise<AgentStatus>
    },
  })

  const agent = statusQuery.data?.agent

  const eventsQuery = useQuery({
    queryKey: ['events', 'agent'],
    queryFn: async () => {
      const res = await fetch('/api/events')
      const json = (await res.json()) as { events?: SparkEvent[] }
      return json.events ?? []
    },
  })

  const passesQuery = useQuery({
    queryKey: ['agent-passes', agent],
    queryFn: async () => {
      const res = await fetch(`/api/passes?address=${agent}`)
      const json = (await res.json()) as { passes?: ApiPass[]; error?: string }
      if (!res.ok) throw new Error(json.error || 'Failed to load agent passes')
      return json.passes ?? []
    },
    enabled: Boolean(agent),
    refetchInterval: 15_000,
  })

  const local = useMemo(
    () => (agent ? loadLocalPasses(agent) : []),
    // refresh after buys via query invalidation + result
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agent, result, passesQuery.dataUpdatedAt],
  )

  const passes = useMemo(() => {
    const map = new Map<string, ApiPass>()
    for (const p of [...(passesQuery.data ?? []), ...local]) {
      map.set(p.txHash.toLowerCase(), { ...p, agent: true })
    }
    return [...map.values()].sort((a, b) => (b.at || 0) - (a.at || 0))
  }, [local, passesQuery.data])

  function pushReply(text: string, tone?: AgentReply['tone']) {
    setReplies((prev) => [...prev.slice(-12), makeReply(text, tone)])
  }

  async function dispatch() {
    setBusy(true)
    setResult(null)
    setStep(0)
    setReplies([])
    try {
      pushReply('Online. Building buy-vip intent…')
      setStep(0)
      await new Promise((r) => setTimeout(r, 400))
      pushReply('Signing buy-vip intent with agent wallet…', 'info')
      setStep(1)
      pushReply('Settling on Arc — claim if needed, then FirstPayment.pay…', 'warn')

      const res = await fetch('/api/agent/buy-vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      const json = (await res.json()) as AgentPurchaseResult & { error?: string }
      if (!res.ok || !json.ok) throw new Error(json.error || 'Agent buy failed')

      setStep(2)
      setResult(json)
      pushReply(`Paid ${json.amountLabel} · tx ${shortHash(json.txHash)}`, 'ok')
      pushReply('Ticket verified path ready — open QR / verify.', 'ok')
      saveLocalPass({
        eventId: json.eventId,
        eventName: json.eventName,
        vipLabel: json.vipLabel,
        amountLabel: json.amountLabel,
        txHash: json.txHash,
        holder: json.agent,
        at: Date.now(),
        agent: true,
        intentSignature: json.signature,
      })
      await queryClient.invalidateQueries({ queryKey: ['agent-passes'] })
      toast.success('Agent bought VIP — verified on Arc')
    } catch (e) {
      toast.error(humanError(e))
      pushReply(e instanceof Error ? e.message : 'Failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const verifyUrl = result ? `${origin}${result.verifyPath}` : undefined

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
          Agentic Economy · Arc
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Agent ticket desk</h1>
        <p className="mt-2 max-w-xl text-muted">
          No operator click to buy. When a merchant publishes an event, this agent automatically
          signs a buy-vip intent and settles USDC on Arc. Use dispatch only to retry a failed buy.
        </p>
      </div>

      <FlowStepper steps={STEPS} current={step} />

      <Card className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {statusQuery.data?.configured ? (
            <Badge tone="ok">Agent online</Badge>
          ) : (
            <Badge tone="warn">Agent key missing</Badge>
          )}
          <Badge tone="gold">Arc Testnet</Badge>
          {agent ? <Badge tone="neutral">{shortAddress(agent, 5)}</Badge> : null}
          <Badge tone="neutral">{passes.length} pass{passes.length === 1 ? '' : 'es'}</Badge>
        </div>

        {!statusQuery.data?.configured ? (
          <p className="text-sm text-muted">
            Set <span className="font-mono text-gold">AGENT_PRIVATE_KEY</span> (or reuse{' '}
            <span className="font-mono">RELAYER_PRIVATE_KEY</span>) in{' '}
            <span className="font-mono">.env.local</span>, fund it / the vault, restart dev.
          </p>
        ) : null}

        <label className="block">
          <span className="mb-2 block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
            Event
          </span>
          <select
            className="w-full rounded-xl border border-hair bg-white/[0.02] px-4 py-3 text-sm outline-none focus:border-glass-border"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            disabled={busy}
          >
            {(eventsQuery.data ?? []).map((e) => (
              <option key={e.id} value={e.id} className="bg-[#0a0a0a]">
                {e.name} · {e.vipPriceUsdc} USDC
              </option>
            ))}
          </select>
        </label>

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            className="w-full"
            disabled={busy || !statusQuery.data?.configured}
            onClick={() => void dispatch()}
          >
            {busy ? 'Agent working…' : 'Retry buy (if auto-buy failed)'}
          </Button>
        </motion.div>

        {replies.length > 0 || busy ? (
          <AgentLiveFeed replies={replies} live={busy} title="Buy-vip agent" />
        ) : null}
      </Card>

      {busy && !result ? <Skeleton className="h-64" /> : null}

      {result ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone="ok">Intent signed</Badge>
            <Badge tone="ok">On-chain settled</Badge>
            <Badge tone="gold">Ticket verified</Badge>
          </div>
          <VipPassCard
            eventName={result.eventName}
            vipLabel={result.vipLabel}
            holder={result.agent}
            amountLabel={result.amountLabel}
            txHash={result.txHash}
            explorerUrl={cfg.explorerUrl}
            eventId={result.eventId}
            verifyUrl={verifyUrl}
          />
          <div className="flex flex-wrap gap-3">
            <Link href={result.verifyPath}>
              <Button>Open verify</Button>
            </Link>
            <a
              href={result.explorerTx}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-hair px-5 py-2.5 font-mono text-sm text-gold hover:underline"
            >
              ArcScan ↗
            </a>
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
              Agent collection
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold">VIP passes bought</h2>
            <p className="mt-1 text-sm text-muted">
              Loaded for the agent wallet — no connect required.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={!agent || passesQuery.isFetching}
            onClick={() => void passesQuery.refetch()}
          >
            Refresh
          </Button>
        </div>

        {!agent && statusQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : passesQuery.isLoading && passes.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : passes.length === 0 ? (
          <Card className="text-center text-sm text-muted">
            No VIP passes yet. Dispatch the agent to buy one.
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {passes.map((pass) => {
              const verifyPath = passVerifyPath(pass)
              const active = selected?.txHash === pass.txHash
              return (
                <button
                  key={pass.txHash}
                  type="button"
                  onClick={() => setSelected(pass)}
                  className="text-left"
                >
                  <div className={active ? 'rounded-2xl ring-1 ring-gold/40' : ''}>
                    <VipPassCard
                      compact
                      eventName={pass.eventName}
                      vipLabel={pass.vipLabel}
                      holder={pass.holder}
                      amountLabel={pass.amountLabel}
                      txHash={pass.txHash}
                      explorerUrl={cfg.explorerUrl}
                      eventId={pass.eventId}
                      paymentId={pass.paymentId}
                      verifyUrl={
                        typeof window !== 'undefined'
                          ? `${window.location.origin}${verifyPath}`
                          : verifyPath
                      }
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="ok">On-chain</Badge>
                    <Badge tone="gold">Agent</Badge>
                    <Link
                      href={verifyPath}
                      className="font-mono text-xs text-gold hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Verify →
                    </Link>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {selected ? (
          <Card className="space-y-4">
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
              Selected pass
            </div>
            <VipPassCard
              eventName={selected.eventName}
              vipLabel={selected.vipLabel}
              holder={selected.holder}
              amountLabel={selected.amountLabel}
              txHash={selected.txHash}
              explorerUrl={cfg.explorerUrl}
              eventId={selected.eventId}
              paymentId={selected.paymentId}
              verifyUrl={`${origin}${passVerifyPath(selected)}`}
            />
          </Card>
        ) : null}
      </section>
    </div>
  )
}
