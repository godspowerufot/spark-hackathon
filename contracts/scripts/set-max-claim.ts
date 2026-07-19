import { ethers } from 'hardhat'

/**
 * Owner-only maintenance: update maxClaimAmount on the deployed ledger.
 * Usage: NEW_MAX_MON=0.1 npx hardhat run scripts/set-max-claim.ts --network monadTestnet
 */
async function main() {
  const address = process.env.LEDGER_ADDRESS
  if (!address) throw new Error('Set LEDGER_ADDRESS in contracts/.env')

  const newMax = ethers.parseEther(process.env.NEW_MAX_MON || '0.1')

  const [owner] = await ethers.getSigners()
  const ledger = await ethers.getContractAt('GasSponsorLedger', address)

  console.log('Ledger:', address)
  console.log('Signer:', owner.address)
  console.log('Current max claim:', ethers.formatEther(await ledger.maxClaimAmount()), 'MON')

  const tx = await ledger.setMaxClaimAmount(newMax)
  console.log('Tx:', tx.hash)
  await tx.wait()

  console.log('New max claim:', ethers.formatEther(await ledger.maxClaimAmount()), 'MON')
  const stats = await ledger.getStats()
  console.log('Treasury:', ethers.formatEther(stats[0]), 'MON')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
