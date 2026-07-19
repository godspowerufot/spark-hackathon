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

async function main() {
  const [deployer] = await ethers.getSigners()
  if (!deployer) {
    throw new Error('No deployer account. Set PRIVATE_KEY in contracts/.env')
  }

  const maxClaim =
    process.env.MAX_CLAIM_WEI != null
      ? BigInt(process.env.MAX_CLAIM_WEI)
      : ethers.parseEther('0.01')

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Network:', (await ethers.provider.getNetwork()).chainId.toString())
  console.log('Deployer:', deployer.address)
  console.log('Deployer balance:', ethers.formatEther(balance), 'MON')
  console.log('Max claim (wei):', maxClaim.toString())

  if (balance === 0n) {
    throw new Error('Deployer has 0 MON. Fund the wallet on Monad testnet first.')
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
  console.log('Max claim:', ethers.formatEther(stats[1]), 'MON')

  const webEnvPath = path.resolve(__dirname, '../../apps/web/.env.local')
  upsertEnvVar(webEnvPath, 'NEXT_PUBLIC_LEDGER_ADDRESS', address)
  upsertEnvVar(webEnvPath, 'NEXT_PUBLIC_LEDGER_DEPLOY_BLOCK', String(deployBlock))
  console.log('Updated', webEnvPath, 'with NEXT_PUBLIC_LEDGER_ADDRESS + DEPLOY_BLOCK')

  const contractsEnvPath = path.resolve(__dirname, '../.env')
  upsertEnvVar(contractsEnvPath, 'LEDGER_ADDRESS', address)
  console.log('Updated', contractsEnvPath, 'with LEDGER_ADDRESS')

  console.log('\nNext steps:')
  console.log('1. Restart the Next.js dev server')
  console.log('2. Open /sponsor and deposit MON')
  console.log('3. Open /claim from another wallet (or same after funding)')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
