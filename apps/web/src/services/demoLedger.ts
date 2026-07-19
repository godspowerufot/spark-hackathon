'use client'

import { parseEther, type Address } from 'viem'
import { env } from '@/config/env'

const STORAGE_KEY = 'gsl.demo.v1'

export interface LedgerStats {
  treasuryBalance: bigint
  maxClaimAmount: bigint
  totalSponsored: bigint
  totalClaimed: bigint
  usersHelped: bigint
  depositCount: bigint
  paused: boolean
  owner: Address
}

interface DemoState {
  treasuryBalance: string
  maxClaimAmount: string
  totalSponsored: string
  totalClaimed: string
  usersHelped: number
  depositCount: number
  paused: boolean
  owner: string
  claimed: string[]
  deposits: { sponsor: string; amount: string; at: number }[]
  claims: { claimer: string; amount: string; at: number }[]
}

const DEFAULT_OWNER = '0x0000000000000000000000000000000000000001' as Address

function seed(): DemoState {
  return {
    treasuryBalance: parseEther('2.5').toString(),
    maxClaimAmount: parseEther('0.01').toString(),
    totalSponsored: parseEther('2.5').toString(),
    totalClaimed: '0',
    usersHelped: 0,
    depositCount: 3,
    paused: false,
    owner: DEFAULT_OWNER,
    claimed: [],
    deposits: [],
    claims: [],
  }
}

function read(): DemoState {
  if (typeof window === 'undefined') return seed()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const s = seed()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      return s
    }
    return JSON.parse(raw) as DemoState
  } catch {
    return seed()
  }
}

function write(state: DemoState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function toStats(s: DemoState): LedgerStats {
  return {
    treasuryBalance: BigInt(s.treasuryBalance),
    maxClaimAmount: BigInt(s.maxClaimAmount),
    totalSponsored: BigInt(s.totalSponsored),
    totalClaimed: BigInt(s.totalClaimed),
    usersHelped: BigInt(s.usersHelped),
    depositCount: BigInt(s.depositCount),
    paused: s.paused,
    owner: s.owner as Address,
  }
}

/** Local ledger used when NEXT_PUBLIC_LEDGER_ADDRESS is unset. */
export const demoLedger = {
  getStats(): LedgerStats {
    return toStats(read())
  },
  hasClaimed(address: Address): boolean {
    return read().claimed.map((a) => a.toLowerCase()).includes(address.toLowerCase())
  },
  canClaim(address: Address): boolean {
    const s = read()
    if (s.paused) return false
    if (s.claimed.map((a) => a.toLowerCase()).includes(address.toLowerCase())) return false
    return BigInt(s.treasuryBalance) >= BigInt(s.maxClaimAmount)
  },
  deposit(sponsor: Address, amountWei: bigint) {
    const s = read()
    if (s.paused) throw new Error('Contract is paused.')
    if (amountWei <= 0n) throw new Error('Amount must be greater than zero.')
    s.treasuryBalance = (BigInt(s.treasuryBalance) + amountWei).toString()
    s.totalSponsored = (BigInt(s.totalSponsored) + amountWei).toString()
    s.depositCount += 1
    s.deposits.unshift({
      sponsor,
      amount: amountWei.toString(),
      at: Date.now(),
    })
    write(s)
    return toStats(s)
  },
  claim(claimer: Address) {
    const s = read()
    if (s.paused) throw new Error('Contract is paused.')
    if (s.claimed.map((a) => a.toLowerCase()).includes(claimer.toLowerCase())) {
      throw new Error('AlreadyClaimed')
    }
    const max = BigInt(s.maxClaimAmount)
    if (BigInt(s.treasuryBalance) < max) throw new Error('InsufficientTreasury')
    s.claimed.push(claimer)
    s.treasuryBalance = (BigInt(s.treasuryBalance) - max).toString()
    s.totalClaimed = (BigInt(s.totalClaimed) + max).toString()
    s.usersHelped += 1
    s.claims.unshift({ claimer, amount: max.toString(), at: Date.now() })
    write(s)
    return { amount: max, stats: toStats(s) }
  },
  pause(paused: boolean) {
    const s = read()
    s.paused = paused
    write(s)
    return toStats(s)
  },
  history() {
    const s = read()
    return { deposits: s.deposits, claims: s.claims }
  },
  isDemo: env.demoMode,
}
