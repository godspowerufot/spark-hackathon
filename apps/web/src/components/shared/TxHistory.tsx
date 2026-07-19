'use client'

import { Card, Skeleton } from '@/components/ui/Card'
import { env } from '@/config/env'
import type { LedgerHistoryItem } from '@/hooks/useLedger'
import { explorerTx, formatMon, shortAddress, shortHash } from '@/lib/utils'

export function TxHistoryList({
  title,
  items,
  empty,
  isLoading,
  kind,
}: {
  title: string
  items: LedgerHistoryItem[]
  empty: string
  isLoading?: boolean
  kind?: 'deposit' | 'claim' | 'all'
}) {
  const filtered =
    kind && kind !== 'all' ? items.filter((item) => item.kind === kind) : items

  return (
    <Card>
      <h2 className="font-display text-xl">{title}</h2>
      {isLoading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <li className="text-sm text-muted">{empty}</li>
          ) : (
            filtered.slice(0, 12).map((item) => {
              const isDemoHash =
                item.txHash.startsWith('0xdemo') || item.txHash.startsWith('0xclaim')
              const href = isDemoHash
                ? undefined
                : explorerTx(env.explorerUrl, item.txHash)

              return (
                <li
                  key={`${item.txHash}-${item.logIndex}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-hair px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-muted">{shortAddress(item.actor)}</div>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[0.7rem] text-gold/80 hover:underline"
                      >
                        {shortHash(item.txHash)}
                      </a>
                    ) : (
                      <span className="font-mono text-[0.7rem] text-muted-2">
                        {shortHash(item.txHash)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={
                        item.kind === 'claim'
                          ? 'font-mono text-emerald'
                          : 'font-mono text-gold'
                      }
                    >
                      {item.kind === 'claim' ? '+' : ''}
                      {formatMon(item.amount)} MON
                    </div>
                    <div className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-2">
                      {item.kind}
                    </div>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      )}
    </Card>
  )
}
