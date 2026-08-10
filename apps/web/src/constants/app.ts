export const APP_NAME = 'SparkGas'
export const APP_TAGLINE = 'Agents buy VIP tickets in USDC on Arc'

export const DEFAULT_MAX_CLAIM_LABEL = '0.1 gas'

export const FAQ = [
  {
    q: 'What is the agent ticket flow?',
    a: 'A human operator opens the agent desk, picks an event, and dispatches the Arc agent wallet. The agent signs a buy-vip intent, settles USDC via FirstPayment, and you get a QR-verifiable pass showing it bought the ticket.',
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
    a: 'Yes. You are the operator: publish the event as a merchant, then on the agent desk hit Dispatch agent. The agent wallet pays; you watch the live feed and the VIP pass appear.',
  },
] as const
