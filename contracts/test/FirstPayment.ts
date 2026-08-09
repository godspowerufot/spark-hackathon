import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('FirstPayment', () => {
  it('forwards native payment to merchant and records stats', async () => {
    const [owner, merchant, payer] = await ethers.getSigners()
    const factory = await ethers.getContractFactory('FirstPayment')
    const payment = await factory.deploy(merchant!.address)
    await payment.waitForDeployment()

    const amount = ethers.parseEther('0.05')
    const before = await ethers.provider.getBalance(merchant!.address)

    await expect(payment.connect(payer!).pay('hackathon coffee', { value: amount }))
      .to.emit(payment, 'PaymentReceived')
      .withArgs(payer!.address, merchant!.address, amount, 'hackathon coffee', 1n)

    const after = await ethers.provider.getBalance(merchant!.address)
    expect(after - before).to.equal(amount)

    const stats = await payment.getStats()
    expect(stats[0]).to.equal(merchant!.address)
    expect(stats[1]).to.equal(amount)
    expect(stats[2]).to.equal(1n)
    expect(await payment.paidBy(payer!.address)).to.equal(amount)
  })

  it('reverts on zero amount', async () => {
    const [, merchant, payer] = await ethers.getSigners()
    const factory = await ethers.getContractFactory('FirstPayment')
    const payment = await factory.deploy(merchant!.address)
    await expect(payment.connect(payer!).pay('x', { value: 0 })).to.be.reverted
  })
})
