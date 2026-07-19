import { defineChain } from 'viem'
import type { Address } from 'viem'

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
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
      url: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://testnet.monadvision.com',
    },
  },
  testnet: true,
})

export const monadMainnet = defineChain({
  id: 143,
  name: 'Monad Mainnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: {
      name: 'MonadVision',
      url: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://monadvision.com',
    },
  },
})

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 10143)

export const activeChain = chainId === 143 ? monadMainnet : monadTestnet

export const env = {
  chainId,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || activeChain.rpcUrls.default.http[0],
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  ledgerAddress: (process.env.NEXT_PUBLIC_LEDGER_ADDRESS || '') as Address | '',
  explorerUrl:
    process.env.NEXT_PUBLIC_EXPLORER_URL || activeChain.blockExplorers.default.url,
  demoMode: !process.env.NEXT_PUBLIC_LEDGER_ADDRESS,
}
