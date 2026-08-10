import { NextResponse } from 'next/server'
import { getAgentAddress, getAgentPrivateKey, runAgentBuyVip } from '@/lib/agentBuyVip'
import { arcTestnet, getChainConfig } from '@/config/chains'
import { privateKeyToAccount } from 'viem/accounts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET — public agent identity (no secrets) */
export async function GET() {
  const key = getAgentPrivateKey()
  if (!key) {
    return NextResponse.json({
      configured: false,
      error: 'AGENT_PRIVATE_KEY or RELAYER_PRIVATE_KEY not set',
    })
  }
  const account = privateKeyToAccount(key)
  const cfg = getChainConfig(arcTestnet.id)
  return NextResponse.json({
    configured: true,
    agent: account.address,
    autoBuyOnCreate: false,
    chainId: arcTestnet.id,
    chainLabel: cfg.label,
    payment: cfg.paymentAddress || null,
    ledger: cfg.ledgerAddress || null,
  })
}

/**
 * POST { eventId }
 * Operator starts the agent: sign buy-vip intent → claim if needed → pay on Arc.
 */
export async function POST(request: Request) {
  try {
    if (!getAgentAddress()) {
      return NextResponse.json(
        { error: 'Agent key not configured (AGENT_PRIVATE_KEY or RELAYER_PRIVATE_KEY)' },
        { status: 503 },
      )
    }

    const body = (await request.json()) as { eventId?: string }
    const eventId = body.eventId?.trim()
    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    }

    const result = await runAgentBuyVip(eventId)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Agent buy failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
