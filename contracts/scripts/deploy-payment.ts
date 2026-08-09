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
  if (!deployer) throw new Error('Set PRIVATE_KEY in contracts/.env')

  const network = await ethers.provider.getNetwork()
  const chainId = network.chainId.toString()
  const merchant = process.env.MERCHANT_ADDRESS || deployer.address

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Network:', chainId)
  console.log('Deployer:', deployer.address)
  console.log('Merchant:', merchant)
  console.log('Balance:', ethers.formatEther(balance))

  if (balance === 0n) throw new Error('Deployer has 0 balance — fund wallet first')

  const factory = await ethers.getContractFactory('FirstPayment')
  const payment = await factory.deploy(merchant)
  await payment.waitForDeployment()

  const address = await payment.getAddress()
  const stats = await payment.getStats()
  const deployTx = payment.deploymentTransaction()
  const receipt = deployTx ? await deployTx.wait() : null

  console.log('FirstPayment deployed at:', address)
  console.log('Merchant (on-chain):', stats[0])
  console.log('Deploy block:', receipt?.blockNumber ?? 0)

  const webEnvPath = path.resolve(__dirname, '../../apps/web/.env.local')
  const contractsEnvPath = path.resolve(__dirname, '../.env')

  if (chainId === '5042002') {
    upsertEnvVar(webEnvPath, 'NEXT_PUBLIC_PAYMENT_ADDRESS_ARC', address)
    upsertEnvVar(webEnvPath, 'NEXT_PUBLIC_MERCHANT_ADDRESS_ARC', merchant)
    upsertEnvVar(contractsEnvPath, 'PAYMENT_ADDRESS_ARC', address)
  } else if (chainId === '10143') {
    upsertEnvVar(webEnvPath, 'NEXT_PUBLIC_PAYMENT_ADDRESS_MONAD', address)
    upsertEnvVar(webEnvPath, 'NEXT_PUBLIC_MERCHANT_ADDRESS_MONAD', merchant)
    upsertEnvVar(contractsEnvPath, 'PAYMENT_ADDRESS_MONAD', address)
  }

  console.log('Updated env files')
  console.log('\nTest: call pay("demo") with value 0.05 native')
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
