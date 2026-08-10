export const APP_NAME = 'SparkGas'
export const APP_TAGLINE = 'Agents buy VIP tickets in USDC on Arc'

export const DEFAULT_MAX_CLAIM_LABEL = '0.1 gas'

export const FAQ = [
  {
    q: 'What is the agent ticket flow?',
    a: 'When a merchant publishes an event, the Arc agent wallet automatically signs a buy-vip intent, settles USDC via FirstPayment, and stores a QR-verifiable pass — no operator dispatch.',
  },
  {
    q: 'Why Arc?',
    a: 'On Arc, gas is native USDC. Sponsored claims and ticket payments use the same asset, so an agent can go from zero balance to a verified VIP ticket.',
  },
  {
    q: 'What is a signed intent?',
    a: 'A canonical message the agent wallet signs before paying: event id, amount, payment contract, memo, chain, nonce, and deadline. Verify checks that signature against the holder.',
  },
  {
    q: 'Is the pass an NFT?',
    a: 'It looks like a foil pass with QR, but proof is the Arc payment tx plus the agent intent — no mint required.',
  },
  {
    q: 'Do I click buy for the agent?',
    a: 'No. Creating/publishing an event triggers auto-buy. The agent desk is for viewing passes and retrying if a buy failed (e.g. empty vault).',
  },
] as const
