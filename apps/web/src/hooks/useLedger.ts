'use client'

import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parseEther, type Address, type Hex } from 'viem'
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { env } from '@/config/env'
import { gasSponsorLedgerAbi } from '@/contracts/abi'
import { demoLedger, type LedgerStats } from '@/services/demoLedger'
import { humanError } from '@/lib/utils'
import toast from 'react-hot-toast'

const ledgerAddress = env.ledgerAddress as Address | undefined
const enabledOnchain = Boolean(ledgerAddress)

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

export function useTreasury() {
  const onchainStats = useReadContract({
    address: ledgerAddress,
    abi: gasSponsorLedgerAbi,
    functionName: 'getStats',
    query: { enabled: enabledOnchain, refetchInterval: 12_000 },
  })

  const onchainOwner = useReadContract({
    address: ledgerAddress,
    abi: gasSponsorLedgerAbi,
    functionName: 'owner',
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
          owner: (onchainOwner.data as Address | undefined) ?? ('0x0000000000000000000000000000000000000000' as Address),
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
    }
  }

  return {
    stats: demo.data,
    isLoading: demo.isLoading,
    isError: demo.isError,
    refetch: demo.refetch,
    demo: true,
    ledgerAddress: undefined,
  }
}

export function useCanClaim(address?: Address) {
  const onchain = useReadContract({
    address: ledgerAddress,
    abi: gasSponsorLedgerAbi,
    functionName: 'canClaim',
    args: address ? [address] : undefined,
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
  const onchain = useReadContract({
    address: ledgerAddress,
    abi: gasSponsorLedgerAbi,
    functionName: 'hasClaimed',
    args: address ? [address] : undefined,
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
  const { writeContractAsync, data: hash, isPending, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!ledgerAddress || !hash) return
    if (receipt.isSuccess) {
      void invalidateLedger(qc)
      toast.success('Deposit confirmed on Monad.', { id: 'deposit' })
      reset()
    } else if (receipt.isError) {
      toast.error('Deposit transaction failed.', { id: 'deposit' })
      reset()
    }
  }, [hash, qc, receipt.isError, receipt.isSuccess, reset])

  const demoMutation = useMutation({
    mutationFn: async (amountMon: string) => {
      if (!address) throw new Error('Connect wallet first.')
      const wei = parseEther(amountMon)
      demoLedger.deposit(address, wei)
      return { hash: '0xdemo' as Hex }
    },
    onSuccess: async () => {
      await invalidateLedger(qc)
      toast.success('Deposit recorded (demo).')
    },
    onError: (e) => toast.error(humanError(e)),
  })

  async function deposit(amountMon: string) {
    if (!amountMon || Number(amountMon) <= 0) {
      toast.error('Enter a valid MON amount.')
      return
    }

    if (enabledOnchain) {
      try {
        if (!ledgerAddress) throw new Error('Ledger not configured')
        if (!address) throw new Error('Connect wallet first.')
        const wei = parseEther(amountMon)
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

    return demoMutation.mutateAsync(amountMon)
  }

  return {
    deposit,
    isPending: enabledOnchain
      ? isPending || Boolean(hash && receipt.isLoading)
      : demoMutation.isPending,
    hash,
  }
}

export function useClaim() {
  const qc = useQueryClient()
  const { address } = useAccount()
  const { writeContractAsync, data: hash, isPending, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!ledgerAddress || !hash) return
    if (receipt.isSuccess) {
      void invalidateLedger(qc)
      toast.success('Gas claimed on Monad.', { id: 'claim' })
      reset()
    } else if (receipt.isError) {
      toast.error('Claim transaction failed.', { id: 'claim' })
      reset()
    }
  }, [hash, qc, receipt.isError, receipt.isSuccess, reset])

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

  async function claim() {
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
    claim,
    isPending: enabledOnchain
      ? isPending || Boolean(hash && receipt.isLoading)
      : demoMutation.isPending,
    hash,
  }
}

export function useAdminControls() {
  const qc = useQueryClient()
  const { writeContractAsync, data: hash, isPending, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!ledgerAddress || !hash) return
    if (receipt.isSuccess) {
      void invalidateLedger(qc)
      toast.success('Admin action confirmed.', { id: 'admin' })
      reset()
    } else if (receipt.isError) {
      toast.error('Admin transaction failed.', { id: 'admin' })
      reset()
    }
  }, [hash, qc, receipt.isError, receipt.isSuccess, reset])

  const demoPause = useMutation({
    mutationFn: async (paused: boolean) => demoLedger.pause(paused),
    onSuccess: async () => {
      await invalidateLedger(qc)
      toast.success('Pause state updated (demo).')
    },
    onError: (e) => toast.error(humanError(e)),
  })

  async function setPaused(paused: boolean) {
    if (enabledOnchain && ledgerAddress) {
      try {
        toast.loading(paused ? 'Pausing…' : 'Unpausing…', { id: 'admin' })
        await writeContractAsync({
          address: ledgerAddress,
          abi: gasSponsorLedgerAbi,
          functionName: paused ? 'pause' : 'unpause',
        })
        toast.loading('Waiting for confirmation…', { id: 'admin' })
      } catch (e) {
        toast.error(humanError(e), { id: 'admin' })
      }
      return
    }
    await demoPause.mutateAsync(paused)
  }

  return {
    setPaused,
    isPending: enabledOnchain
      ? isPending || Boolean(hash && receipt.isLoading)
      : demoPause.isPending,
  }
}

