import { NextResponse } from 'next/server'
import { isAddress, verifyMessage, type Address, type Hex } from 'viem'
import { readEventsStore, writeEventsStore } from '@/lib/jsonbin'
import { buildSeedStore } from '@/lib/eventsSeed'
import { buildCreatedEvent } from '@/lib/createEvent'
import { createEventSignMessage, type SparkEvent } from '@/types/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const store = await readEventsStore()
    const events = (store.events || []).filter((e) => e.active)
    return NextResponse.json({ events, updatedAt: store.updatedAt })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load events'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

type CreateBody = {
  action: 'create'
  draft: {
    name: string
    tagline?: string
    description?: string
    date: string
    venue: string
    vipPriceUsdc: string
    vipLabel?: string
    coverGradient?: string
  }
  merchantAddress: string
  signature: Hex
}

/** POST { action: 'seed' | 'upsert' | 'create', ... } */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'seed' | 'upsert' | 'create'
      event?: SparkEvent
      draft?: CreateBody['draft']
      merchantAddress?: string
      signature?: Hex
    }

    if (body.action === 'seed') {
      const payment =
        process.env.NEXT_PUBLIC_PAYMENT_ADDRESS_ARC ||
        '0x3EBFE71f47e9863A273315C0DeE6464099BcD448'
      const ledger =
        process.env.NEXT_PUBLIC_LEDGER_ADDRESS_ARC ||
        '0xaCe8B112D9bf82E0510d999D456576b73F9F12C8'
      const store = await writeEventsStore(
        buildSeedStore({ paymentAddress: payment, ledgerAddress: ledger }),
      )
      return NextResponse.json({ ok: true, seeded: store.events.length, events: store.events })
    }

    if (body.action === 'create') {
      const merchant = body.merchantAddress as Address | undefined
      const draft = body.draft
      const signature = body.signature

      if (!merchant || !isAddress(merchant)) {
        return NextResponse.json({ error: 'Invalid merchant address' }, { status: 400 })
      }
      if (!draft?.name || !draft.date || !draft.venue || !draft.vipPriceUsdc) {
        return NextResponse.json({ error: 'Missing required event fields' }, { status: 400 })
      }
      if (!signature) {
        return NextResponse.json({ error: 'Signature required' }, { status: 400 })
      }

      const store = await readEventsStore().catch(() => ({
        version: 1,
        updatedAt: new Date().toISOString(),
        events: [] as SparkEvent[],
        passes: [] as never[],
      }))

      const payment =
        process.env.NEXT_PUBLIC_PAYMENT_ADDRESS_ARC ||
        '0x3EBFE71f47e9863A273315C0DeE6464099BcD448'
      const ledger =
        process.env.NEXT_PUBLIC_LEDGER_ADDRESS_ARC ||
        '0xaCe8B112D9bf82E0510d999D456576b73F9F12C8'

      let event: SparkEvent
      try {
        event = buildCreatedEvent({
          name: draft.name,
          tagline: draft.tagline || '',
          description: draft.description,
          date: draft.date,
          venue: draft.venue,
          vipPriceUsdc: draft.vipPriceUsdc,
          vipLabel: draft.vipLabel || 'VIP Pass',
          coverGradient: draft.coverGradient,
          merchantAddress: merchant,
          existingIds: store.events.map((e) => e.id),
          paymentAddress: payment,
          ledgerAddress: ledger,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid event'
        return NextResponse.json({ error: message }, { status: 400 })
      }

      const message = createEventSignMessage({
        merchantAddress: merchant,
        name: draft.name,
        date: draft.date,
        vipPriceUsdc: draft.vipPriceUsdc,
      })

      const valid = await verifyMessage({
        address: merchant,
        message,
        signature,
      })
      if (!valid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }

      store.events.unshift(event)
      const saved = await writeEventsStore(store)

      return NextResponse.json({
        ok: true,
        event,
        updatedAt: saved.updatedAt,
      })
    }

    if (body.action === 'upsert' && body.event) {
      const store = await readEventsStore().catch(() => ({
        version: 1,
        updatedAt: new Date().toISOString(),
        events: [] as SparkEvent[],
        passes: [] as never[],
      }))
      const idx = store.events.findIndex((e) => e.id === body.event!.id)
      if (idx >= 0) store.events[idx] = body.event
      else store.events.push(body.event)
      const saved = await writeEventsStore(store)

      return NextResponse.json({
        ok: true,
        event: body.event,
        updatedAt: saved.updatedAt,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to write events'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
