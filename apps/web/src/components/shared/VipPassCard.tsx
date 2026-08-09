'use client'

import { useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { avatarUrl } from '@/types/events'
import { shortAddress, shortHash, cn } from '@/lib/utils'

const AVATAR_STYLES = ['lorelei', 'adventurer', 'avataaars'] as const

export type VipPassProps = {
  eventName: string
  vipLabel: string
  holder: string
  amountLabel: string
  txHash: string
  explorerUrl: string
  eventId?: string
  paymentId?: string
  serial?: string
  className?: string
  /** Prefer verify URL so door scans prove on-chain purchase */
  shareUrl?: string
  verifyUrl?: string
  compact?: boolean
}

export function VipPassCard({
  eventName,
  vipLabel,
  holder,
  amountLabel,
  txHash,
  explorerUrl,
  eventId,
  paymentId,
  serial,
  className,
  shareUrl,
  verifyUrl,
  compact,
}: VipPassProps) {
  const [style, setStyle] = useState<(typeof AVATAR_STYLES)[number]>('lorelei')
  const [seed, setSeed] = useState(holder.slice(2, 10) || 'spark')
  const src = useMemo(() => avatarUrl(seed, style), [seed, style])
  const code = serial || paymentId || shortHash(txHash, 3)

  const qrTarget = useMemo(() => {
    if (verifyUrl) return verifyUrl
    if (typeof window === 'undefined') return shareUrl || ''
    if (eventId) {
      const q = new URLSearchParams({ event: eventId, tx: txHash, holder })
      return `${window.location.origin}/verify?${q.toString()}`
    }
    return shareUrl || window.location.href
  }, [eventId, holder, shareUrl, txHash, verifyUrl])

  async function copyShare() {
    await navigator.clipboard.writeText(qrTarget || shareUrl || window.location.href)
  }

  async function nativeShare() {
    const url = qrTarget || shareUrl || window.location.href
    if (navigator.share) {
      await navigator.share({
        title: `${vipLabel} · ${eventName}`,
        text: `Verify my SparkGas VIP pass on Arc`,
        url,
      })
    } else {
      await copyShare()
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-2xl border border-gold/35 shadow-[0_20px_60px_-20px_rgba(212,175,55,0.55)]',
          compact ? 'aspect-auto p-0' : 'aspect-[1.586/1]',
        )}
        style={{
          background:
            'linear-gradient(145deg, #2a2110 0%, #0d0d0d 42%, #1a1208 78%, #3a2a12 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'linear-gradient(110deg, transparent 20%, rgba(255,220,140,0.18) 45%, transparent 70%)',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-gold/80">
                SparkGas · Arc · Verified
              </div>
              <div className="mt-2 font-display text-xl font-semibold tracking-wide text-[#F5E6C0] sm:text-2xl">
                {vipLabel}
              </div>
              <div className="mt-1 truncate text-sm text-[#C9B896]">{eventName}</div>
            </div>
            <div className="flex shrink-0 items-start gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="VIP avatar"
                className="h-12 w-12 rounded-xl border border-gold/40 bg-black/40 sm:h-14 sm:w-14"
              />
              <div className="rounded-lg border border-gold/30 bg-[#0a0a0a]/90 p-1.5">
                <QRCodeSVG
                  value={qrTarget || txHash}
                  size={compact ? 56 : 64}
                  bgColor="#0a0a0a"
                  fgColor="#F5E6C0"
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-[#8A7A5A]">
                Holder
              </div>
              <div className="mt-1 font-mono text-sm text-[#F5E6C0]">{shortAddress(holder, 5)}</div>
              <div className="mt-3 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-[#8A7A5A]">
                Serial
              </div>
              <div className="mt-1 font-mono text-xs text-gold">#{code}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-[#8A7A5A]">
                Paid
              </div>
              <div className="mt-1 font-display text-2xl text-gold">{amountLabel}</div>
              <div className="font-mono text-[0.6rem] text-[#8A7A5A]">Scan QR to verify</div>
            </div>
          </div>
        </div>
      </div>

      {!compact ? (
        <>
          <div className="flex flex-wrap gap-2">
            {AVATAR_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.14em]',
                  style === s ? 'border-gold/50 text-gold' : 'border-hair text-muted hover:text-ink',
                )}
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setSeed(`${holder.slice(2, 6)}${Math.random().toString(36).slice(2, 6)}`)
              }
              className="rounded-lg border border-hair px-3 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted hover:text-ink"
            >
              Shuffle avatar
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void nativeShare()}
              className="rounded-full border border-gold/40 bg-gold/15 px-5 py-2.5 text-sm text-gold transition hover:bg-gold/25"
            >
              Share pass
            </button>
            <button
              type="button"
              onClick={() => void copyShare()}
              className="rounded-full border border-hair px-5 py-2.5 text-sm text-muted transition hover:text-ink"
            >
              Copy verify link
            </button>
            <a
              href={`${explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-hair px-5 py-2.5 font-mono text-sm text-gold hover:underline"
            >
              {shortHash(txHash)} ↗
            </a>
          </div>
        </>
      ) : null}
    </div>
  )
}
