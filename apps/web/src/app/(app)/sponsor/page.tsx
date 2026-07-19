'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TxHistoryList } from '@/components/shared/TxHistory'
import { useDeposit, useLedgerHistory, useTreasury, useWallet } from '@/hooks/useLedger'
import { env } from '@/config/env'
import { explorerAddress, formatMon } from '@/lib/utils'

export default function SponsorPage() {
  const { isConnected } = useWallet()
  const { stats, demo, ledgerAddress } = useTreasury()
  const { deposit, isPending, hash } = useDeposit()
  const history = useLedgerHistory()
  const [amount, setAmount] = useState('0.1')

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">Sponsor</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Deposit MON</h1>
        <p className="mt-2 text-muted">
          Fund the treasury so new wallets can claim gas. Current vault:{' '}
          <span className="font-mono text-gold">
            {stats ? formatMon(stats.treasuryBalance) : '—'} MON
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={demo ? 'warn' : 'ok'}>{demo ? 'Demo mode' : 'On-chain'}</Badge>
          {ledgerAddress ? (
            <a
              href={explorerAddress(env.explorerUrl, ledgerAddress)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-gold hover:underline"
            >
              SparkGas vault {ledgerAddress.slice(0, 8)}…
            </a>
          ) : null}
        </div>
      </div>

      {!isConnected ? (
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">Connect a wallet to deposit sponsorship funds.</p>
          <ConnectButton />
        </Card>
      ) : null}

      <Card className="space-y-5">
        <label className="block">
          <span className="mb-2 block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
            Amount (MON)
          </span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-hair bg-white/[0.02] px-4 py-3 font-mono text-sm outline-none focus:border-glass-border"
            placeholder="0.1"
            inputMode="decimal"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {['0.05', '0.1', '0.5', '1'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className="rounded-lg border border-hair px-3 py-1.5 font-mono text-xs text-muted hover:border-gold/40 hover:text-ink"
            >
              {preset} MON
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-hair bg-glass px-4 py-3 text-sm text-muted">
          Calls <span className="font-mono text-gold">deposit()</span> with{' '}
          <span className="font-mono text-ink">{amount || '0'} MON</span>. Emits{' '}
          <span className="text-gold">SponsorDeposited</span>.
        </div>
        <Button
          disabled={!isConnected || isPending || !amount || Number(amount) <= 0}
          onClick={() => void deposit(amount)}
          className="w-full sm:w-auto"
        >
          {isPending ? 'Confirming…' : 'Deposit MON'}
        </Button>
        {hash ? (
          <p className="font-mono text-xs text-muted">
            Pending tx:{' '}
            <a
              href={`${env.explorerUrl}/tx/${hash}`}
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:underline"
            >
              {hash.slice(0, 10)}…
            </a>
          </p>
        ) : null}
      </Card>

      <TxHistoryList
        title="Deposit history"
        items={history.deposits}
        empty="No deposits yet. Be the first sponsor."
        isLoading={history.isLoading}
        kind="deposit"
      />
    </div>
  )
}
