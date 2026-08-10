import { parseEther, type Address, type Hex } from 'viem'
import { vipMemo } from '@/types/events'

export type BuyVipIntent = {
  version: 1
  action: 'buy-vip'
  eventId: string
  agent: Address
  payment: Address
  amountWei: string
  amountLabel: string
  memo: string
  chainId: number
  nonce: string
  deadline: number
}

export function buildBuyVipIntent(params: {
  eventId: string
  agent: Address
  payment: Address
  amountLabel: string
  chainId: number
  nonce?: string
  deadlineSec?: number
}): BuyVipIntent {
  const amountWei = parseEther(params.amountLabel).toString()
  return {
    version: 1,
    action: 'buy-vip',
    eventId: params.eventId,
    agent: params.agent,
    payment: params.payment,
    amountWei,
    amountLabel: params.amountLabel,
    memo: vipMemo(params.eventId),
    chainId: params.chainId,
    nonce: params.nonce || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    deadline: Math.floor(Date.now() / 1000) + (params.deadlineSec ?? 600),
  }
}

/** Canonical message the agent wallet signs */
export function buyVipIntentMessage(intent: BuyVipIntent) {
  return [
    'SparkGas agent intent',
    `action: ${intent.action}`,
    `event: ${intent.eventId}`,
    `agent: ${intent.agent.toLowerCase()}`,
    `payment: ${intent.payment.toLowerCase()}`,
    `amount: ${intent.amountLabel} USDC (${intent.amountWei} wei)`,
    `memo: ${intent.memo}`,
    `chainId: ${intent.chainId}`,
    `nonce: ${intent.nonce}`,
    `deadline: ${intent.deadline}`,
  ].join('\n')
}

export function intentStillValid(intent: BuyVipIntent) {
  return Math.floor(Date.now() / 1000) <= intent.deadline
}

export type AgentPurchaseResult = {
  ok: true
  intent: BuyVipIntent
  intentMessage: string
  signature: Hex
  txHash: Hex
  claimTxHash?: Hex
  agent: Address
  eventId: string
  eventName: string
  vipLabel: string
  amountLabel: string
  verifyPath: string
  explorerTx: string
}
