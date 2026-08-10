import {
  createPublicClient,
  createWalletClient,
  fallback,
  http,
  parseEther,
  type Address,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, getChainConfig } from '@/config/chains'
import { firstPaymentAbi } from '@/contracts/paymentAbi'
import { gasSponsorLedgerAbi } from '@/contracts/abi'
import { findEvent, readEventsStore } from '@/lib/jsonbin'
import {
  buildBuyVipIntent,
  buyVipIntentMessage,
  intentStillValid,
  type AgentPurchaseResult,
} from '@/lib/agentIntent'
import type { SparkEvent } from '@/types/events'

export function getAgentPrivateKey(): Hex | '' {
  const raw =
    process.env.AGENT_PRIVATE_KEY ||
    process.env.RELAYER_PRIVATE_KEY ||
    process.env.PRIVATE_KEY ||
    ''
  if (!raw) return ''
  return (raw.startsWith('0x') ? raw : `0x${raw}`) as Hex
}

export function getAgentAddress(): Address | null {
  const key = getAgentPrivateKey()
  if (!key) return null
  return privateKeyToAccount(key).address
}

/**
 * Autonomous agent: sign buy-vip intent → claim if needed → pay VIP on Arc.
 * Used by /api/agent/buy-vip and auto-triggered when an event is created.
 */
export async function runAgentBuyVip(
  eventId: string,
  eventOverride?: SparkEvent,
): Promise<AgentPurchaseResult> {
  const key = getAgentPrivateKey()
  if (!key) {
    throw new Error('Agent key not configured (AGENT_PRIVATE_KEY or RELAYER_PRIVATE_KEY)')
  }

  const cfg = getChainConfig(arcTestnet.id)
  const payment = cfg.paymentAddress as Address | ''
  const ledger = cfg.ledgerAddress as Address | ''
  if (!payment) throw new Error('Payment contract not configured')

  const store = await readEventsStore().catch(() => null)
  const event = eventOverride || (store ? findEvent(store, eventId) : undefined)
  if (!event) throw new Error('Event not found')

  const account = privateKeyToAccount(key)
  const transport = fallback(cfg.rpcUrls.map((u) => http(u)))
  const publicClient = createPublicClient({ chain: cfg.chain, transport })
  const walletClient = createWalletClient({
    account,
    chain: cfg.chain,
    transport,
  })

  const amountWei = parseEther(event.vipPriceUsdc)
  const intent = buildBuyVipIntent({
    eventId: event.id,
    agent: account.address,
    payment,
    amountLabel: event.vipPriceUsdc,
    chainId: arcTestnet.id,
  })

  if (!intentStillValid(intent)) throw new Error('Intent expired')

  const intentMessage = buyVipIntentMessage(intent)
  const signature = await account.signMessage({ message: intentMessage })

  let claimTxHash: Hex | undefined
  if (ledger) {
    const canClaim = await publicClient.readContract({
      address: ledger,
      abi: gasSponsorLedgerAbi,
      functionName: 'canClaim',
      args: [account.address],
    })
    if (canClaim) {
      claimTxHash = await walletClient.writeContract({
        address: ledger,
        abi: gasSponsorLedgerAbi,
        functionName: 'claimFor',
        args: [account.address],
      })
      await publicClient.waitForTransactionReceipt({ hash: claimTxHash })
    }
  }

  const balance = await publicClient.getBalance({ address: account.address })
  if (balance < amountWei) {
    throw new Error(
      `Agent balance too low. Fund agent ${account.address} or the SparkGas vault, then retry.`,
    )
  }

  const txHash = await walletClient.writeContract({
    address: payment,
    abi: firstPaymentAbi,
    functionName: 'pay',
    args: [intent.memo],
    value: amountWei,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  if (receipt.status !== 'success') {
    throw new Error(`VIP payment failed on-chain (${txHash})`)
  }

  const verifyPath = `/verify?event=${encodeURIComponent(event.id)}&tx=${txHash}&holder=${account.address}&intent=${signature}&msg=${encodeURIComponent(intentMessage)}`

  return {
    ok: true,
    intent,
    intentMessage,
    signature,
    txHash,
    claimTxHash,
    agent: account.address,
    eventId: event.id,
    eventName: event.name,
    vipLabel: event.vipLabel,
    amountLabel: `${event.vipPriceUsdc} USDC`,
    verifyPath,
    explorerTx: `${cfg.explorerUrl}/tx/${txHash}`,
  }
}
