'use client'

import { useEffect, useState } from 'react'
import { parseEther, type Address, type Hex } from 'viem'
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import toast from 'react-hot-toast'
import { getChainConfig, arcTestnet, isSupportedAppChain } from '@/config/chains'
import { DEMO_INVOICE, firstPaymentAbi } from '@/contracts/paymentAbi'
import { humanError } from '@/lib/utils'

export function usePaymentContract() {
  const { chainId } = useAccount()
  const onArc = chainId === arcTestnet.id
  const cfg = getChainConfig(onArc ? arcTestnet.id : chainId)
  const paymentAddress = (cfg.paymentAddress || undefined) as Address | undefined
  const enabled = Boolean(paymentAddress) && isSupportedAppChain(chainId)

  return {
    paymentAddress,
    enabled,
    onArc,
    cfg,
    gasSymbol: cfg.gasSymbol,
    explorerUrl: cfg.explorerUrl,
    chainLabel: cfg.label,
  }
}

export function usePaymentStats() {
  const { paymentAddress, enabled } = usePaymentContract()
  const { chainId } = useAccount()

  const stats = useReadContract({
    address: paymentAddress,
    abi: firstPaymentAbi,
    functionName: 'getStats',
    chainId,
    query: { enabled, refetchInterval: 12_000 },
  })

  return {
    merchant: stats.data?.[0] as Address | undefined,
    totalPaid: stats.data?.[1],
    paymentCount: stats.data?.[2],
    isLoading: stats.isLoading,
    refetch: stats.refetch,
  }
}

export function useFirstPayment(opts?: {
  amountWei?: bigint
  amountLabel?: string
  memo?: string
}) {
  const amountWei = opts?.amountWei ?? DEMO_INVOICE.amountWei
  const amountLabel = opts?.amountLabel ?? DEMO_INVOICE.amountLabel
  const defaultMemo = opts?.memo ?? DEMO_INVOICE.memo

  const { address, chainId } = useAccount()
  const { paymentAddress, enabled, onArc, gasSymbol, explorerUrl, chainLabel } =
    usePaymentContract()
  const balance = useBalance({ address, chainId })
  const { writeContractAsync, data: hash, isPending, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })
  const [confirmedHash, setConfirmedHash] = useState<Hex | undefined>()

  useEffect(() => {
    if (!hash) return
    if (receipt.isSuccess) {
      setConfirmedHash(hash)
      toast.success(`Payment confirmed on ${chainLabel}.`, { id: 'pay' })
      reset()
    } else if (receipt.isError) {
      toast.error('Payment failed.', { id: 'pay' })
      reset()
    }
  }, [chainLabel, hash, receipt.isError, receipt.isSuccess, reset])

  const enoughBalance = balance.data != null && balance.data.value >= amountWei

  async function pay(memo = defaultMemo) {
    if (!address) {
      toast.error('Connect wallet first.')
      return
    }
    if (!onArc) {
      toast.error('Switch to Arc Testnet to make the first USDC payment.')
      return
    }
    if (!paymentAddress || !enabled) {
      toast.error('Payment contract not configured on this chain.')
      return
    }
    if (!enoughBalance) {
      toast.error(`Need at least ${amountLabel} ${gasSymbol}. Claim gas first.`)
      return
    }

    try {
      toast.loading('Confirm payment in wallet…', { id: 'pay' })
      const tx = await writeContractAsync({
        address: paymentAddress,
        abi: firstPaymentAbi,
        functionName: 'pay',
        args: [memo],
        value: amountWei,
      })
      toast.loading('Payment submitted — waiting for confirmation…', { id: 'pay' })
      return tx as Hex
    } catch (e) {
      toast.error(humanError(e), { id: 'pay' })
      throw e
    }
  }

  return {
    pay,
    hash: confirmedHash ?? hash,
    isPending: isPending || Boolean(hash && receipt.isLoading),
    isSuccess: Boolean(confirmedHash),
    enoughBalance,
    balance: balance.data?.value,
    gasSymbol,
    explorerUrl,
    onArc,
    paymentAddress,
    enabled,
  }
}

export function invoiceWei() {
  return parseEther(DEMO_INVOICE.amountLabel)
}
