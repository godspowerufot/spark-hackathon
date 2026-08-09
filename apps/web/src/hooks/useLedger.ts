'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parseEther, type Address, type Hex } from 'viem'
import {
  useAccount,
  useReadContract,
  useSignMessage,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { getChainConfig, isSupportedAppChain } from '@/config/chains'
import { gasSponsorLedgerAbi } from '@/contracts/abi'
import { demoLedger, type LedgerStats } from '@/services/demoLedger'
import { humanError } from '@/lib/utils'
import toast from 'react-hot-toast'

export type LedgerEventKind = 'deposit' | 'claim'

export interface LedgerHistoryItem {
  kind: LedgerEventKind
  actor: Address
  amount: bigint
  treasuryBalance: bigint
  txHash: Hex
  blockNumber: bigint
  logIndex: number
}

function invalidateLedger(qc: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['gsl'] }),
    qc.invalidateQueries({ queryKey: ['readContract'] }),
  ])
}

export function useActiveLedger() {
  const { chainId } = useAccount()
  const supported = isSupportedAppChain(chainId)
  const cfg = getChainConfig(supported ? chainId : undefined)
  const ledgerAddress = (supported ? cfg.ledgerAddress : '') as Address | undefined
  const enabledOnchain = Boolean(ledgerAddress) && supported

  return {
    chainId: cfg.id,
    cfg,
    gasSymbol: cfg.gasSymbol,
    chainLabel: cfg.label,
    explorerUrl: cfg.explorerUrl,
    ledgerAddress,
    enabledOnchain,
    supported,
  }
}

export function useTreasury() {
  const { ledgerAddress, enabledOnchain, gasSymbol, explorerUrl, cfg, chainId, supported } =
    useActiveLedger()

  const onchainStats = useReadContract({
    address: ledgerAddress,
    abi: gasSponsorLedgerAbi,
    functionName: 'getStats',
    chainId,
    query: { enabled: enabledOnchain, refetchInterval: 12_000 },
  })

  const onchainOwner = useReadContract({
    address: ledgerAddress,
    abi: gasSponsorLedgerAbi,
    functionName: 'owner',
    chainId,
    query: { enabled: enabledOnchain, refetchInterval: 60_000 },
  })

  const demo = useQuery({
    queryKey: ['gsl', 'demo', 'stats'],
    queryFn: () => demoLedger.getStats(),
    enabled: !enabledOnchain,
    refetchInterval: 3_000,
  })

  if (enabledOnchain) {
    const raw = onchainStats.data
    const stats: LedgerStats | undefined = raw
      ? {
          treasuryBalance: raw[0],
          maxClaimAmount: raw[1],
          totalSponsored: raw[2],
          totalClaimed: raw[3],
          usersHelped: raw[4],
          depositCount: raw[5],
          paused: raw[6],
          owner:
            (onchainOwner.data as Address | undefined) ??
            ('0x0000000000000000000000000000000000000000' as Address),
        }
      : undefined

    return {
      stats,
      isLoading: onchainStats.isLoading || onchainOwner.isLoading,
      isError: onchainStats.isError,
      refetch: async () => {
        await Promise.all([onchainStats.refetch(), onchainOwner.refetch()])
      },
      demo: false,
      ledgerAddress,
      gasSymbol,
      explorerUrl,
      chainLabel: cfg.label,
      chainId,
      supported,
    }
  }

  return {
    stats: demo.data,
    isLoading: demo.isLoading,
    isError: demo.isError,
    refetch: demo.refetch,
    demo: true,
    ledgerAddress: undefined,
    gasSymbol,
    explorerUrl,
    chainLabel: cfg.label,
    chainId,
    supported,
  }
}

export function useCanClaim(address?: Address) {
  const { ledgerAddress, enabledOnchain, chainId } = useActiveLedger()

  const onchain = useReadContract({
    address: ledgerAddress,
    abi: gasSponsorLedgerAbi,
    functionName: 'canClaim',
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: enabledOnchain && Boolean(address), refetchInterval: 8_000 },
  })

  const demo = useQuery({
    queryKey: ['gsl', 'demo', 'canClaim', address],
    queryFn: () => (address ? demoLedger.canClaim(address) : false),
    enabled: !enabledOnchain && Boolean(address),
  })

  return {
    canClaim: enabledOnchain ? Boolean(onchain.data) : Boolean(demo.data),
    isLoading: enabledOnchain ? onchain.isLoading : demo.isLoading,
    refetch: enabledOnchain ? onchain.refetch : demo.refetch,
  }
}

export function useHasClaimed(address?: Address) {
  const { ledgerAddress, enabledOnchain, chainId } = useActiveLedger()

  const onchain = useReadContract({
    address: ledgerAddress,
    abi: gasSponsorLedgerAbi,
    functionName: 'hasClaimed',
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: enabledOnchain && Boolean(address), refetchInterval: 8_000 },
  })

  const demo = useQuery({
    queryKey: ['gsl', 'demo', 'hasClaimed', address],
    queryFn: () => (address ? demoLedger.hasClaimed(address) : false),
    enabled: !enabledOnchain && Boolean(address),
  })

  return {
    hasClaimed: enabledOnchain ? Boolean(onchain.data) : Boolean(demo.data),
    isLoading: enabledOnchain ? onchain.isLoading : demo.isLoading,
  }
}