async function fetchOnchainHistory(
  client: NonNullable<ReturnType<typeof usePublicClient>>,
  address: Address,
): Promise<{ deposits: LedgerHistoryItem[]; claims: LedgerHistoryItem[] }> {
  const latest = await client.getBlockNumber()
  // Alchemy free tier often caps eth_getLogs ranges; keep windows modest.
  const fromBlock = latest > 4_999n ? latest - 4_999n : 0n

  const [depositLogs, claimLogs] = await Promise.all([
    client.getContractEvents({
      address,
      abi: gasSponsorLedgerAbi,
      eventName: 'SponsorDeposited',
      fromBlock,
      toBlock: latest,
    }),
    client.getContractEvents({
      address,
      abi: gasSponsorLedgerAbi,
      eventName: 'GasClaimed',
      fromBlock,
      toBlock: latest,
    }),
  ])

  const deposits: LedgerHistoryItem[] = depositLogs
    .map((log) => ({
      kind: 'deposit' as const,
      actor: log.args.sponsor as Address,
      amount: log.args.amount as bigint,
      treasuryBalance: log.args.treasuryBalance as bigint,
      txHash: log.transactionHash as Hex,
      blockNumber: log.blockNumber ?? 0n,
      logIndex: log.logIndex ?? 0,
    }))
    .sort((a, b) => Number(b.blockNumber - a.blockNumber) || b.logIndex - a.logIndex)

  const claims: LedgerHistoryItem[] = claimLogs
    .map((log) => ({
      kind: 'claim' as const,
      actor: log.args.claimer as Address,
      amount: log.args.amount as bigint,
      treasuryBalance: log.args.treasuryBalance as bigint,
      txHash: log.transactionHash as Hex,
      blockNumber: log.blockNumber ?? 0n,
      logIndex: log.logIndex ?? 0,
    }))
    .sort((a, b) => Number(b.blockNumber - a.blockNumber) || b.logIndex - a.logIndex)

  return { deposits, claims }
}

export function useLedgerHistory() {
  const client = usePublicClient()

  const onchain = useQuery({
    queryKey: ['gsl', 'onchain', 'history', ledgerAddress],
    queryFn: async () => {
      if (!client || !ledgerAddress) return { deposits: [], claims: [] }
      return fetchOnchainHistory(client, ledgerAddress)
    },
    enabled: enabledOnchain && Boolean(client),
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
