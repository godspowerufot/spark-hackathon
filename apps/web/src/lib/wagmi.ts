'use client'

import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  injectedWallet,
  trustWallet,
  okxWallet,
  phantomWallet,
  rabbyWallet,
  ledgerWallet,
  braveWallet,
  zerionWallet,
  uniswapWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig, fallback, http } from 'wagmi'
import { activeChain, env, monadMainnet, monadTestnet } from '@/config/env'

/**
 * `injectedWallet` auto-detects any browser extension wallet, and
 * `walletConnectWallet` supports every WalletConnect-compatible wallet
 * (300+ mobile/desktop wallets) — so any wallet can connect.
 * The named entries below just give popular ones first-class buttons.
 * Coinbase Base Account is intentionally excluded (pulls optional @x402/* deps).
 */
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [metaMaskWallet, rainbowWallet, trustWallet, phantomWallet, okxWallet],
    },
    {
      groupName: 'More',
      wallets: [rabbyWallet, zerionWallet, uniswapWallet, ledgerWallet, braveWallet],
    },
    {
      groupName: 'Any wallet',
      wallets: [injectedWallet, walletConnectWallet],
    },
  ],
  {
    appName: 'Gas Sponsor Ledger',
    projectId: env.walletConnectProjectId,
  },
)

/**
 * Browser traffic goes through a same-origin `/api/rpc` proxy so ad blockers /
 * extensions cannot break Alchemy `fetch`. Server-side still talks upstream.
 */
function rpcTransport(upstream: string) {
  const browserProxy = '/api/rpc'
  const url = typeof window === 'undefined' ? upstream : browserProxy
  return fallback([
    http(url, { retryCount: 3, timeout: 20_000 }),
    http(upstream, { retryCount: 1, timeout: 20_000 }),
    http('https://testnet-rpc.monad.xyz', { retryCount: 1, timeout: 20_000 }),
  ])
}

export const wagmiConfig = createConfig({
  connectors,
  chains: [activeChain, activeChain.id === monadTestnet.id ? monadMainnet : monadTestnet],
  transports: {
    [monadTestnet.id]: rpcTransport(
      env.chainId === monadTestnet.id ? env.rpcUrl : monadTestnet.rpcUrls.default.http[0],
    ),
    [monadMainnet.id]: http(
      env.chainId === monadMainnet.id ? env.rpcUrl : monadMainnet.rpcUrls.default.http[0],
      { retryCount: 2, timeout: 20_000 },
    ),
  },
  ssr: true,
})
