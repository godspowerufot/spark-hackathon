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
import { getChainConfig, isSupportedAppChain } from '@/config/chains'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RELAYER_KEY = (process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY || '') as Hex | ''

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
    if (!RELAYER_KEY) {
      return NextResponse.json(
        { error: 'Relayer key not configured on server' },
        { status: 503 },
      )
    }

    const body = (await request.json()) as {
      recipient?: string
      signature?: string
      chainId?: number
    }

    const chainId = Number(body.chainId)
    if (!isSupportedAppChain(chainId)) {
      return NextResponse.json({ error: 'Unsupported chainId' }, { status: 400 })
    }

    const cfg = getChainConfig(chainId)
    const ledger = cfg.ledgerAddress
    if (!ledger) {
      return NextResponse.json({ error: `Ledger not configured for ${cfg.label}` }, { status: 503 })
    }

    const recipient = body.recipient as Address | undefined
    const signature = body.signature as Hex | undefined

    if (!recipient || !isAddress(recipient)) {
      return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 })
    }
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const message = claimMessage(recipient, ledger, chainId)
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
      chain: cfg.chain,
      transport: fallback(cfg.rpcUrls.map((url) => http(url))),
    })

    const eligible = await publicClient.readContract({
      address: ledger,
      abi: gasSponsorLedgerAbi,
      functionName: 'canClaim',
      args: [recipient],
    })
    if (!eligible) {
      const claimed = await publicClient.readContract({
        address: ledger,
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
      chain: cfg.chain,
      transport: fallback(cfg.rpcUrls.map((url) => http(url))),
    })

    const hash = await walletClient.writeContract({
      address: ledger,
      abi: gasSponsorLedgerAbi,
      functionName: 'claimFor',
      args: [recipient],
      account,
      chain: cfg.chain,
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
      chainId,
      amountWei: (
        await publicClient.readContract({
          address: ledger,
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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const chainId = Number(url.searchParams.get('chainId') || 0)
  const cfg = isSupportedAppChain(chainId) ? getChainConfig(chainId) : null
  return NextResponse.json({
    enabled: Boolean(cfg?.ledgerAddress && RELAYER_KEY),
    ledger: cfg?.ledgerAddress || null,
    chainId: cfg?.id ?? null,
    claimMessageTemplate:
      cfg?.ledgerAddress
        ? claimMessage('0xRecipient' as Address, cfg.ledgerAddress, cfg.id)
        : null,
  })
}
