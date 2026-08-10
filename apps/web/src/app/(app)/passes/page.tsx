'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { VipPassCard } from '@/components/shared/VipPassCard'
import { loadLocalPasses, passVerifyPath, type StoredPass } from '@/lib/passes'
import { getChainConfig, arcTestnet } from '@/config/chains'
import { shortAddress } from '@/lib/utils'
import { useMemo, useState } from 'react'

type ApiPass = StoredPass & { paymentId?: string }

type AgentStatus = {
  configured: boolean
  agent?: string
}

/** Agent VIP collection — no wallet connect */
export default function MyPassesPage() {
  const cfg = getChainConfig(arcTestnet.id)
  const [selected, setSelected] = useState<ApiPass | null>(null)

  const statusQuery = useQuery({
    queryKey: ['agent-status'],
    queryFn: async () => {
      const res = await fetch('/api/agent/buy-vip')
      return res.json() as Promise<AgentStatus>
    },
  })

  const agent = statusQuery.data?.agent

  const local = useMemo(
    () => (agent ? loadLocalPasses(agent) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agent, statusQuery.dataUpdatedAt],
  )

  const chainQuery = useQuery({
    queryKey: ['agent-passes', agent],
    queryFn: async () => {
      const res = await fetch(`/api/passes?address=${agent}`)
      const json = (await res.json()) as { passes?: ApiPass[]; error?: string }
      if (!res.ok) throw new Error(json.error || 'Failed to load passes')
      return json.passes ?? []
    },
    enabled: Boolean(agent),
    refetchInterval: 15_000,
  })

  const passes = useMemo(() => {
    const map = new Map<string, ApiPass>()
    for (const p of [...(chainQuery.data ?? []), ...local]) {
      map.set(p.txHash.toLowerCase(), { ...p, agent: true })
    }
    return [...map.values()].sort((a, b) => (b.at || 0) - (a.at || 0))
  }, [chainQuery.data, local])

  if (statusQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-24" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  if (!statusQuery.data?.configured || !agent) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <h1 className="font-display text-3xl font-semibold">Agent passes</h1>
        <p className="text-muted">
          Agent key not configured. Set RELAYER_PRIVATE_KEY or AGENT_PRIVATE_KEY, then dispatch a
          buy from the desk.
        </p>
        <Link href="/agent">
          <Button>Open agent desk</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
            Agent collection
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold">VIP passes bought</h1>
          <p className="mt-2 text-muted">
            All tickets purchased by the autonomous agent — no wallet connect.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="ok">Agent {shortAddress(agent, 5)}</Badge>
            <Badge tone="neutral">{passes.length} pass{passes.length === 1 ? '' : 'es'}</Badge>
          </div>
        </div>
        <Link href="/agent">
          <Button>Buy another</Button>
        </Link>
      </div>

      {chainQuery.isLoading && passes.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : passes.length === 0 ? (
        <Card className="space-y-4 text-center">
          <p className="text-muted">No VIP passes yet for this agent.</p>
          <Link href="/agent">
            <Button>Dispatch agent</Button>
          </Link>
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
                    Open verify →
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
            verifyUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}${passVerifyPath(selected)}`}
          />
        </Card>
      ) : null}
    </div>
  )
}
