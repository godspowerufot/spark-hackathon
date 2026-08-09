# SparkGas — X Threads (no blue tick needed)

Use these to announce SparkGas and catch judge / Monad attention.  
**No verified badge required.** Reach comes from a sharp hook, a demo clip, and tagging the right people once — not from spam.

---

## How to post without a blue tick (and still get seen)

1. **Lead with the problem**, not the product name.
2. **Attach a 15–30s screen recording** of the zero-MON claim (sign only → MON arrives). Video beats text.
3. **Post in the evening** (or when Monad / hackathon tags are active).
4. **Tag once**, not five times: `@monad_xyz` (and your hackathon handle if they have one).
5. **Reply to your own thread** with the live link + explorer after tweet 1 gets a few views.
6. **Pin Thread A** to your profile for the weekend.

Replace `[LIVE_URL]` with your Vercel URL.  
Replace `[YOUR_NAME]` if you want.

Contract (for tweet copy):  
`0x2Bb64B2EfAFE10691BAcaa7E7915075705E9E4f2`

---

## Thread A — Judge magnet (post this first)

**1/7**
New wallet on Monad.
Balance: 0 MON.

You can’t send a tx.
You can’t swap.
You can’t try the app.

Gas is the gate.
I built something that opens it.

**2/7**
The trap:

You need MON to transact.
You need to transact to use Monad.
Buying gas before you feel the product = drop-off.

Manual airdrops don’t scale.
They’re hard to audit.
People ask twice.

**3/7**
Introducing **SparkGas**

Sponsors deposit MON into an on-chain vault.
New users claim once.
Even with **zero MON**.

They only sign a message.
Signing is free.
A relayer pays the network fee.

**4/7**
Flow in 4 steps:

1. Sponsor deposits MON
2. User connects (0 balance OK)
3. User signs — no gas from them
4. Contract sends 0.1 MON · one claim per wallet

Everything emits events.
Transparent. Auditable.

**5/7**
[ATTACH DEMO VIDEO HERE]

Watch a zero-MON wallet claim gas live.
No starter tokens.
No “send me gas first.”

This is the unlock for students, hackathons, wallets, and dApps onboarding to Monad.

**6/7**
Built on Monad Testnet.

Smart contract + Hardhat tests
Gasless `claimFor` + paymaster-like relayer
Dashboard with on-chain deposit/claim history

Explorer:
https://testnet.monadexplorer.com/address/0x2Bb64B2EfAFE10691BAcaa7E7915075705E9E4f2

**7/7**
Try it → [LIVE_URL]

SparkGas turns
“Get MON first”
into
“Try Monad now.”

Built for @monad_xyz

RT if onboarding friction has bitten you too.

---

## Thread B — Story (personal, high share)

**1/5**
I wanted my friends on Monad.

I could send them a token.
I could not send them a first transaction.

They had assets.
They had no gas.
Stuck.

**2/5**
So I stopped DMing MON one by one.

I built **SparkGas** —
an on-chain gas sponsorship vault.

Deposit once.
Anyone eligible claims once.
The chain records every move.

**3/5**
The part that matters:

A wallet with **0 MON** can claim.
They sign a message (free).
Our relayer submits `claimFor` and pays the fee.

No chicken-and-egg.
No “fund yourself first.”

**4/5**
Who it’s for:

• Wallets → “Claim sponsored gas” in onboarding  
• dApps → get users to the product before the bridge  
• DAOs / hackathons → fund participants, measure claims on-chain  

**5/5**
Live on Monad Testnet → [LIVE_URL]

If you’re judging or building on Monad this weekend —
this is the first-mile problem, solved in public.

---

## Thread C — Short & loud (3 tweets, max punch)

**1/3**
Zero MON = zero transactions.

That’s the Monad onboarding cliff.

**SparkGas** lets new wallets claim sponsored gas by signing only.
Relayer pays the fee.
Vault pays the MON.
One claim per wallet.

**2/3**
[VIDEO]

Sign → claim → first tx unlocked.

**3/3**
Live: [LIVE_URL]
On-chain: https://testnet.monadexplorer.com/address/0x2Bb64B2EfAFE10691BAcaa7E7915075705E9E4f2

Built on @monad_xyz

---

## Single posts (quote / reply ammo)

Use these as standalone posts or replies under Monad / hackathon threads:

> “Claim gas without paying.”  
> Zero-MON wallets on Monad can onboard with SparkGas — sign a message, relayer pays gas, vault sends MON. Once. On-chain.  
> [LIVE_URL]

> Manual gas airdrops don’t scale.  
> SparkGas = shared vault + one claim per wallet + gasless claim for empty wallets.  
> Built for Monad.

> Judges: the demo is a wallet with **0 MON** claiming sponsored gas.  
> That’s the product.  
> SparkGas → [LIVE_URL]

---

## Hashtag / tag pack (use lightly)

Pick 2–3 max per thread:

`#Monad` `#MonadTestnet` `#BuildOnMonad` `#Web3` `#Hackathon`

Optional mentions (one primary):
`@monad_xyz`

Don’t tag 10 accounts. Looks spammy and kills reach for unverified accounts.

---

## Reply template (when someone asks “how?”)

> User signs a free message → our API verifies the sig + `canClaim` → relayer calls `claimFor(recipient)` and pays the network fee → contract sends 0.1 MON and locks that wallet forever.  
> Sponsored MON stays in the contract until claim. Relayer only pays gas.

---

## Checklist before you hit Post

- [ ] 15–30s claim demo video attached to tweet 1 or 5  
- [ ] `[LIVE_URL]` replaced  
- [ ] Wallet in the video clearly shows **0 MON** before claim  
- [ ] Thread A pinned  
- [ ] One calm post — don’t delete/repost the same thread 5 times  

---

## One line for your bio

`Building SparkGas — gasless first mile on Monad | claim without paying`
