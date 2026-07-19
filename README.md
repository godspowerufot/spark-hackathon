# SparkGas

> **Sponsored MON for a user's first transaction on Monad—distributed once per wallet and recorded on-chain.**

SparkGas is a transparent gas-sponsorship protocol built on Monad. Individuals, wallets, dApps, communities, and DAOs deposit MON into a shared smart-contract treasury. A new user can then claim a controlled amount of MON to make their first transaction.

## The story

Monad launched and I was excited to bring my friends on-chain. I could send them USDC, but that did not solve the real onboarding problem: they still had no MON to pay gas.

They held an asset, but could not move it, swap it, or try a Monad application. I could manually send MON to each person, but that approach does not scale, is difficult to audit, and can be abused through repeated requests.

That personal problem became **SparkGas**.

## Problem

Every new Monad user faces a circular dependency:

1. They need MON to make a transaction.
2. They need to make a transaction to start using Monad.
3. Buying or bridging MON before experiencing any application creates friction and abandonment.

This affects more than individual users. Every wallet, dApp, DAO, and community that wants to onboard people must either fund accounts manually or leave users blocked at their first transaction.

## Solution

SparkGas turns manual gas funding into a simple, auditable protocol:

1. **Sponsors deposit MON** into the on-chain treasury.
2. **A user connects a wallet** — even with zero MON.
3. **The user signs a free message** (signing costs no gas).
4. **A relayer pays the claim fee** and the contract sends MON to the user.
5. **The user transacts** anywhere in the Monad ecosystem.
6. **Every deposit and claim is emitted as an event**, giving sponsors a public record of where funds went.

The contract enforces one claim per wallet, verifies treasury availability, prevents reentrancy, and supports an emergency pause. Gasless claiming via `claimFor` is what makes the product work for real students: they never need starter MON before claiming.

### Paymaster-like relayer

A normal `claim()` transaction still requires the new user to own MON, which recreates the onboarding problem. SparkGas solves this with a server-side relayer that behaves like a lightweight paymaster:

1. The zero-MON user signs a claim message off-chain. Message signing is free.
2. The relayer verifies that the signature belongs to the recipient.
3. The relayer checks `canClaim(recipient)` before spending gas.
4. The relayer submits `claimFor(recipient)` and pays the Monad network fee.
5. The contract transfers `0.1 MON` from the sponsor treasury to the recipient.
6. The recipient is marked as claimed and cannot claim again.

The relayer wallet pays only the transaction fee; sponsored MON remains in the audited smart-contract treasury until a successful claim. The signed message binds the request to the recipient, contract address, and Monad chain ID.

> This MVP uses a paymaster-like application relayer, not the ERC-4337 Paymaster standard. It delivers the same product outcome for this flow—a zero-balance wallet can receive MON without first paying gas—while keeping the hackathon implementation small and auditable.

## Why this matters for Monad

Gas is a small technical requirement with a large product impact. Removing it from the first-use experience helps the Monad ecosystem grow:

- New users can try an application before buying MON.
- Projects can sponsor first-time transactions instead of losing users during onboarding.
- Communities can distribute gas through transparent, controlled campaigns.
- On-chain events make sponsorship campaigns measurable and auditable.
- Shared infrastructure means every project does not need to build its own faucet.

SparkGas converts **“Get MON first”** into **“Try Monad now.”**

## Who benefits?

### Wallets

A wallet can detect that a user has no MON and offer a **Claim Sponsored Gas** action directly in onboarding.

### dApps

A DeFi, gaming, social, or consumer application can sponsor a user's first transaction so the user reaches the product before encountering a funding requirement.

### DAOs

A DAO can fund governance participation for members without manually transferring MON to every address.

### NFT and creator projects

Projects can sponsor minting or claiming gas for their community instead of asking every new member to bridge MON first.

### Communities and hackathons

Organizers can create a visible treasury, fund participants, and measure how many wallets were helped.

## Live contract

