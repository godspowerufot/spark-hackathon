import { NextResponse } from 'next/server'
import { isAddress, verifyMessage, type Address, type Hex } from 'viem'
import {
  buildBuyVipIntent,
  buyVipIntentMessage,
  intentStillValid,
  type BuyVipIntent,
} from '@/lib/agentIntent'
import { arcTestnet, getChainConfig } from '@/config/chains'
import { findEvent, readEventsStore } from '@/lib/jsonbin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST — build a buy-vip intent for a wallet-agent to sign
 * body: { eventId, agent }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventId?: string
      agent?: string
      intent?: BuyVipIntent
      signature?: Hex
      mode?: 'build' | 'verify'
    }

    const cfg = getChainConfig(arcTestnet.id)
    const payment = cfg.paymentAddress
    if (!payment) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
    }

    if (body.mode === 'verify' && body.intent && body.signature) {
      if (!intentStillValid(body.intent)) {
        return NextResponse.json({ ok: false, error: 'Intent expired' }, { status: 400 })
      }
      const message = buyVipIntentMessage(body.intent)
      const valid = await verifyMessage({
        address: body.intent.agent,
        message,
        signature: body.signature,
      })
      return NextResponse.json({
        ok: valid,
        verified: valid,
        error: valid ? undefined : 'Invalid agent signature on intent',
        intent: body.intent,
        message,
      })
    }

    const eventId = body.eventId?.trim()
    const agent = body.agent as Address | undefined
    if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    if (!agent || !isAddress(agent)) {
      return NextResponse.json({ error: 'Valid agent address required' }, { status: 400 })
    }

    const store = await readEventsStore()
    const event = findEvent(store, eventId)
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const intent = buildBuyVipIntent({
      eventId: event.id,
      agent,
      payment,
      amountLabel: event.vipPriceUsdc,
      chainId: arcTestnet.id,
    })
    const message = buyVipIntentMessage(intent)

    return NextResponse.json({
      ok: true,
      intent,
      message,
      event: {
        id: event.id,
        name: event.name,
        vipLabel: event.vipLabel,
        vipPriceUsdc: event.vipPriceUsdc,
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Intent failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
