export const APP_NAME = 'SparkGas'
export const APP_TAGLINE = 'Claim gas → VIP pass on Arc'

export const DEFAULT_MAX_CLAIM_LABEL = '0.1 gas'

export const FAQ = [
  {
    q: 'What is Event Mode?',
    a: 'Merchants list events, sponsors fund the USDC vault on Arc, guests claim gas once, buy VIP with that same USDC, and show a QR-backed pass at the door.',
  },
  {
    q: 'Why Arc?',
    a: 'On Arc, gas is native USDC — so sponsored gas is spendable money. That is how claim → VIP payment works without a separate token dance.',
  },
  {
    q: 'Is the VIP pass an NFT?',
    a: 'It looks and shares like one (avatar + foil card + QR), but proof is your Arc payment transaction — no extra mint required.',
  },
  {
    q: 'Who gets the VIP payment?',
    a: 'Checkout goes through the FirstPayment contract on Arc, which forwards USDC to the merchant wallet. The event memo ties the tx to that listing.',
  },
  {
    q: 'Can I claim twice?',
    a: 'No. Each wallet may claim once per chain.',
  },
] as const