- **Network:** Monad Testnet
- **Chain ID:** `10143`
- **Contract:** [`0x2Bb64B2EfAFE10691BAcaa7E7915075705E9E4f2`](https://testnet.monadexplorer.com/address/0x2Bb64B2EfAFE10691BAcaa7E7915075705E9E4f2)
- **Maximum claim:** `0.1 MON`
- **Gasless claims:** enabled via `claimFor` + server relayer

## Judge demo flow

1. Open the dashboard to see the live treasury and on-chain activity.
2. Connect a sponsor wallet and open **Sponsor**.
3. Deposit MON and approve the `deposit()` transaction.
4. Confirm that the treasury and deposit history update from the emitted `SponsorDeposited` event.
5. Connect a **new wallet with zero MON** and open **Claim**.
6. Click **Claim gas (free — sign only)** and sign the free message.
7. The relayer submits `claimFor(you)`, pays the gas, and MON arrives in the wallet.
8. Try claiming again from the same address—the contract rejects the second claim.

## Core features

- Sponsor deposits using native MON
- **Gasless claims** for zero-MON wallets (sign → relayer pays)
- One successful claim per wallet
- Configurable maximum claim amount (`0.1 MON` on testnet)
- Live treasury and protocol statistics
- Complete deposit and claim event history
- Explorer links for contract activity and transactions
- Owner-only pause, unpause, withdrawal, and emergency controls
- RainbowKit wallet connection with WalletConnect and injected-wallet support
- Demo mode when no deployed contract address is configured

## How it works

```text
Sponsor ── deposit() + MON ──▶ SparkGas treasury (`GasSponsorLedger`)
                                      │
Zero-MON user                         │
      │                               │
      │ signs message (free)          │
      ▼                               │
Paymaster-like relayer                │
      │ verifies signature            │
      │ checks canClaim(user)          │
      │ pays network gas              │
      └── claimFor(user) ─────────────▶│
                                      │
                                      └── 0.1 MON ──▶ User
                                                            │
                                                            ▼
                                                First Monad transaction
```

There is no application database for balances or claims. The smart contract is the source of truth. The frontend reads contract state and reconstructs activity from emitted events. The relayer only authenticates the signed request and broadcasts the sponsored transaction; it cannot bypass the contract's one-claim-per-wallet or treasury rules.

## Architecture

```text
apps/web/
  Next.js 15, React, TypeScript, Tailwind CSS
  Wagmi, Viem, RainbowKit, TanStack Query
  Free message signing for zero-MON wallets

apps/web/src/app/api/
  relay-claim/   Paymaster-like relayer endpoint
  rpc/           Same-origin RPC proxy with provider fallback
  history/       Chunked on-chain event-history indexer

contracts/
  Solidity 0.8.24
  Hardhat, ethers v6, Mocha, Chai
  deposit(), claim(), claimFor(), relayer authorization
  Deployment, treasury migration, and security tests

docs/
  Smart-contract documentation
```

### Gasless claim request lifecycle

```text
Claim component
  └─ useClaim()
      ├─ signMessageAsync()
      └─ POST /api/relay-claim
          ├─ validate recipient and signature
          ├─ read canClaim(recipient)
          ├─ load server-only relayer signer
          ├─ write claimFor(recipient)
          ├─ wait for confirmation
          └─ return transaction hash
```

The frontend never receives the relayer private key. `RELAYER_PRIVATE_KEY` is server-only and must never use the `NEXT_PUBLIC_` prefix.

## Run the application

### Requirements

- Node.js 20+
- npm
- A WalletConnect project ID
- A Monad RPC URL

### 1. Clone and install

```bash
git clone https://github.com/godspowerufot/spark-hackathon.git
cd spark-hackathon

cd apps/web
npm install
cp .env.example .env.local
```

### 2. Configure the frontend

Update `apps/web/.env.local`:

```env
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_RPC_URL=https://monad-testnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
NEXT_PUBLIC_ALCHEMY_API_KEY=YOUR_ALCHEMY_API_KEY
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
NEXT_PUBLIC_LEDGER_ADDRESS=0x2Bb64B2EfAFE10691BAcaa7E7915075705E9E4f2
NEXT_PUBLIC_LEDGER_DEPLOY_BLOCK=46269911
NEXT_PUBLIC_EXPLORER_URL=https://testnet.monadexplorer.com

# Server-only relayer key (never expose with NEXT_PUBLIC_)
RELAYER_PRIVATE_KEY=0xYOUR_FUNDED_RELAYER_KEY
```

### 3. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If `NEXT_PUBLIC_LEDGER_ADDRESS` is empty, the application starts in local demo mode.

## Smart-contract development

```bash
cd contracts
npm install
cp .env.example .env

npx hardhat compile
npx hardhat test
```

To deploy your own testnet instance, add a funded testnet-only `PRIVATE_KEY` and RPC URL to `contracts/.env`, then run:

```bash
npx hardhat run scripts/deploy.ts --network monadTestnet
```

The deployment script writes the new contract address into the frontend environment automatically.

## Contract design

The `GasSponsorLedger` contract exposes:

- `deposit()` — deposit native MON into the treasury
- `canClaim(address)` — check wallet eligibility
- `claim()` — receive the configured gas amount once (user pays gas)
- `claimFor(address)` — gasless onboarding: relayer pays gas, recipient receives MON
- `setRelayer(address)` — owner rotates the authorized relayer
- `getStats()` — read aggregate protocol metrics
- `setMaxClaimAmount()` — owner updates the claim amount
- `withdrawTreasury()` — owner-controlled treasury withdrawal
- `pause()` / `unpause()` — emergency circuit breaker
- `emergencyWithdraw()` — recover funds while paused

Important events:

- `SponsorDeposited`
- `GasClaimed`
- `RelayerUpdated`
- `TreasuryWithdrawn`
- `EmergencyWithdraw`
- `MaxClaimUpdated`

## Security

- Checks-Effects-Interactions ordering
- Reentrancy protection on value-moving functions
- One claim per address
- Zero-address and zero-value validation
- Treasury balance checks
- Authorized-relayer check on `claimFor`
- Off-chain signature verification before relaying
- Signature bound to recipient, contract, and chain ID
- Owner-only administrative controls
- Pausable deposit and claim flow
- Low-level `call` with failure handling instead of `transfer`
- Custom Solidity errors
- Tests for deposits, direct and relayed claims, duplicate claims, unauthorized relayers, relayer rotation, pause behavior, emergency withdrawal, and reentrancy

### Relayer production considerations

The current relayer is suitable for a testnet MVP. A production deployment should use a dedicated relayer account separate from the owner, KMS/HSM-backed key custody, wallet/IP rate limiting, a request queue, per-campaign budgets, nonce locking, signature deadlines, and EIP-712 typed data. Larger deployments can replace this service with an ERC-4337 Paymaster while retaining the same treasury and onboarding experience.

### Current trust and eligibility model

The deployed MVP is intentionally permissionless: any address that has not claimed before can claim while the treasury is funded and active. “One claim per wallet” is not the same as “one claim per person.” Future versions can add campaign-specific allowlists, attestations, wallet-age rules, proof of activity, or sponsor-defined eligibility without changing the core sponsorship idea.

## Built for the Monad ecosystem

SparkGas is not just a faucet UI. It is reusable onboarding infrastructure: a transparent treasury, deterministic distribution rules, measurable campaign results, and a direct path from a zero-MON wallet to its first Monad transaction.

---

**Sponsor the first mile. Unlock every wallet. — SparkGas**
