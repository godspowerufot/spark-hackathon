# spark-hackathon — Gas Sponsor Ledger

Decentralized MON gas sponsorship on Monad. Sponsors deposit. Users claim once. Fully on-chain.

## Live deployment (Monad Testnet)

| | |
|---|---|
| Contract | `GasSponsorLedger` |
| Address | [`0xaCe8B112D9bf82E0510d999D456576b73F9F12C8`](https://testnet.monadexplorer.com/address/0xaCe8B112D9bf82E0510d999D456576b73F9F12C8) |
| Chain ID | `10143` |
| Max claim | `0.01 MON` |

Set the same address in `apps/web/.env.local` as `NEXT_PUBLIC_LEDGER_ADDRESS`.

## Architecture

```
apps/web          Next.js 15 (UI + wagmi + RainbowKit)
contracts/        Hardhat + GasSponsorLedger.sol
docs/             Guides
```

**No backend.** Reads/writes go directly to Monad via RPC (browser traffic uses a same-origin `/api/rpc` proxy).

### Design system

Luxury Monad terminal: `#050505`, gold `#D4AF37`, Space Grotesk / Sora / Orbitron, glass panels.

## Quick start

```bash
# Contracts (Hardhat)
cd contracts
npm install
cp .env.example .env   # add PRIVATE_KEY for deploy
npx hardhat test

# Web
cd ../apps/web
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

Without `NEXT_PUBLIC_LEDGER_ADDRESS`, the app runs in **demo mode**.

## Hardhat commands

```bash
cd contracts
npx hardhat compile
npx hardhat test
npx hardhat node                                          # local chain
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/deploy.ts --network monadTestnet  # needs PRIVATE_KEY
```

## Networks

| Network | Chain ID | Config key |
|---------|----------|------------|
| Hardhat local | 31337 | `hardhat` / `localhost` |
| Monad Testnet | 10143 | `monadTestnet` |
| Monad Mainnet | 143 | `monadMainnet` |

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/dashboard` | Treasury metrics + event history |
| `/sponsor` | Deposit MON |
| `/claim` | Eligibility + claim |
| `/admin` | Pause controls |
| `/wallet` | Network + balance |

## Security

- Checks-Effects-Interactions
- `call{value:}` (never `transfer`)
- One claim per address
- Pause + emergency withdraw
- Hardhat tests: deposit, claim, double-claim, pause, reentrancy, emergency withdraw

## Secrets

Never commit `.env` / `.env.local`. Use `.env.example` files only.
