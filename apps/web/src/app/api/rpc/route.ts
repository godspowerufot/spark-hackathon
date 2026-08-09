import { NextResponse } from 'next/server'
import { CHAIN_CONFIGS, getChainConfig, monadTestnet } from '@/config/chains'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function upstreams(chainId: number): string[] {
  const cfg = CHAIN_CONFIGS[chainId] ?? getChainConfig(monadTestnet.id)
  return cfg.rpcUrls
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
  const url = new URL(request.url)
  const chainId = Number(url.searchParams.get('chainId') || process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || monadTestnet.id)

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
  for (const rpc of upstreams(chainId)) {
    try {
      const result = await proxy(body, rpc)
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
