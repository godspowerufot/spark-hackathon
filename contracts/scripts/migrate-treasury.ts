import { ethers } from 'hardhat'

/**
 * One-off migration: withdraw the old ledger's treasury to the owner,
 * then deposit it into the new ledger.
 * Usage: OLD_LEDGER=0x... NEW_LEDGER=0x... npx hardhat run scripts/migrate-treasury.ts --network monadTestnet
 */
async function main() {
  const oldAddress = process.env.OLD_LEDGER
  const newAddress = process.env.NEW_LEDGER || process.env.LEDGER_ADDRESS
  if (!oldAddress || !newAddress) throw new Error('Set OLD_LEDGER and NEW_LEDGER')

  const [owner] = await ethers.getSigners()
  const oldLedger = await ethers.getContractAt('GasSponsorLedger', oldAddress)
  const newLedger = await ethers.getContractAt('GasSponsorLedger', newAddress)

  const balance: bigint = await oldLedger.treasuryBalance()
  console.log('Old treasury:', ethers.formatEther(balance), 'MON')

  if (balance > 0n) {
    const tx1 = await oldLedger.withdrawTreasury(owner.address, balance)
    await tx1.wait()
    console.log('Withdrawn from old ledger:', tx1.hash)

    const tx2 = await newLedger.deposit({ value: balance })
    await tx2.wait()
    console.log('Deposited into new ledger:', tx2.hash)
  }

  console.log('New treasury:', ethers.formatEther(await newLedger.treasuryBalance()), 'MON')
  console.log('New max claim:', ethers.formatEther(await newLedger.maxClaimAmount()), 'MON')
  console.log('Relayer:', await newLedger.relayer())
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
