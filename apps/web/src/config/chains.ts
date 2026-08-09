import { defineChain } from 'viem'
import { arcTestnet as viemArcTestnet } from 'viem/chains'
import type { Address } from 'viem'

/** Monad Testnet — gas token MON */
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL_MONAD ||
          process.env.NEXT_PUBLIC_RPC_URL ||
          (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
            ? `https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
            : 'https://testnet-rpc.monad.xyz'),
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'MonadVision',
      url: process.env.NEXT_PUBLIC_EXPLORER_URL_MONAD || 'https://testnet.monadvision.com',
    },
  },
  testnet: true,
})

/** Monad Mainnet */
export const monadMainnet = defineChain({
  id: 143,
  name: 'Monad Mainnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL_MONAD_MAINNET || 'https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: {
      name: 'MonadVision',
      url: process.env.NEXT_PUBLIC_EXPLORER_URL_MONAD_MAINNET || 'https://monadvision.com',
    },
  },
})

/**
 * Arc Testnet — native gas IS USDC (18-decimal native view).
 * Prefer viem's built-in definition; fall back if the installed viem is older.
 */
export const arcTestnet =
  viemArcTestnet ??
  defineChain({
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc.testnet.arc.network'] },
    },
    blockExplorers: {
      default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
    },
    testnet: true,
  })

/** Arc USDC ERC-20 view (6 decimals). Same pool as native gas — do not double-count. */
export const ARC_USDC_ERC20 = '0x3600000000000000000000000000000000000000' as Address

export type SparkChainId = typeof monadTestnet.id | typeof arcTestnet.id | typeof monadMainnet.id

export type ChainConfig = {
  id: number
  key: 'monad' | 'arc' | 'monadMainnet'
  label: string
  gasSymbol: string
  chain: typeof monadTestnet | typeof arcTestnet | typeof monadMainnet
  rpcUrls: string[]
  explorerUrl: string
  ledgerAddress: Address | ''
  paymentAddress: Address | ''
  deployBlock: bigint
  /** Suggested max claim display for empty treasury */
  defaultClaimLabel: string
  historyScanSources: Array<{ url: string; chunk: bigint }>
}

function addr(value: string | undefined): Address | '' {
  return (value || '') as Address | ''
}

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [monadTestnet.id]: {
    id: monadTestnet.id,
    key: 'monad',
    label: 'Monad Testnet',
    gasSymbol: 'MON',
    chain: monadTestnet,
    rpcUrls: [
      ...new Set(
        [
          process.env.NEXT_PUBLIC_RPC_URL_MONAD,
          process.env.NEXT_PUBLIC_RPC_URL,
          process.env.NEXT_PUBLIC_ALCHEMY_API_KEY &&
          process.env.NEXT_PUBLIC_ALCHEMY_API_KEY !== 'YOUR_ALCHEMY_API_KEY'
            ? `https://monad-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
            : null,
          'https://monad-testnet.drpc.org',
          'https://testnet-rpc.monad.xyz',
        ].filter((u): u is string => Boolean(u)),
      ),
    ],
    explorerUrl:
      process.env.NEXT_PUBLIC_EXPLORER_URL_MONAD ||
      process.env.NEXT_PUBLIC_EXPLORER_URL ||
      monadTestnet.blockExplorers.default.url,
    ledgerAddress: addr(
      process.env.NEXT_PUBLIC_LEDGER_ADDRESS_MONAD || process.env.NEXT_PUBLIC_LEDGER_ADDRESS,
    ),
    paymentAddress: addr(process.env.NEXT_PUBLIC_PAYMENT_ADDRESS_MONAD),
    deployBlock: BigInt(
      process.env.NEXT_PUBLIC_LEDGER_DEPLOY_BLOCK_MONAD ||
        process.env.NEXT_PUBLIC_LEDGER_DEPLOY_BLOCK ||
        '0',
    ),
    defaultClaimLabel: '0.1 MON',
    historyScanSources: [
      { url: 'https://monad-testnet.drpc.org', chunk: 1000n },
      { url: 'https://testnet-rpc.monad.xyz', chunk: 100n },
    ],
  },
  [arcTestnet.id]: {
    id: arcTestnet.id,
    key: 'arc',
    label: 'Arc Testnet',
    gasSymbol: 'USDC',
    chain: arcTestnet,
    rpcUrls: [
      ...new Set(
        [
          process.env.NEXT_PUBLIC_RPC_URL_ARC,
          'https://rpc.testnet.arc.network',
        ].filter((u): u is string => Boolean(u)),
      ),
    ],
    explorerUrl:
      process.env.NEXT_PUBLIC_EXPLORER_URL_ARC || arcTestnet.blockExplorers?.default.url || 'https://testnet.arcscan.app',
    ledgerAddress: addr(process.env.NEXT_PUBLIC_LEDGER_ADDRESS_ARC),
    paymentAddress: addr(process.env.NEXT_PUBLIC_PAYMENT_ADDRESS_ARC),
    deployBlock: BigInt(process.env.NEXT_PUBLIC_LEDGER_DEPLOY_BLOCK_ARC || '0'),
    defaultClaimLabel: '0.1 USDC',
    historyScanSources: [{ url: 'https://rpc.testnet.arc.network', chunk: 2000n }],
  },
  [monadMainnet.id]: {
    id: monadMainnet.id,
    key: 'monadMainnet',
    label: 'Monad Mainnet',
    gasSymbol: 'MON',
    chain: monadMainnet,
    rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL_MONAD_MAINNET || 'https://rpc.monad.xyz'],
    explorerUrl:
      process.env.NEXT_PUBLIC_EXPLORER_URL_MONAD_MAINNET || monadMainnet.blockExplorers.default.url,
    ledgerAddress: addr(process.env.NEXT_PUBLIC_LEDGER_ADDRESS_MONAD_MAINNET),
    paymentAddress: '' as Address | '',
    deployBlock: BigInt(process.env.NEXT_PUBLIC_LEDGER_DEPLOY_BLOCK_MONAD_MAINNET || '0'),
    defaultClaimLabel: '0.1 MON',
    historyScanSources: [{ url: 'https://rpc.monad.xyz', chunk: 1000n }],
  },
}

export const SUPPORTED_APP_CHAINS = [monadTestnet, arcTestnet] as const

export function getChainConfig(chainId?: number): ChainConfig {
  if (chainId != null && CHAIN_CONFIGS[chainId]) return CHAIN_CONFIGS[chainId]
  // Prefer Arc when explicitly set as default, else Monad testnet.
  const preferred = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || monadTestnet.id)
  return CHAIN_CONFIGS[preferred] ?? CHAIN_CONFIGS[monadTestnet.id]
}

export function isSupportedAppChain(chainId?: number): boolean {
  return chainId === monadTestnet.id || chainId === arcTestnet.id
}
