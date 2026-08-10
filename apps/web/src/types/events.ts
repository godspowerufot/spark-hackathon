export type EventSponsor = {
  name: string
  tier: 'platinum' | 'gold' | 'silver' | 'community'
  logoUrl?: string
  url?: string
  blurb?: string
}

export type SparkEvent = {
  id: string
  name: string
  tagline: string
  description: string
  date: string
  venue: string
  coverGradient: string
  chainId: number
  vipPriceUsdc: string
  vipLabel: string
  paymentAddress: string
  ledgerAddress: string
  /** Wallet that listed the event; VIP payouts still go via FirstPayment → contract merchant */
  merchantAddress?: string
  createdAt?: string
  sponsors: EventSponsor[]
  active: boolean
}

export const EVENT_COVERS = [
  {
    id: 'gold',
    label: 'Gold night',
    value: 'linear-gradient(135deg, #1a1408 0%, #3d2e12 40%, #0a0a0a 100%)',
  },
  {
    id: 'forest',
    label: 'Builders',
    value: 'linear-gradient(160deg, #0c1210 0%, #1a3328 45%, #050505 100%)',
  },
  {
    id: 'ink',
    label: 'Lounge',
    value: 'linear-gradient(140deg, #0a1628 0%, #1e3a5f 50%, #050505 100%)',
  },
  {
    id: 'rose',
    label: 'Demo day',
    value: 'linear-gradient(150deg, #1a0a14 0%, #4a2040 45%, #0a0a0a 100%)',
  },
  {
    id: 'brunch',
    label: 'Brunch',
    value: 'linear-gradient(125deg, #1a1208 0%, #5c4030 40%, #0d0d0d 100%)',
  },
] as const

export function slugifyEventId(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || 'event'
}

export function uniqueEventId(base: string, existingIds: string[]) {
  const set = new Set(existingIds.map((id) => id.toLowerCase()))
  if (!set.has(base.toLowerCase())) return base
  let i = 2
  while (set.has(`${base}-${i}`.toLowerCase())) i += 1
  return `${base}-${i}`
}

/** Wallet signs this to prove ownership when creating an event */
export function createEventSignMessage(params: {
  merchantAddress: string
  name: string
  date: string
  vipPriceUsdc: string
}) {
  return [
    'SparkGas create event',
    `merchant: ${params.merchantAddress.toLowerCase()}`,
    `name: ${params.name.trim()}`,
    `date: ${params.date}`,
    `price: ${String(params.vipPriceUsdc).trim()} USDC`,
  ].join('\n')
}

export type AgentPassRecord = {
  eventId: string
  eventName: string
  vipLabel: string
  amountLabel: string
  txHash: string
  holder: string
  paymentId?: string
  at: number
  agent?: boolean
  intentSignature?: string
  intentMessage?: string
  verifyPath?: string
  claimTxHash?: string
}

export type EventsStore = {
  version: number
  updatedAt: string
  events: SparkEvent[]
  /** Agent (and other) VIP purchases persisted for gallery / demo */
  passes?: AgentPassRecord[]
}

export function vipMemo(eventId: string) {
  return `VIP:${eventId}`
}

export function parseVipMemo(memo: string): string | null {
  if (!memo.startsWith('VIP:')) return null
  return memo.slice(4) || null
}

/** DiceBear anime-adjacent portrait for VIP cards */
export function avatarUrl(seed: string, style: 'lorelei' | 'adventurer' | 'avataaars' = 'lorelei') {
  const s = encodeURIComponent(seed || 'spark')
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${s}&backgroundType=gradientLinear`
}
