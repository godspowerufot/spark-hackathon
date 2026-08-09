'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Badge, Card, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { VipPassCard } from '@/components/shared/VipPassCard'
import { useWallet } from '@/hooks/useLedger'
import { loadLocalPasses, passVerifyPath, type StoredPass } from '@/lib/passes'
import { getChainConfig, arcTestnet } from '@/config/chains'
import { useMemo, useState } from 'react'

type ApiPass = StoredPass & { paymentId?: string }

export default function MyPassesPage() {
  const { address, isConnected } = useWallet()
  const cfg = getChainConfig(arcTestnet.id)
  const [selected, setSelected] = useState<ApiPass | null>(null)

  const local = useMemo(
    () => (address ? loadLocalPasses(address) : []),
    // refresh when address changes; localStorage read on each mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [address, isConnected],
  )

  const chainQuery = useQuery({
    queryKey: ['my-passes', address],
    queryFn: async () => {
      const res = await fetch(`/api/passes?address=${address}`)
      const json = (await res.json()) as { passes?: ApiPass[]; error?: string }
      if (!res.ok) throw new Error(json.error || 'Failed to load passes')
      return json.passes ?? []
    },
    enabled: Boolean(address),
    refetchInterval: 20_000,
  })

  const passes = useMemo(() => {
    const map = new Map<string, ApiPass>()
    for (const p of [...(chainQuery.data ?? []), ...local]) {
      map.set(p.txHash.toLowerCase(), p)
    }
    return [...map.values()].sort((a, b) => (b.at || 0) - (a.at || 0))
  }, [chainQuery.data, local])

  if (!isConnected || !address) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <h1 className="font-display text-3xl font-semibold">My passes</h1>
        <p className="text-muted">Connect the wallet that bought VIP to see your cards.</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
            Collection
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold">My VIP passes</h1>
          <p className="mt-2 text-muted">
            Cards you’ve bought on Arc. Scan the QR to verify the payment on-chain.
          </p>
        </div>
        <Link href="/events">
          <Button variant="secondary">Browse events</Button>
        </Link>
      </div>

      {chainQuery.isLoading && passes.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : passes.length === 0 ? (
        <Card className="space-y-4 text-center">
          <p className="text-muted">No VIP passes yet for this wallet.</p>
          <Link href="/events/arc-summit-vip">
            <Button>Get Arc Summit VIP</Button>
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
                <div className={active ? 'ring-1 ring-gold/40 rounded-2xl' : ''}>
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
                <div className="mt-2 flex gap-2">
                  <Badge tone="ok">On-chain</Badge>
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
