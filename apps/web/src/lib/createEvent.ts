import { isAddress, type Address } from 'viem'
import {
  EVENT_COVERS,
  slugifyEventId,
  uniqueEventId,
  type SparkEvent,
} from '@/types/events'
import { arcTestnet } from '@/config/chains'

export type CreateEventInput = {
  name: string
  tagline: string
  description?: string
  date: string
  venue: string
  vipPriceUsdc: string
  vipLabel: string
  coverGradient?: string
  merchantAddress: string
  existingIds: string[]
  paymentAddress: string
  ledgerAddress: string
}

export function buildCreatedEvent(input: CreateEventInput): SparkEvent {
  if (!input.name.trim()) throw new Error('Name is required')
  if (!input.date.trim()) throw new Error('Date is required')
  if (!input.venue.trim()) throw new Error('Venue is required')
  if (!isAddress(input.merchantAddress)) throw new Error('Invalid merchant address')

  const price = Number(input.vipPriceUsdc)
  if (!Number.isFinite(price) || price <= 0 || price > 100) {
    throw new Error('VIP price must be between 0 and 100 USDC')
  }

  const cover =
    input.coverGradient && EVENT_COVERS.some((c) => c.value === input.coverGradient)
      ? input.coverGradient
      : EVENT_COVERS[0].value

  const id = uniqueEventId(slugifyEventId(input.name), input.existingIds)
  const tagline = input.tagline.trim() || 'Claim gas. Buy VIP on Arc.'
  const vipLabel = input.vipLabel.trim() || 'VIP Pass'

  return {
    id,
    name: input.name.trim(),
    tagline,
    description:
      input.description?.trim() ||
      `${input.name.trim()} on Arc — claim sponsored USDC, buy ${vipLabel}, verify with QR.`,
    date: input.date,
    venue: input.venue.trim(),
    coverGradient: cover,
    chainId: arcTestnet.id,
    vipPriceUsdc: String(input.vipPriceUsdc).trim(),
    vipLabel,
    paymentAddress: input.paymentAddress,
    ledgerAddress: input.ledgerAddress,
    merchantAddress: input.merchantAddress as Address,
    createdAt: new Date().toISOString(),
    active: true,
    sponsors: [
      {
        name: 'Merchant',
        tier: 'gold',
        blurb: 'Listed this event',
      },
      {
        name: 'SparkGas',
        tier: 'community',
        blurb: 'Gas sponsorship + VIP verify',
      },
    ],
  }
}
