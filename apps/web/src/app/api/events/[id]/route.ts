import { NextResponse } from 'next/server'
import { findEvent, jsonbinConfigured, readEventsStore } from '@/lib/jsonbin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!jsonbinConfigured()) {
      return NextResponse.json({ error: 'JSONBin not configured' }, { status: 503 })
    }
    const { id } = await context.params
    const store = await readEventsStore()
    const event = findEvent(store, id)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    return NextResponse.json({ event })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load event'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
