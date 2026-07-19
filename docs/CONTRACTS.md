# Smart Contract — SparkGas (`GasSponsorLedger`)

## Stack

- Hardhat 2 + ethers v6
- Solidity 0.8.24
- TypeChain typings generated on compile

## Layout

```
contracts/
  contracts/          Solidity sources
  scripts/deploy.ts   Deploy script
  test/               Mocha + Chai tests
  hardhat.config.ts
```

## Commands

```bash
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network monadTestnet
```

## Env

Copy `.env.example` → `.env`:

```
PRIVATE_KEY=
MONAD_TESTNET_RPC_URL=
MAX_CLAIM_WEI=10000000000000000
```
