import { ethers } from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'

function upsertEnvVar(filePath: string, key: string, value: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  let content = ''
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8')
  }

  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, 'm')
  if (pattern.test(content)) {
    content = content.replace(pattern, line)
  } else {
    content = content.trimEnd()
    content = content ? `${content}\n${line}\n` : `${line}\n`
  }

  fs.writeFileSync(filePath, content, 'utf8')
}

type NetworkMeta = {
  gasSymbol: string
  addressKey: string
  deployBlockKey: string
  ledgerKey: string
  legacyAddressKey?: string
  legacyDeployBlockKey?: string
}

const NETWORK_META: Record<string, NetworkMeta> = {
  '10143': {
    gasSymbol: 'MON',
    addressKey: 'NEXT_PUBLIC_LEDGER_ADDRESS_MONAD',
    deployBlockKey: 'NEXT_PUBLIC_LEDGER_DEPLOY_BLOCK_MONAD',
    ledgerKey: 'LEDGER_ADDRESS_MONAD',
    legacyAddressKey: 'NEXT_PUBLIC_LEDGER_ADDRESS',
    legacyDeployBlockKey: 'NEXT_PUBLIC_LEDGER_DEPLOY_BLOCK',
  },
  '5042002': {
    gasSymbol: 'USDC',
    addressKey: 'NEXT_PUBLIC_LEDGER_ADDRESS_ARC',
    deployBlockKey: 'NEXT_PUBLIC_LEDGER_DEPLOY_BLOCK_ARC',
    ledgerKey: 'LEDGER_ADDRESS_ARC',
  },
  '143': {
    gasSymbol: 'MON',
    addressKey: 'NEXT_PUBLIC_LEDGER_ADDRESS_MONAD_MAINNET',
    deployBlockKey: 'NEXT_PUBLIC_LEDGER_DEPLOY_BLOCK_MONAD_MAINNET',
    ledgerKey: 'LEDGER_ADDRESS_MONAD_MAINNET',
  },
}

async function main() {
  const [deployer] = await ethers.getSigners()
  if (!deployer) {
    throw new Error('No deployer account. Set PRIVATE_KEY in contracts/.env')
  }

  const network = await ethers.provider.getNetwork()
  const chainId = network.chainId.toString()
  const meta = NETWORK_META[chainId]
  if (!meta) {
    throw new Error(`Unsupported chainId ${chainId}. Use monadTestnet or arcTestnet.`)
  }

  const maxClaim =
    process.env.MAX_CLAIM_WEI != null
      ? BigInt(process.env.MAX_CLAIM_WEI)
      : ethers.parseEther(chainId === '5042002' ? '0.1' : '0.01')

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Network:', chainId)
  console.log('Deployer:', deployer.address)
  console.log('Deployer balance:', ethers.formatEther(balance), meta.gasSymbol)
  console.log('Max claim (wei):', maxClaim.toString())

  if (balance === 0n) {
    throw new Error(
      `Deployer has 0 ${meta.gasSymbol}. Fund the wallet first` +
        (chainId === '5042002' ? ' via https://faucet.circle.com (Arc Testnet).' : '.'),
    )
  }

  const factory = await ethers.getContractFactory('GasSponsorLedger')
  const ledger = await factory.deploy(deployer.address, maxClaim)
  await ledger.waitForDeployment()

  const address = await ledger.getAddress()
  const owner = await ledger.owner()
  const stats = await ledger.getStats()
  const deployTx = ledger.deploymentTransaction()
  const receipt = deployTx ? await deployTx.wait() : null
  const deployBlock = receipt?.blockNumber ?? 0

  console.log('GasSponsorLedger deployed at:', address)
  console.log('Owner:', owner)
  console.log('Deploy block:', deployBlock)
  console.log('Max claim:', ethers.formatEther(stats[1]), meta.gasSymbol)

  const webEnvPath = path.resolve(__dirname, '../../apps/web/.env.local')
  upsertEnvVar(webEnvPath, meta.addressKey, address)
  upsertEnvVar(webEnvPath, meta.deployBlockKey, String(deployBlock))
  if (meta.legacyAddressKey) upsertEnvVar(webEnvPath, meta.legacyAddressKey, address)
  if (meta.legacyDeployBlockKey) {
    upsertEnvVar(webEnvPath, meta.legacyDeployBlockKey, String(deployBlock))
  }
  console.log('Updated', webEnvPath)

  const contractsEnvPath = path.resolve(__dirname, '../.env')
  upsertEnvVar(contractsEnvPath, meta.ledgerKey, address)
  upsertEnvVar(contractsEnvPath, 'LEDGER_ADDRESS', address)
  console.log('Updated', contractsEnvPath)

  console.log('\nNext steps:')
  console.log('1. Restart the Next.js dev server')
  console.log(`2. Switch wallet to this chain and deposit ${meta.gasSymbol} on /sponsor`)
  console.log('3. Open /claim from a fresh wallet')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
