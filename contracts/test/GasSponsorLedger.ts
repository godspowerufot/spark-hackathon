import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'

const MAX_CLAIM = ethers.parseEther('0.01')

describe('GasSponsorLedger', () => {
  async function deployFixture() {
    const [owner, sponsor, user] = await ethers.getSigners()
    const factory = await ethers.getContractFactory('GasSponsorLedger')
    const ledger = await factory.deploy(owner.address, MAX_CLAIM)
    await ledger.waitForDeployment()
    return { ledger, owner, sponsor, user }
  }

  it('deposit success', async () => {
    const { ledger, sponsor } = await loadFixture(deployFixture)
    await expect(ledger.connect(sponsor).deposit({ value: ethers.parseEther('1') }))
      .to.emit(ledger, 'SponsorDeposited')
      .withArgs(sponsor.address, ethers.parseEther('1'), ethers.parseEther('1'))

    expect(await ledger.treasuryBalance()).to.equal(ethers.parseEther('1'))
    expect(await ledger.totalSponsored()).to.equal(ethers.parseEther('1'))
    expect(await ledger.depositCount()).to.equal(1n)
  })

  it('claim success', async () => {
    const { ledger, sponsor, user } = await loadFixture(deployFixture)
    await ledger.connect(sponsor).deposit({ value: ethers.parseEther('1') })

    await expect(ledger.connect(user).claim())
      .to.emit(ledger, 'GasClaimed')
      .withArgs(user.address, MAX_CLAIM, ethers.parseEther('1') - MAX_CLAIM)

    expect(await ledger.hasClaimed(user.address)).to.equal(true)
    expect(await ledger.usersHelped()).to.equal(1n)
    expect(await ledger.treasuryBalance()).to.equal(ethers.parseEther('1') - MAX_CLAIM)
  })

  it('claim twice reverts', async () => {
    const { ledger, sponsor, user } = await loadFixture(deployFixture)
    await ledger.connect(sponsor).deposit({ value: ethers.parseEther('1') })
    await ledger.connect(user).claim()

    await expect(ledger.connect(user).claim()).to.be.revertedWithCustomError(
      ledger,
      'AlreadyClaimed',
    )
  })

  it('claim with empty treasury reverts', async () => {
    const { ledger, user } = await loadFixture(deployFixture)
    await expect(ledger.connect(user).claim()).to.be.revertedWithCustomError(
      ledger,
      'InsufficientTreasury',
    )
  })

  it('unauthorized withdraw reverts', async () => {
    const { ledger, sponsor, user } = await loadFixture(deployFixture)
    await ledger.connect(sponsor).deposit({ value: ethers.parseEther('1') })

    await expect(
      ledger.connect(user).withdrawTreasury(user.address, ethers.parseEther('0.1')),
    ).to.be.revertedWithCustomError(ledger, 'OwnableUnauthorizedAccount')
  })

  it('paused blocks claim and deposit', async () => {
    const { ledger, owner, sponsor, user } = await loadFixture(deployFixture)
    await ledger.connect(sponsor).deposit({ value: ethers.parseEther('1') })
    await ledger.connect(owner).pause()

    await expect(
      ledger.connect(sponsor).deposit({ value: ethers.parseEther('0.1') }),
    ).to.be.revertedWithCustomError(ledger, 'EnforcedPause')

    await expect(ledger.connect(user).claim()).to.be.revertedWithCustomError(
      ledger,
      'EnforcedPause',
    )
  })

  it('emergency withdraw when paused', async () => {
    const { ledger, owner, sponsor } = await loadFixture(deployFixture)
    await ledger.connect(sponsor).deposit({ value: ethers.parseEther('2') })
    await ledger.connect(owner).pause()

    await expect(ledger.connect(owner).emergencyWithdraw(owner.address))
      .to.emit(ledger, 'EmergencyWithdraw')
      .withArgs(owner.address, ethers.parseEther('2'))

    expect(await ledger.treasuryBalance()).to.equal(0n)
    expect(await ethers.provider.getBalance(await ledger.getAddress())).to.equal(0n)
  })

  it('reentrancy attacker cannot double claim', async () => {
    const { ledger, sponsor } = await loadFixture(deployFixture)
    await ledger.connect(sponsor).deposit({ value: ethers.parseEther('1') })

    const attackerFactory = await ethers.getContractFactory('ReentrancyAttacker')
    const attacker = await attackerFactory.deploy(await ledger.getAddress())
    await attacker.waitForDeployment()
    await attacker.arm()
    await attacker.attackClaim()

    expect(await ledger.hasClaimed(await attacker.getAddress())).to.equal(true)
    expect(await ethers.provider.getBalance(await attacker.getAddress())).to.equal(MAX_CLAIM)
    expect(await ledger.treasuryBalance()).to.equal(ethers.parseEther('1') - MAX_CLAIM)
  })

  it('setMaxClaimAmount', async () => {
    const { ledger, owner } = await loadFixture(deployFixture)
    await ledger.connect(owner).setMaxClaimAmount(ethers.parseEther('0.05'))
    expect(await ledger.maxClaimAmount()).to.equal(ethers.parseEther('0.05'))
  })

  it('receive() deposits', async () => {
    const { ledger, sponsor } = await loadFixture(deployFixture)
    await sponsor.sendTransaction({
      to: await ledger.getAddress(),
      value: ethers.parseEther('0.5'),
    })
    expect(await ledger.treasuryBalance()).to.equal(ethers.parseEther('0.5'))
  })

  it('canClaim helper', async () => {
    const { ledger, sponsor, user } = await loadFixture(deployFixture)
    expect(await ledger.canClaim(user.address)).to.equal(false)
    await ledger.connect(sponsor).deposit({ value: ethers.parseEther('1') })
    expect(await ledger.canClaim(user.address)).to.equal(true)
  })
})
