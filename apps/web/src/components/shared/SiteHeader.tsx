'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_NAME } from '@/constants/app'
import { env } from '@/config/env'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sponsor', label: 'Sponsor' },
  { href: '/claim', label: 'Claim' },
  { href: '/admin', label: 'Admin' },
  { href: '/wallet', label: 'Wallet' },
]

export function SiteHeader({ marketing = false }: { marketing?: boolean }) {
  const pathname = usePathname()

  return (
    <header
      className={cn(
        'z-50 border-b border-hair bg-[#050505]/80 backdrop-blur-xl',
        marketing ? 'fixed inset-x-0 top-0' : 'sticky top-0',
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display font-semibold tracking-[0.02em]">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gold shadow-[0_0_12px_2px_var(--color-gold-soft)]" />
            {APP_NAME}
          </Link>
          {!marketing ? (
            <nav className="hidden items-center gap-5 md:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    'text-sm text-muted transition hover:text-ink',
                    pathname.startsWith(l.href) && 'text-ink',
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          ) : (
            <nav className="hidden gap-8 text-sm text-muted md:flex">
              <a href="#how" className="hover:text-ink">
                How it works
              </a>
              <a href="#faq" className="hover:text-ink">
                FAQ
              </a>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          {env.demoMode ? (
            <span className="hidden rounded-full border border-gold/30 px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-gold sm:inline">
              Demo mode
            </span>
          ) : null}
          {marketing ? (
            <Link
              href="/dashboard"
              className="rounded-full border border-gold-soft px-5 py-2 text-sm text-gold transition hover:bg-gold/10"
            >
              Launch App
            </Link>
          ) : (
            <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
          )}
        </div>
      </div>
    </header>
  )
}
