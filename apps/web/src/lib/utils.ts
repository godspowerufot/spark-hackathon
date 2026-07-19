import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatEther, type Hex } from 'viem'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortAddress(value: string, chars = 4) {
  if (!value || value.length < chars * 2 + 2) return value
  return `${value.slice(0, chars + 2)}…${value.slice(-chars)}`
}

export function shortHash(value: string, chars = 4) {
  if (!value || value.length < chars * 2 + 2) return value
  return `${value.slice(0, chars + 2)}…${value.slice(-chars)}`
}

export function formatMon(wei: bigint, digits = 4) {
  const n = Number(formatEther(wei))
  return n.toLocaleString(undefined, { maximumFractionDigits: digits })
}

export function explorerTx(base: string, hash: Hex | string) {
  return `${base.replace(/\/$/, '')}/tx/${hash}`
}

export function explorerAddress(base: string, address: string) {
  return `${base.replace(/\/$/, '')}/address/${address}`
}

export function humanError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (lower.includes('alreadyclaimed') || lower.includes('already claimed')) {
    return 'This wallet has already claimed sponsored gas.'
  }
  if (lower.includes('insufficienttreasury') || lower.includes('insufficient treasury')) {
    return 'Treasury does not have enough MON for this claim.'
  }
  if (lower.includes('user rejected') || lower.includes('denied')) {
    return 'Transaction rejected in wallet.'
  }
  if (lower.includes('wrong network') || lower.includes('chain mismatch')) {
    return 'Wrong network. Switch to Monad.'
  }
  if (lower.includes('zeroamount')) return 'Amount must be greater than zero.'
  if (lower.includes('enforcedpause') || lower.includes('paused')) {
    return 'Contract is paused.'
  }
  if (lower.includes('gas')) return 'Gas estimation failed. Check balance and network.'
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network request failed') ||
    lower.includes('fetch failed')
  ) {
    return 'Network request failed. Disable ad blockers for this site, or retry — RPC may be blocked.'
  }
  if (lower.includes('user rejected') || lower.includes('denied') || lower.includes('rejected the request')) {
    return 'Signature or transaction rejected in wallet.'
  }
  if (lower.includes('already claimed')) {
    return 'This wallet has already claimed sponsored gas.'
  }
  if (lower.includes('not eligible') || lower.includes('treasury')) {
    return 'Not eligible right now — check treasury balance or pause status.'
  }
  return 'Transaction failed. Please try again.'
}
