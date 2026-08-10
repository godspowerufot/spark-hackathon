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
    vo: 'A merchant publishes an event. Listing only — the human will start the agent next.',
    beat: 'Fill name / price → Sign & publish. Say: “I’m not buying — I’m listing.”',
    dur: '20–25s',
  },
  {
    n: '03',
    title: 'Operator dispatches agent',
    path: '/agent',
    vo: 'From the agent desk, the operator hits Dispatch. The agent signs buy-vip and settles USDC.',
    beat: 'Select event → Dispatch agent → live feed “Bought VIP”.',
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
    vo: 'Every VIP the agent bought lives here — operator started it, on-chain proof remains.',
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
          ~90 seconds. One story: merchant lists → operator dispatches agent → door verifies. Stay
          on Arc Testnet. Fund the vault before you record.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="gold">Arc USDC</Badge>
          <Badge tone="ok">Operator dispatch</Badge>
          <Badge tone="neutral">No LLM required</Badge>
        </div>
      </div>

      <Card className="space-y-3">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
          One-line pitch (say on shot 01)
        </div>
        <p className="font-display text-xl text-ink">
          SparkGas: a human operator starts an Arc wallet agent that buys VIP tickets in USDC —
          signed intent, on-chain verify.
        </p>
      </Card>

      <ol className="space-y-6">
        {SHOTS.map((shot, i) => (
          <motion.li
            key={shot.n}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[0.66rem] tracking-[0.25em] text-gold">
                    {shot.n} · {shot.dur}
                  </div>
                  <h2 className="mt-1 font-display text-xl font-semibold">{shot.title}</h2>
                </div>
                <Link href={shot.path}>
                  <Button size="sm" variant="secondary">
                    Open
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted">
                <span className="text-gold">VO:</span> {shot.vo}
              </p>
              <p className="text-sm text-muted-2">{shot.beat}</p>
            </Card>
          </motion.li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Link href="/agent">
          <Button>Go to agent desk</Button>
        </Link>
        <Link href="/events/new">
          <Button variant="secondary">List an event</Button>
        </Link>
      </div>
    </div>
  )
}
