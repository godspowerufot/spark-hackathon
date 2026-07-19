import { NextResponse } from 'next/server'
import {
  createWalletClient,
  createPublicClient,
  http,
  fallback,
  verifyMessage,
  isAddress,
  type Address,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { gasSponsorLedgerAbi } from '@/contracts/abi'
import { monadTestnet } from '@/config/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LEDGER = (process.env.NEXT_PUBLIC_LEDGER_ADDRESS || '') as Address | ''
const RELAYER_KEY = (process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY || '') as Hex | ''

function rpcUrls(): string[] {
  return [
    ...new Set(
      [
        process.env.NEXT_PUBLIC_RPC_URL,
        'https://monad-testnet.drpc.org',
        'https://testnet-rpc.monad.xyz',
      ].filter((u): u is string => Boolean(u)),
    ),
  ]
}

function claimMessage(recipient: Address, contract: Address, chainId: number) {
  return [
    'SparkGas — gasless claim',
    `Recipient: ${recipient}`,
    `Contract: ${contract}`,
    `Chain ID: ${chainId}`,
  ].join('\n')
}

export async function POST(request: Request) {
  try {
    if (!LEDGER) {
      return NextResponse.json({ error: 'Ledger not configured' }, { status: 503 })
    }
    if (!RELAYER_KEY) {
      return NextResponse.json(
        { error: 'Relayer key not configured on server' },
        { status: 503 },
      )
    }

    const body = (await request.json()) as {
      recipient?: string
      signature?: string
    }

    const recipient = body.recipient as Address | undefined
    const signature = body.signature as Hex | undefined

    if (!recipient || !isAddress(recipient)) {
      return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 })
    }
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const message = claimMessage(recipient, LEDGER, monadTestnet.id)
    const valid = await verifyMessage({
      address: recipient,
      message,
      signature,
    })
    if (!valid) {
      return NextResponse.json(
        { error: 'Signature does not match connected wallet' },
        { status: 401 },
      )
    }

    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: fallback(rpcUrls().map((url) => http(url))),
    })

    const eligible = await publicClient.readContract({
      address: LEDGER,
      abi: gasSponsorLedgerAbi,
      functionName: 'canClaim',
      args: [recipient],
    })
    if (!eligible) {
      const claimed = await publicClient.readContract({
        address: LEDGER,
        abi: gasSponsorLedgerAbi,
        functionName: 'hasClaimed',
        args: [recipient],
      })
      return NextResponse.json(
        {
          error: claimed
            ? 'This wallet has already claimed'
            : 'Not eligible — treasury may be empty or contract paused',
        },
        { status: 400 },
      )
    }

    const account = privateKeyToAccount(
      RELAYER_KEY.startsWith('0x') ? RELAYER_KEY : (`0x${RELAYER_KEY}` as Hex),
    )
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: fallback(rpcUrls().map((url) => http(url))),
    })

    const hash = await walletClient.writeContract({
      address: LEDGER,
      abi: gasSponsorLedgerAbi,
      functionName: 'claimFor',
      args: [recipient],
      account,
      chain: monadTestnet,
    })

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
      timeout: 60_000,
    })

    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Relay transaction failed', hash }, { status: 500 })
    }

    return NextResponse.json({
      hash,
      recipient,
      amountWei: (
        await publicClient.readContract({
          address: LEDGER,
          abi: gasSponsorLedgerAbi,
          functionName: 'maxClaimAmount',
        })
      ).toString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Relay failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    enabled: Boolean(LEDGER && RELAYER_KEY),
    ledger: LEDGER || null,
    claimMessageTemplate: LEDGER
      ? claimMessage('0xRecipient' as Address, LEDGER, monadTestnet.id)
      : null,
  })
}
