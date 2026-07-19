import { NextResponse } from 'next/server'
import { decodeEventLog, type Address, type Hex } from 'viem'
import { gasSponsorLedgerAbi } from '@/contracts/abi'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LEDGER_ADDRESS = (process.env.NEXT_PUBLIC_LEDGER_ADDRESS || '') as Address | ''
const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_LEDGER_DEPLOY_BLOCK || '0')

/**
 * Free-tier getLogs limits: Alchemy = 10 blocks, Monad public = 100, dRPC = 1000.
 * dRPC (keyless) gives the widest window, so history scans go through it,
 * falling back to the public RPC with smaller chunks.
 */
const SCAN_SOURCES = [
  { url: 'https://monad-testnet.drpc.org', chunk: 1000n },
  { url: 'https://testnet-rpc.monad.xyz', chunk: 100n },
]
const CONCURRENCY = 5
/** If deploy block is unknown, only scan this far back. */
const DEFAULT_LOOKBACK = 100_000n

interface RawLog {
  address: string
  topics: [Hex, ...Hex[]]
  data: Hex
  blockNumber: Hex
  transactionHash: Hex
  logIndex: Hex
}

export interface HistoryEvent {
  kind: 'deposit' | 'claim'
  actor: string
  amount: string
  treasuryBalance: string
  txHash: string
  blockNumber: string
  logIndex: number
}

interface CacheEntry {
  cursor: bigint
  events: HistoryEvent[]
}

/** Module-level cache: survives across requests in the same server process. */
const cache = new Map<string, CacheEntry>()

async function rpcCall(url: string, method: string, params: unknown[]) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    cache: 'no-store',
  })
  const json = (await res.json()) as { result?: unknown; error?: { message: string } }
  if (json.error) throw new Error(json.error.message)
  return json.result
}

function decodeLogs(logs: RawLog[]): HistoryEvent[] {
  const events: HistoryEvent[] = []
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: gasSponsorLedgerAbi,
        topics: log.topics,
        data: log.data,
      })
      if (decoded.eventName === 'SponsorDeposited') {
        const args = decoded.args as {
          sponsor: Address
          amount: bigint
          treasuryBalance: bigint
        }
        events.push({
          kind: 'deposit',
          actor: args.sponsor,
          amount: args.amount.toString(),
          treasuryBalance: args.treasuryBalance.toString(),
          txHash: log.transactionHash,
          blockNumber: BigInt(log.blockNumber).toString(),
          logIndex: Number(BigInt(log.logIndex)),
        })
      } else if (decoded.eventName === 'GasClaimed') {
        const args = decoded.args as {
          claimer: Address
          amount: bigint
          treasuryBalance: bigint
        }
        events.push({
          kind: 'claim',
          actor: args.claimer,
          amount: args.amount.toString(),
          treasuryBalance: args.treasuryBalance.toString(),
          txHash: log.transactionHash,
          blockNumber: BigInt(log.blockNumber).toString(),
          logIndex: Number(BigInt(log.logIndex)),
        })
      }
    } catch {
      // Non-ledger events (e.g. OwnershipTransferred) or undecodable logs — skip.
    }
  }
  return events
}

async function scanRange(
  source: { url: string; chunk: bigint },
  address: string,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<HistoryEvent[]> {
  const ranges: Array<[bigint, bigint]> = []
  let from = fromBlock
  while (from <= toBlock) {
    const to = from + source.chunk - 1n > toBlock ? toBlock : from + source.chunk - 1n
    ranges.push([from, to])
    from = to + 1n
  }

  const events: HistoryEvent[] = []
  for (let i = 0; i < ranges.length; i += CONCURRENCY) {
    const batch = ranges.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map(([f, t]) =>
        rpcCall(source.url, 'eth_getLogs', [
          {
            address,
            fromBlock: `0x${f.toString(16)}`,
            toBlock: `0x${t.toString(16)}`,
          },
        ]) as Promise<RawLog[]>,
      ),
    )
    for (const logs of results) events.push(...decodeLogs(logs))
  }
  return events
}

export async function GET() {
  if (!LEDGER_ADDRESS) {
    return NextResponse.json({ deposits: [], claims: [], demo: true })
  }

  let lastError: string | null = null

  for (const source of SCAN_SOURCES) {
    try {
      const latestHex = (await rpcCall(source.url, 'eth_blockNumber', [])) as Hex
      const latest = BigInt(latestHex)

      const entry = cache.get(LEDGER_ADDRESS) ?? {
        cursor:
          DEPLOY_BLOCK > 0n
            ? DEPLOY_BLOCK
            : latest > DEFAULT_LOOKBACK
              ? latest - DEFAULT_LOOKBACK
              : 0n,
        events: [],
      }

      if (entry.cursor <= latest) {
        const fresh = await scanRange(source, LEDGER_ADDRESS, entry.cursor, latest)
        const seen = new Set(entry.events.map((e) => `${e.txHash}-${e.logIndex}`))
        for (const event of fresh) {
          const key = `${event.txHash}-${event.logIndex}`
          if (!seen.has(key)) {
            entry.events.push(event)
            seen.add(key)
          }
        }
        entry.cursor = latest + 1n
        cache.set(LEDGER_ADDRESS, entry)
      }

      const sorted = [...entry.events].sort(
        (a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)) || b.logIndex - a.logIndex,
      )

      return NextResponse.json({
        deposits: sorted.filter((e) => e.kind === 'deposit'),
        claims: sorted.filter((e) => e.kind === 'claim'),
        scannedTo: (entry.cursor - 1n).toString(),
      })
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'scan failed'
    }
  }

  // All sources failed — return whatever is cached rather than nothing.
  const entry = cache.get(LEDGER_ADDRESS)
  const sorted = [...(entry?.events ?? [])].sort(
    (a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)) || b.logIndex - a.logIndex,
  )
  return NextResponse.json(
    {
      deposits: sorted.filter((e) => e.kind === 'deposit'),
      claims: sorted.filter((e) => e.kind === 'claim'),
      error: lastError,
    },
    { status: entry ? 200 : 502 },
  )
}
