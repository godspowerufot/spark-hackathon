import type { EventsStore } from '@/types/events'

/** Seed payload for Arc Event Mode demo */
export function buildSeedStore(params: {
  paymentAddress: string
  ledgerAddress: string
  merchantAddress?: string
}): EventsStore {
  const { paymentAddress, ledgerAddress } = params
  const merchantAddress =
    params.merchantAddress ||
    process.env.NEXT_PUBLIC_MERCHANT_ADDRESS_ARC ||
    '0x6164D9aD8A1d2E3DCEBD1f1b50160aA3D7a6775A'
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    passes: [],
    events: [
      {
        id: 'arc-summit-vip',
        name: 'Arc Summit VIP',
        tagline: 'Zero balance → VIP access on Arc',
        description:
          'The flagship SparkGas demo event. Sponsors fund the USDC gas vault so attendees can claim once, then purchase a VIP pass with the same USDC — gas is money on Arc.',
        date: '2026-08-15',
        venue: 'Arc Testnet · On-chain',
        coverGradient:
          'linear-gradient(135deg, #1a1408 0%, #3d2e12 40%, #0a0a0a 100%)',
        chainId: 5042002,
        vipPriceUsdc: '0.05',
        vipLabel: 'VIP Pass',
        paymentAddress,
        ledgerAddress,
        merchantAddress,
        active: true,
        sponsors: [
          {
            name: 'Circle',
            tier: 'platinum',
            url: 'https://www.circle.com',
            blurb: 'USDC + Arc',
          },
          {
            name: 'SparkGas',
            tier: 'gold',
            blurb: 'Gas sponsorship protocol',
          },
          {
            name: 'Hackathon DAO',
            tier: 'silver',
            blurb: 'Community onboarding',
          },
          {
            name: 'Arc Café',
            tier: 'community',
            blurb: 'Hospitality partner',
          },
        ],
      },
      {
        id: 'builders-night',
        name: 'Builders Night',
        tagline: 'Claim gas. Walk in VIP.',
        description:
          'Evening meetup for Arc builders. Sponsors cover first-tx friction; VIP gets priority seating and a shareable on-chain pass.',
        date: '2026-08-22',
        venue: 'Lagos · Hybrid / Arc Testnet',
        coverGradient:
          'linear-gradient(160deg, #0c1210 0%, #1a3328 45%, #050505 100%)',
        chainId: 5042002,
        vipPriceUsdc: '0.05',
        vipLabel: 'VIP Night Pass',
        paymentAddress,
        ledgerAddress,
        merchantAddress,
        active: true,
        sponsors: [
          {
            name: 'SparkGas',
            tier: 'gold',
            blurb: 'Sponsored onboarding',
          },
          {
            name: 'Local Builders',
            tier: 'community',
            blurb: 'Meetup hosts',
          },
        ],
      },
      {
        id: 'usdc-lounge',
        name: 'USDC Lounge',
        tagline: 'Pay the cover with gas itself.',
        description:
          'A lounge night where entry is an on-chain VIP micropayment. Claim sponsored USDC, then buy the lounge pass — same token, same chain.',
        date: '2026-08-29',
        venue: 'Accra · Arc Testnet',
        coverGradient:
          'linear-gradient(140deg, #0a1628 0%, #1e3a5f 50%, #050505 100%)',
        chainId: 5042002,
        vipPriceUsdc: '0.03',
        vipLabel: 'Lounge Pass',
        paymentAddress,
        ledgerAddress,
        merchantAddress,
        active: true,
        sponsors: [
          {
            name: 'Circle',
            tier: 'platinum',
            blurb: 'Native USDC gas',
          },
          {
            name: 'SparkGas',
            tier: 'gold',
            blurb: 'Claim → pay flow',
          },
        ],
      },
      {
        id: 'hack-demo-day',
        name: 'Hack Demo Day',
        tagline: 'Judges scan your QR at the door.',
        description:
          'Demo day for hackathon teams. VIP judges and mentors get an on-chain pass; door staff verify purchases by scanning the QR on each card.',
        date: '2026-09-05',
        venue: 'Nairobi · Hybrid / Arc',
        coverGradient:
          'linear-gradient(150deg, #1a0a14 0%, #4a2040 45%, #0a0a0a 100%)',
        chainId: 5042002,
        vipPriceUsdc: '0.04',
        vipLabel: 'Judge Pass',
        paymentAddress,
        ledgerAddress,
        merchantAddress,
        active: true,
        sponsors: [
          {
            name: 'Hackathon DAO',
            tier: 'gold',
            blurb: 'Demo track',
          },
          {
            name: 'SparkGas',
            tier: 'silver',
            blurb: 'QR verify stack',
          },
        ],
      },
      {
        id: 'stablecoin-brunch',
        name: 'Stablecoin Brunch',
        tagline: 'Breakfast, builders, and a 0.02 USDC VIP.',
        description:
          'Weekend brunch for founders shipping on Arc. Sponsors cover gas claims; VIP unlocks a reserved table and a foil pass you can share.',
        date: '2026-09-12',
        venue: 'Cape Town · Arc Testnet',
        coverGradient:
          'linear-gradient(125deg, #1a1208 0%, #5c4030 40%, #0d0d0d 100%)',
        chainId: 5042002,
        vipPriceUsdc: '0.02',
        vipLabel: 'Brunch VIP',
        paymentAddress,
        ledgerAddress,
        merchantAddress,
        active: true,
        sponsors: [
          {
            name: 'Arc Café',
            tier: 'gold',
            blurb: 'Hospitality',
          },
          {
            name: 'SparkGas',
            tier: 'community',
            blurb: 'Gasless first bite',
          },
        ],
      },
    ],
  }
}
