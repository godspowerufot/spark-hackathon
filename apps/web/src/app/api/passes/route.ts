import { NextResponse } from 'next/server'
import {
  createPublicClient,
  decodeEventLog,
  fallback,
  http,
  isAddress,
  parseAbiItem,
  type Address,
  type Hex,
} from 'viem'
import { arcTestnet, getChainConfig } from '@/config/chains'
import { firstPaymentAbi } from '@/contracts/paymentAbi'
import { parseVipMemo } from '@/types/events'
import { readEventsStore, findEvent } from '@/lib/jsonbin'
import { formatEther } from 'viem'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const paymentEvent = parseAbiItem(
  'event PaymentReceived(address indexed payer, address indexed merchant, uint256 amount, string memo, uint256 indexed paymentId)',
)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const address = url.searchParams.get('address') as Address | null
    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const cfg = getChainConfig(arcTestnet.id)
    const payment = cfg.paymentAddress
    if (!payment) {
      return NextResponse.json({ error: 'Payment contract not configured' }, { status: 503 })
    }

    const client = createPublicClient({
      chain: cfg.chain,
      transport: fallback(cfg.rpcUrls.map((u) => http(u))),
    })

    const latest = await client.getBlockNumber()
    // Arc is young — scan a wide recent window; chunk if needed
    const fromBlock = latest > 50_000n ? latest - 50_000n : 0n

    const logs = await client.getLogs({
      address: payment,
      event: paymentEvent,
      args: { payer: address },
      fromBlock,
      toBlock: latest,
    })

    const store = await readEventsStore().catch(() => null)

    const passes = logs
      .map((log) => {
        try {
          const decoded = decodeEventLog({
            abi: firstPaymentAbi,
            data: log.data,
            topics: log.topics,
          })
          if (decoded.eventName !== 'PaymentReceived') return null
          const args = decoded.args as {
            payer: Address
            amount: bigint
            memo: string
            paymentId: bigint
          }
          const eventId = parseVipMemo(args.memo)
          if (!eventId) return null
          const event = store ? findEvent(store, eventId) : undefined
          return {
            eventId,
            eventName: event?.name || eventId,
            vipLabel: event?.vipLabel || 'VIP Pass',
            amountLabel: `${formatEther(args.amount)} USDC`,
            txHash: log.transactionHash as Hex,
            holder: args.payer,
            paymentId: args.paymentId.toString(),
            blockNumber: log.blockNumber.toString(),
            at: Number(log.blockNumber),
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .reverse()

    return NextResponse.json({
      passes,
      payment,
      scannedFrom: fromBlock.toString(),
      scannedTo: latest.toString(),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load passes'
    return NextResponse.json({ error: message, passes: [] }, { status: 500 })
  }
}
