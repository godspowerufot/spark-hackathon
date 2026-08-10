export type StoredPass = {
  eventId: string
  eventName: string
  vipLabel: string
  amountLabel: string
  txHash: string
  holder: string
  paymentId?: string
  at: number
  agent?: boolean
  intentSignature?: string
  intentMessage?: string
  verifyPath?: string
}

const KEY = 'sparkgas.vip.passes.v1'

export function loadLocalPasses(holder?: string): StoredPass[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    const all = (raw ? JSON.parse(raw) : []) as StoredPass[]
    if (!holder) return all
    return all.filter((p) => p.holder.toLowerCase() === holder.toLowerCase())
  } catch {
    return []
  }
}

export function saveLocalPass(pass: StoredPass) {
  if (typeof window === 'undefined') return
  const all = loadLocalPasses()
  const exists = all.some(
    (p) => p.txHash.toLowerCase() === pass.txHash.toLowerCase(),
  )
  if (exists) return
  all.unshift(pass)
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 50)))
}

export function passVerifyPath(
  pass: Pick<StoredPass, 'eventId' | 'txHash' | 'holder'> & {
    intentSignature?: string
    intentMessage?: string
    verifyPath?: string
  },
) {
  if (pass.verifyPath) return pass.verifyPath
  const q = new URLSearchParams({
    event: pass.eventId,
    tx: pass.txHash,
    holder: pass.holder,
  })
  if (pass.intentSignature) q.set('intent', pass.intentSignature)
  if (pass.intentMessage) q.set('msg', pass.intentMessage)
  return `/verify?${q.toString()}`
}