export function useDeposit() {
  const qc = useQueryClient()
  const { address } = useAccount()
  const { ledgerAddress, enabledOnchain, gasSymbol, chainLabel } = useActiveLedger()
  const { writeContractAsync, data: hash, isPending, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!ledgerAddress || !hash) return
    if (receipt.isSuccess) {
      void invalidateLedger(qc)
      toast.success(`Deposit confirmed on ${chainLabel}.`, { id: 'deposit' })
      reset()
    } else if (receipt.isError) {
      toast.error('Deposit transaction failed.', { id: 'deposit' })
      reset()
    }
  }, [chainLabel, hash, ledgerAddress, qc, receipt.isError, receipt.isSuccess, reset])

  const demoMutation = useMutation({
    mutationFn: async (amount: string) => {
      if (!address) throw new Error('Connect wallet first.')
      const wei = parseEther(amount)
      demoLedger.deposit(address, wei)
      return { hash: '0xdemo' as Hex }
    },
    onSuccess: async () => {
      await invalidateLedger(qc)
      toast.success('Deposit recorded (demo).')
    },
    onError: (e) => toast.error(humanError(e)),
  })

  async function deposit(amount: string) {
    if (!amount || Number(amount) <= 0) {
      toast.error(`Enter a valid ${gasSymbol} amount.`)
      return
    }

    if (enabledOnchain) {
      try {
        if (!ledgerAddress) throw new Error('Ledger not configured')
        if (!address) throw new Error('Connect wallet first.')
        const wei = parseEther(amount)
        toast.loading('Confirm deposit in wallet…', { id: 'deposit' })
        const tx = await writeContractAsync({
          address: ledgerAddress,
          abi: gasSponsorLedgerAbi,
          functionName: 'deposit',
          value: wei,
        })
        toast.loading('Deposit submitted — waiting for confirmation…', { id: 'deposit' })
        return tx
      } catch (e) {
        toast.error(humanError(e), { id: 'deposit' })
        throw e
      }
    }

    return demoMutation.mutateAsync(amount)
  }

  return {
    deposit,
    isPending: enabledOnchain
      ? isPending || Boolean(hash && receipt.isLoading)
      : demoMutation.isPending,
    hash,
    gasSymbol,
  }
}

export function useClaim() {
  const qc = useQueryClient()
  const { address } = useAccount()
  const { ledgerAddress, enabledOnchain, gasSymbol, chainId, chainLabel } = useActiveLedger()
  const { signMessageAsync } = useSignMessage()
  const { writeContractAsync, data: hash, isPending, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })
  const [gaslessHash, setGaslessHash] = useState<Hex | undefined>()
  const [gaslessPending, setGaslessPending] = useState(false)

  useEffect(() => {
    if (!ledgerAddress || !hash) return
    if (receipt.isSuccess) {
      void invalidateLedger(qc)
      toast.success(`Gas claimed on ${chainLabel}.`, { id: 'claim' })
      reset()
    } else if (receipt.isError) {
      toast.error('Claim transaction failed.', { id: 'claim' })
      reset()
    }
  }, [chainLabel, hash, ledgerAddress, qc, receipt.isError, receipt.isSuccess, reset])

  const demoMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Connect wallet first.')
      return demoLedger.claim(address)
    },
    onSuccess: async () => {
      await invalidateLedger(qc)
      toast.success('Gas claimed successfully.')
    },
    onError: (e) => toast.error(humanError(e)),
  })

  async function claimGasless() {
    if (!address) {
      toast.error('Connect wallet first.')
      return
    }
    if (!enabledOnchain || !ledgerAddress) {
      return demoMutation.mutateAsync()
    }

    try {
      setGaslessPending(true)
      toast.loading('Sign the free claim message in your wallet…', { id: 'claim' })

      const message = [
        'SparkGas — gasless claim',
        `Recipient: ${address}`,
        `Contract: ${ledgerAddress}`,
        `Chain ID: ${chainId}`,
      ].join('\n')

      const signature = await signMessageAsync({ message })
      toast.loading('Relayer is submitting your claim (you pay $0 gas)…', { id: 'claim' })

      const res = await fetch('/api/relay-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: address, signature, chainId }),
      })
      const json = (await res.json()) as { hash?: Hex; error?: string }
      if (!res.ok || !json.hash) {
        throw new Error(json.error || 'Gasless claim failed')
      }

      setGaslessHash(json.hash)
      await invalidateLedger(qc)
      toast.success(`Gas claimed — ${gasSymbol} is in your wallet. No gas paid.`, { id: 'claim' })
      return json.hash
    } catch (e) {
      toast.error(humanError(e), { id: 'claim' })
      throw e
    } finally {
      setGaslessPending(false)
    }
  }

  async function claimSelfPay() {
    if (enabledOnchain) {
      try {
        if (!ledgerAddress) throw new Error('Ledger not configured')
        if (!address) throw new Error('Connect wallet first.')
        toast.loading('Confirm claim in wallet…', { id: 'claim' })
        const tx = await writeContractAsync({
          address: ledgerAddress,
          abi: gasSponsorLedgerAbi,
          functionName: 'claim',
        })
        toast.loading('Claim submitted — waiting for confirmation…', { id: 'claim' })
        return tx
      } catch (e) {
        toast.error(humanError(e), { id: 'claim' })
        throw e
      }
    }
    return demoMutation.mutateAsync()
  }

  return {
    claim: claimGasless,
    claimSelfPay,
    isPending: enabledOnchain
      ? gaslessPending || isPending || Boolean(hash && receipt.isLoading)
      : demoMutation.isPending,
    hash: gaslessHash ?? hash,
    gasless: enabledOnchain,
    gasSymbol,
  }
}

