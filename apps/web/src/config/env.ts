/**
 * @deprecated Prefer `@/config/chains` — kept for backward-compatible imports.
 */
export {
  monadTestnet,
  monadMainnet,
  arcTestnet,
  ARC_USDC_ERC20,
  CHAIN_CONFIGS,
  SUPPORTED_APP_CHAINS,
  getChainConfig,
  isSupportedAppChain,
  type ChainConfig,
  type SparkChainId,
} from './chains'

import type { Address } from 'viem'
import { getChainConfig, monadTestnet } from './chains'

/** Default chain for SSR / first paint (wallet may switch). */
export const activeChain = getChainConfig().chain

export const env = {
  /** @deprecated Prefer wallet chainId + getChainConfig */
  chainId: getChainConfig().id,
  rpcUrl: getChainConfig().rpcUrls[0],
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  /** @deprecated Prefer getChainConfig(chainId).ledgerAddress */
  ledgerAddress: getChainConfig().ledgerAddress as Address | '',
  explorerUrl: getChainConfig().explorerUrl,
  /** True when neither Monad nor Arc ledger is configured */
  demoMode: !process.env.NEXT_PUBLIC_LEDGER_ADDRESS_MONAD &&
    !process.env.NEXT_PUBLIC_LEDGER_ADDRESS &&
    !process.env.NEXT_PUBLIC_LEDGER_ADDRESS_ARC,
  defaultChainId: Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || monadTestnet.id),
}
