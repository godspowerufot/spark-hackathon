# SparkGas — 3-Minute Judge Pitch Script

**Total time:** ~2:45 (buffer: 15s)  
**Goal:** Make judges feel the problem, see the fix live, and remember one line: *zero MON wallets can claim gas by signing only*.

---

## Before you start (30s setup — do this before judges arrive)

1. Landing page open on `localhost:3000` (or your deployed URL).
2. Two wallets ready:
   - **Wallet A (sponsor):** has MON on Monad Testnet.
   - **Wallet B (claimer):** **0 MON** balance — this is the hero of the demo.
3. MetaMask (or your wallet) already set to **Monad Testnet**.
4. Dashboard tab ready in a second browser tab.
5. Have the explorer link bookmarked:  
   `https://testnet.monadexplorer.com/address/0x2Bb64B2EfAFE10691BAcaa7E7915075705E9E4f2`

---

## Script timeline

| Time | Section | What you do |
|------|---------|-------------|
| 0:00–0:25 | Hook + problem | Stay on landing |
| 0:25–0:50 | Solution | Point at headline + CTAs |
| 0:50–1:20 | Sponsor (optional if treasury already funded) | Deposit or show vault |
| 1:20–2:20 | **Claim gas live** | Zero-MON wallet claim |
| 2:20–2:45 | Close + ask | Dashboard / one-liner |

---

## 0:00 – 0:25 · Hook + Problem

**Screen:** Landing page hero.

**Say:**

> “Hi, I’m [Name]. This is **SparkGas**.
>
> Here’s the onboarding problem on Monad: a new wallet with **zero MON** cannot send a single transaction. Even if I send them a token, they still can’t move it — because gas is the gate.
>
> Manual airdrops don’t scale. They’re hard to audit, and people can ask again and again.”

**Do:** Point at the headline *“Claim gas without paying.”* and the short subtitle.

---

## 0:25 – 0:50 · Solution (one breath)

**Screen:** Still on landing. Scroll slightly to “How it works” if needed.

**Say:**

> “SparkGas turns that into an on-chain vault.
>
> Sponsors deposit MON. New users claim once. A **relayer** pays the network fee — so the user only **signs a message**. Signing is free. They never need starter MON.”

**Do:** Click **Claim Gas** (or point at the button) — don’t connect yet.

---

## 0:50 – 1:20 · Show the vault (fast)

**Pick one path:**

### Path A — Treasury already funded (preferred for time)

**Screen:** `/dashboard`

**Say:**

> “This is the live treasury. Balance, claims, deposits — all from the contract and its events. No hidden balances.”

**Do:** Point at treasury balance + recent deposits/claims.

### Path B — Quick sponsor deposit (if vault looks empty)

**Screen:** `/sponsor` with Wallet A

**Say:**

> “Sponsors deposit MON into the contract. Funds stay on-chain until claimed.”

**Do:** Deposit a small amount (e.g. 0.2 MON) → confirm tx → show it appear in history.

---

## 1:20 – 2:20 · LIVE DEMO: Claim gas (the money shot)

**This is the section judges must remember. Slow down. Narrate every click.**

**Screen:** `/claim`

### Step 1 — Switch to the empty wallet (10s)

**Say:**

> “Now the important part. I’m switching to a wallet with **zero MON**. This is the student / new user who normally gets stuck.”

**Do:** Disconnect Wallet A → connect **Wallet B** (0 MON). Show balance = 0 if visible.

### Step 2 — Eligibility (10s)

**Say:**

> “The app checks eligibility on-chain: not claimed before, treasury has enough, contract not paused. Status: **Eligible**.”

**Do:** Point at the green **Eligible** badge and **gasless — you pay $0**.

### Step 3 — Claim (sign only) (30–40s)

**Say:**

> “I click Claim. Watch carefully — I am **not** sending a transaction from this wallet. I’m only **signing a message**.
>
> Behind the scenes, our paymaster-like **relayer** verifies my signature, checks `canClaim`, then calls `claimFor` and pays the gas.
>
> The contract sends **0.1 MON** to this wallet and marks it claimed forever.”

**Do:**
1. Click **Claim gas (free — sign only)** (or equivalent button text).
2. Approve the **message signature** in the wallet (not a gas-paying tx from the claimer).
3. Wait for success toast / status.
4. Point at the **relayer tx** hash if shown → open explorer briefly if time allows.

### Step 4 — Prove it worked (15–20s)

**Say:**

> “Wallet now has MON. If I try again — **Already claimed**. One claim per wallet. Abuse is blocked on-chain.”

**Do:** Optionally click Claim again to show it refuses, **or** show `hasClaimed` / status badge flip to Already claimed.

---

## 2:20 – 2:45 · Close (strong ask)

**Screen:** Landing footer marquee or dashboard.

**Say:**

> “SparkGas is gas sponsorship for Monad — transparent, one claim per wallet, and **gasless for the user**.
>
> It helps wallets, dApps, DAOs, and hackathons onboard people who start at zero.
>
> Thanks. Happy to show the contract, the relayer, or the tests.”

**Stop talking.** Smile. Wait for questions.

---

## One-liner to memorize

> **“SparkGas lets a zero-MON wallet claim sponsored gas by signing a message — the relayer pays the fee, the vault pays the MON, and the chain records everything.”**

---

## If something breaks (backup lines)

| Issue | What to say + do |
|-------|------------------|
| Signature popup slow | “Signing is free — no gas from the user. Relayer submits next.” |
| Relayer / RPC lag | Open explorer to a previous successful `GasClaimed` event and walk the flow verbally. |
| Wallet already claimed | Switch to another fresh address, or say: “That’s the security feature working.” |
| Demo mode badge | “Frontend also has a local demo mode; this run is / isn’t on-chain.” Prefer on-chain for judges. |
| Time almost up | Skip sponsor. Jump straight to claim with Wallet B. |

---

## Optional 15s Q&A answers (pre-load)

**“Is this ERC-4337?”**  
> “Not full Account Abstraction. It’s a paymaster-*like* app relayer calling `claimFor`. Same product outcome for this MVP — zero-balance claim — smaller surface.”

**“Who pays gas?”**  
> “Relayer wallet pays the network fee. Sponsored MON comes from the contract treasury.”

**“Why Monad?”**  
> “Fast, EVM-compatible, and onboarding friction is real for every new L1/L2. SparkGas turns ‘get gas first’ into ‘try the chain now.’”

**“Security?”**  
> “Ownable, pausable, reentrancy guard, one claim per wallet, CEI pattern, custom errors, Hardhat tests including `claimFor`.”

---

## Practice checklist (run once before pitch)

- [ ] Wallet B truly has **0 MON**
- [ ] Treasury has ≥ **0.1 MON**
- [ ] Relayer env key set (`RELAYER_PRIVATE_KEY`) and funded for fees
- [ ] Claim flow works end-to-end in under 60 seconds
- [ ] You’ve spoken the script out loud once with a timer

---

## Timing card (print / keep next to laptop)

```
0:00  Problem: zero MON = stuck
0:25  Solution: vault + relayer + one claim
0:50  Dashboard / vault
1:20  CLAIM with empty wallet (sign only)
2:20  Close: transparent · gasless · on Monad
2:45  STOP
```
