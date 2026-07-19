export const APP_NAME = 'Gas Sponsor Ledger'
export const APP_TAGLINE = 'Sponsored MON gas for seamless Monad onboarding'

export const DEFAULT_MAX_CLAIM_LABEL = '0.01 MON'

export const FAQ = [
  {
    q: 'What is Gas Sponsor Ledger?',
    a: 'A transparent on-chain vault where sponsors deposit MON so new users can claim gas for their first Monad transactions.',
  },
  {
    q: 'Who can claim?',
    a: 'Any wallet that has not claimed before, while the treasury holds at least the max claim amount and the contract is not paused.',
  },
  {
    q: 'Is this custodial?',
    a: 'No. Funds live in the GasSponsorLedger contract. Claims and deposits emit on-chain events for full auditability.',
  },
  {
    q: 'Can I claim twice?',
    a: 'No. Each wallet may claim once. Double-claim attempts revert with AlreadyClaimed.',
  },
] as const
