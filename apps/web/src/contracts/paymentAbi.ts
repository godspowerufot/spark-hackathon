export const firstPaymentAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'merchant_', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'pay',
    inputs: [{ name: 'memo', type: 'string' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getStats',
    inputs: [],
    outputs: [
      { name: 'merchant_', type: 'address' },
      { name: 'totalPaid_', type: 'uint256' },
      { name: 'paymentCount_', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'merchant',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paidBy',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalPaid',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paymentCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'PaymentReceived',
    inputs: [
      { name: 'payer', type: 'address', indexed: true },
      { name: 'merchant', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'memo', type: 'string', indexed: false },
      { name: 'paymentId', type: 'uint256', indexed: true },
    ],
  },
  { type: 'error', name: 'TransferFailed', inputs: [] },
  { type: 'error', name: 'ZeroAddress', inputs: [] },
  { type: 'error', name: 'ZeroAmount', inputs: [] },
] as const

/** Demo invoice — under the 0.1 USDC claim so leftover covers gas. */
export const DEMO_INVOICE = {
  id: 'INV-ARC-001',
  title: 'Hackathon coffee',
  merchantName: 'Arc Café (demo)',
  amountLabel: '0.05',
  amountWei: 50_000_000_000_000_000n, // 0.05 USDC native (18 decimals)
  memo: 'SparkGas first payment',
} as const