interface HistoryApiEvent {
  kind: 'deposit' | 'claim'
  actor: string
  amount: string
  treasuryBalance: string
  txHash: string
  blockNumber: string
  logIndex: number
}

async function fetchOnchainHistory(chainId: number): Promise<{
  deposits: LedgerHistoryItem[]
  claims: LedgerHistoryItem[]
}> {
  const res = await fetch(`/api/history?chainId=${chainId}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load ledger history')
  const json = (await res.json()) as {
    deposits: HistoryApiEvent[]
    claims: HistoryApiEvent[]
  }

  const toItem = (e: HistoryApiEvent): LedgerHistoryItem => ({
    kind: e.kind,
    actor: e.actor as Address,
    amount: BigInt(e.amount),
    treasuryBalance: BigInt(e.treasuryBalance),
    txHash: e.txHash as Hex,
    blockNumber: BigInt(e.blockNumber),
    logIndex: e.logIndex,
  })

  return {
    deposits: (json.deposits ?? []).map(toItem),
    claims: (json.claims ?? []).map(toItem),
  }
}

export function useLedgerHistory() {
  const { ledgerAddress, enabledOnchain, chainId } = useActiveLedger()

  const onchain = useQuery({
    queryKey: ['gsl', 'onchain', 'history', chainId, ledgerAddress],
    queryFn: () => fetchOnchainHistory(chainId),
    enabled: enabledOnchain,
    refetchInterval: 12_000,
  })

  const demo = useQuery({
    queryKey: ['gsl', 'demo', 'history'],
    queryFn: () => {
      const h = demoLedger.history()
      return {
        deposits: h.deposits.map(
          (d, i): LedgerHistoryItem => ({
            kind: 'deposit',
            actor: d.sponsor as Address,
            amount: BigInt(d.amount),
            treasuryBalance: 0n,
            txHash: `0xdemo${i.toString(16).padStart(64, '0')}` as Hex,
            blockNumber: BigInt(d.at),
            logIndex: i,
          }),
        ),
        claims: h.claims.map(
          (c, i): LedgerHistoryItem => ({
            kind: 'claim',
            actor: c.claimer as Address,
            amount: BigInt(c.amount),
            treasuryBalance: 0n,
            txHash: `0xclaim${i.toString(16).padStart(64, '0')}` as Hex,
            blockNumber: BigInt(c.at),
            logIndex: i,
          }),
        ),
      }
    },
    enabled: !enabledOnchain,
    refetchInterval: 3_000,
  })

  const data = enabledOnchain ? onchain.data : demo.data

  const all = useMemo(() => {
    const items = [...(data?.deposits ?? []), ...(data?.claims ?? [])]
    return items.sort(
      (a, b) => Number(b.blockNumber - a.blockNumber) || b.logIndex - a.logIndex,
    )
  }, [data])

  return {
    deposits: data?.deposits ?? [],
    claims: data?.claims ?? [],
    all,
    isLoading: enabledOnchain ? onchain.isLoading : demo.isLoading,
    isError: enabledOnchain ? onchain.isError : demo.isError,
    refetch: enabledOnchain ? onchain.refetch : demo.refetch,
    demo: !enabledOnchain,
  }
}

/** @deprecated use useLedgerHistory */
export function useDemoHistory() {
  const history = useLedgerHistory()
  return {
    data: {
      deposits: history.deposits.map((d) => ({
        sponsor: d.actor,
        amount: d.amount.toString(),
        at: Number(d.blockNumber),
        txHash: d.txHash,
      })),
      claims: history.claims.map((c) => ({
        claimer: c.actor,
        amount: c.amount.toString(),
        at: Number(c.blockNumber),
        txHash: c.txHash,
      })),
    },
    isLoading: history.isLoading,
    refetch: history.refetch,
  }
}

export function useWallet() {
  const account = useAccount()
  return {
    address: account.address,
    isConnected: account.isConnected,
    chainId: account.chainId,
    status: account.status,
  }
}
