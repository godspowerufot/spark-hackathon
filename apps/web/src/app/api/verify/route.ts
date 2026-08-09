import { NextResponse } from 'next/server'
import {
  createPublicClient,
  decodeEventLog,
  fallback,
  http,
  isAddress,
  type Address,
  type Hex,
} from 'viem'
import { formatEther } from 'viem'
import { arcTestnet, getChainConfig } from '@/config/chains'
import { firstPaymentAbi } from '@/contracts/paymentAbi'
import { parseVipMemo } from '@/types/events'
import { findEvent, readEventsStore } from '@/lib/jsonbin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/verify?tx=0x&holder=0x&event=arc-summit-vip */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tx = url.searchParams.get('tx') as Hex | null
    const holder = url.searchParams.get('holder') as Address | null
    const eventId = url.searchParams.get('event')

    if (!tx || !tx.startsWith('0x')) {
      return NextResponse.json({ ok: false, error: 'Missing tx' }, { status: 400 })
    }
    if (!holder || !isAddress(holder)) {
      return NextResponse.json({ ok: false, error: 'Invalid holder' }, { status: 400 })
    }

    const cfg = getChainConfig(arcTestnet.id)
    const payment = cfg.paymentAddress
    if (!payment) {
      return NextResponse.json({ ok: false, error: 'Payment not configured' }, { status: 503 })
    }

    const client = createPublicClient({
      chain: cfg.chain,
      transport: fallback(cfg.rpcUrls.map((u) => http(u))),
    })

    const receipt = await client.getTransactionReceipt({ hash: tx })
    if (receipt.status !== 'success') {
      return NextResponse.json({
        ok: false,
        verified: false,
        error: 'Transaction failed or not found',
        explorerUrl: `${cfg.explorerUrl}/tx/${tx}`,
      })
    }

    let matched: {
      amount: string
      memo: string
      paymentId: string
      eventId: string | null
    } | null = null

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== payment.toLowerCase()) continue
      try {
        const decoded = decodeEventLog({
          abi: firstPaymentAbi,
          data: log.data,
          topics: log.topics,
        })
        if (decoded.eventName !== 'PaymentReceived') continue
        const args = decoded.args as {
          payer: Address
          amount: bigint
          memo: string
          paymentId: bigint
        }
        if (args.payer.toLowerCase() !== holder.toLowerCase()) continue
        const parsedEvent = parseVipMemo(args.memo)
        if (eventId && parsedEvent && parsedEvent !== eventId) continue
        matched = {
          amount: formatEther(args.amount),
          memo: args.memo,
          paymentId: args.paymentId.toString(),
          eventId: parsedEvent,
        }
        break
      } catch {
        // skip
      }
    }

    if (!matched) {
      return NextResponse.json({
        ok: false,
        verified: false,
        error: 'No matching VIP payment found in this transaction',
        explorerUrl: `${cfg.explorerUrl}/tx/${tx}`,
      })
    }

    const store = await readEventsStore().catch(() => null)
    const eid = matched.eventId || eventId || ''
    const event = eid && store ? findEvent(store, eid) : undefined

    return NextResponse.json({
      ok: true,
      verified: true,
      explorerUrl: `${cfg.explorerUrl}/tx/${tx}`,
      pass: {
        eventId: eid,
        eventName: event?.name || eid,
        vipLabel: event?.vipLabel || 'VIP Pass',
        amountLabel: `${matched.amount} USDC`,
        txHash: tx,
        holder,
        paymentId: matched.paymentId,
        memo: matched.memo,
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Verify failed'
    return NextResponse.json({ ok: false, verified: false, error: message }, { status: 500 })
  }
}
