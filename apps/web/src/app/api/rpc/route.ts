import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UPSTREAM =
  process.env.NEXT_PUBLIC_RPC_URL ||
  (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY &&
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY !== 'YOUR_ALCHEMY_API_KEY'
    ? `https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    : 'https://testnet-rpc.monad.xyz')

const FALLBACK = 'https://testnet-rpc.monad.xyz'

async function proxy(body: string, upstream: string) {
  const res = await fetch(upstream, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

export async function POST(request: Request) {
  let body: string
  try {
    body = await request.text()
    JSON.parse(body)
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400 },
    )
  }

  try {
    let result = await proxy(body, UPSTREAM)
    if (!result.ok && UPSTREAM !== FALLBACK) {
      result = await proxy(body, FALLBACK)
    }

    return new NextResponse(result.text, {
      status: result.ok ? 200 : result.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'RPC proxy failed'
    // Last-chance fallback if Alchemy fetch itself throws (DNS, TLS, etc.)
    if (UPSTREAM !== FALLBACK) {
      try {
        const fallback = await proxy(body, FALLBACK)
        return new NextResponse(fallback.text, {
          status: fallback.ok ? 200 : fallback.status,
          headers: { 'Content-Type': 'application/json' },
        })
      } catch {
        // fall through
      }
    }
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32000, message } },
      { status: 502 },
    )
  }
}
