import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import * as dotenv from 'dotenv'

dotenv.config({ path: '../apps/web/.env.local' })
dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY || ''
const MONAD_TESTNET_RPC =
  process.env.MONAD_TESTNET_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  'https://testnet-rpc.monad.xyz'
const MONAD_MAINNET_RPC =
  process.env.MONAD_MAINNET_RPC_URL || 'https://rpc.monad.xyz'

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache-hardhat',
    artifacts: './artifacts',
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    monadTestnet: {
      url: MONAD_TESTNET_RPC,
      chainId: 10143,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    monadMainnet: {
      url: MONAD_MAINNET_RPC,
      chainId: 143,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  mocha: {
    timeout: 120_000,
  },
}

export default config
