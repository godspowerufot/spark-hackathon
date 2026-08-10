'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const SHOTS = [
  {
    n: '01',
    title: 'Hook · Agentic Economy',
    path: '/',
    vo: 'On Arc, an agent holds a wallet and pays in USDC — gas is money.',
    beat: 'Landing hero · SparkGas · Agents buy. Arc verifies.',
    dur: '8–10s',
  },
  {
    n: '02',
    title: 'Merchant lists a night',
    path: '/events/new',
    vo: 'A merchant publishes an event. That create is the only human trigger.',
    beat: 'Fill name / price → Sign & publish. Say: “I’m not buying — I’m listing.”',
    dur: '20–25s',
  },
  {
    n: '03',
    title: 'Agent auto-buys (no dispatch)',
    path: '/events/new',
    vo: 'The moment the event goes live, the agent signs a buy-vip intent and settles USDC on Arc.',
    beat: 'Hold on “Publishing…” / toast “agent auto-bought”. Cut to verify.',
    dur: '15–20s',
  },
  {
    n: '04',
    title: 'Door check · on-chain proof',
    path: '/verify',
    vo: 'Scan the QR. Payment and intent verify on-chain — the agent really bought this ticket.',
    beat: 'Show On-chain verified + Intent signature valid badges.',
    dur: '12–15s',
  },
  {
    n: '05',
    title: 'Agent collection',
    path: '/agent',
    vo: 'No wallet connect. Every VIP the agent bought lives here — autonomous settlement, visible proof.',
    beat: 'Pass grid + agent address badge. End on foil card + QR.',
    dur: '10–12s',
  },
] as const

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
          Hackathon video · Agentic Economy
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          Record this path
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          ~90 seconds. One story: merchant lists → agent pays on Arc → door verifies. Stay on Arc
          Testnet. Fund the vault before you record.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="gold">Arc USDC</Badge>
          <Badge tone="ok">Auto-buy on create</Badge>
          <Badge tone="neutral">No LLM required</Badge>
        </div>
      </div>

      <Card className="space-y-3">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
          One-line pitch (say on shot 01)
        </div>
        <p className="font-display text-xl text-ink">
          SparkGas: an Arc wallet agent that settles VIP tickets in USDC the moment an event is
          listed — signed intent, on-chain verify.
        </p>
      </Card>

      <ol className="space-y-4">
        {SHOTS.map((shot, i) => (
          <motion.li
            key={shot.n}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-hair bg-white/[0.02] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[0.62rem] tracking-[0.2em] text-gold">
                  {shot.n} · {shot.dur}
                </div>
                <h2 className="mt-2 font-display text-xl">{shot.title}</h2>
              </div>
              <Link href={shot.path}>
                <Button size="sm" variant="secondary">
                  Open
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-sm text-muted">
              <span className="text-gold">VO: </span>
              {shot.vo}
            </p>
            <p className="mt-2 text-sm text-muted-2">
              <span className="text-ink/80">Camera: </span>
              {shot.beat}
            </p>
          </motion.li>
        ))}
      </ol>

      <Card className="space-y-4">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
          Before you hit record
        </div>
        <ul className="list-inside list-disc space-y-2 text-sm text-muted">
          <li>Relayer / agent key set; SparkGas vault has Arc USDC</li>
          <li>Wallet on Arc Testnet for merchant publish</li>
          <li>Use a unique event name each take (e.g. “Demo Night 0118”)</li>
          <li>Zoom browser to 110–125% so UI reads on phone video</li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <Link href="/events/new">
            <Button>Start at create event</Button>
          </Link>
          <Link href="/agent">
            <Button variant="secondary">Agent desk</Button>
          </Link>
          <Link href="/sponsor">
            <Button variant="ghost">Fund vault</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
