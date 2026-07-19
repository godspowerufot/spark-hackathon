import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function upstreams(): string[] {
  const list = [
    process.env.NEXT_PUBLIC_RPC_URL,
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY &&
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY !== 'YOUR_ALCHEMY_API_KEY'
      ? `https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : null,
    'https://monad-testnet.drpc.org',
    'https://testnet-rpc.monad.xyz',
  ].filter((u): u is string => Boolean(u))

  return [...new Set(list)]
}

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

  let lastError = 'RPC proxy failed'
  for (const url of upstreams()) {
    try {
      const result = await proxy(body, url)
      if (result.ok) {
        return new NextResponse(result.text, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      lastError = result.text.slice(0, 200)
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'RPC proxy failed'
    }
  }

  return NextResponse.json(
    { jsonrpc: '2.0', id: null, error: { code: -32000, message: lastError } },
    { status: 502 },
  )
}
