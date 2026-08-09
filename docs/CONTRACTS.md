# Smart Contract — SparkGas (`GasSponsorLedger`)

## Stack

- Hardhat 2 + ethers v6
- Solidity 0.8.24
- TypeChain typings generated on compile

## Networks

| Network | Chain ID | Gas token | Hardhat name |
|---------|----------|-----------|--------------|
| Monad Testnet | `10143` | MON | `monadTestnet` |
| Arc Testnet | `5042002` | USDC (native) | `arcTestnet` |

Same contract on both chains. Native `payable` deposits/claims map to MON on Monad and USDC on Arc.

## Layout

```
contracts/
  contracts/          Solidity sources
  scripts/deploy.ts   Deploy script (writes chain-specific env keys)
  test/               Mocha + Chai tests
  hardhat.config.ts
```

## Commands

```bash
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network monadTestnet
npx hardhat run scripts/deploy.ts --network arcTestnet
```

## Env

Copy `.env.example` → `.env`:

```
PRIVATE_KEY=
MONAD_TESTNET_RPC_URL=
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
MAX_CLAIM_WEI=100000000000000000
```

Fund Arc deployer USDC from https://faucet.circle.com (Arc Testnet).
