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
import {
  arcTestnet,
  env,
  monadMainnet,
  monadTestnet,
} from '@/config/env'

/**
 * `injectedWallet` auto-detects any browser extension wallet, and
 * `walletConnectWallet` supports every WalletConnect-compatible wallet
 * (300+ mobile/desktop wallets) — so any wallet can connect.
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
    appName: 'SparkGas',
    projectId: env.walletConnectProjectId,
  },
)

/**
 * Browser traffic goes through a same-origin `/api/rpc` proxy so ad blockers /
 * extensions cannot break Alchemy `fetch`. Server-side still talks upstream.
 * Pass `?chainId=` so the proxy picks Monad vs Arc.
 */
function rpcTransport(chainId: number, upstreams: string[]) {
  const browserProxy = `/api/rpc?chainId=${chainId}`
  const primary = typeof window === 'undefined' ? upstreams[0] : browserProxy
  const rest = typeof window === 'undefined' ? upstreams.slice(1) : upstreams
  return fallback([
    http(primary, { retryCount: 3, timeout: 20_000 }),
    ...rest.map((url) => http(url, { retryCount: 1, timeout: 20_000 })),
  ])
}

const monadUpstreams = [
  env.defaultChainId === monadTestnet.id
    ? process.env.NEXT_PUBLIC_RPC_URL_MONAD || process.env.NEXT_PUBLIC_RPC_URL || monadTestnet.rpcUrls.default.http[0]
    : monadTestnet.rpcUrls.default.http[0],
  'https://monad-testnet.drpc.org',
  'https://testnet-rpc.monad.xyz',
].filter(Boolean) as string[]

const arcUpstreams = [
  process.env.NEXT_PUBLIC_RPC_URL_ARC || 'https://rpc.testnet.arc.network',
]

export const wagmiConfig = createConfig({
  connectors,
  chains: [monadTestnet, arcTestnet, monadMainnet],
  transports: {
    [monadTestnet.id]: rpcTransport(monadTestnet.id, [...new Set(monadUpstreams)]),
    [arcTestnet.id]: rpcTransport(arcTestnet.id, [...new Set(arcUpstreams)]),
    [monadMainnet.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL_MONAD_MAINNET || monadMainnet.rpcUrls.default.http[0],
      { retryCount: 2, timeout: 20_000 },
    ),
  },
  ssr: true,
})
