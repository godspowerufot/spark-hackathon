import Link from 'next/link'
import { FAQ } from '@/constants/app'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { Button } from '@/components/ui/Button'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <SiteHeader marketing />

      <section className="relative flex min-h-screen items-center justify-center px-6 pt-24 text-center">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.08), transparent 55%), radial-gradient(ellipse at 50% 80%, rgba(0,208,132,0.05), transparent 50%)',
          }}
        />
        <div className="max-w-3xl">
          <div className="mb-6 font-mono text-[0.68rem] uppercase tracking-[0.35em] text-gold">
            Gas Sponsorship Protocol · Monad
          </div>
          <h1 className="font-display text-[clamp(2.4rem,5.5vw,4.8rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-gradient">
            Sponsor the first mile.
            <br />
            Unlock every wallet.
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-[1.05rem] font-light leading-relaxed text-muted">
            Organizations deposit MON. New users claim gas once. Transparent, auditable, and
            on-chain — so onboarding never fails for lack of native tokens.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/claim">
              <Button size="lg">Claim Gas</Button>
            </Link>
            <Link href="/sponsor">
              <Button size="lg" variant="secondary">
                Become a Sponsor
              </Button>
            </Link>
          </div>
          <div className="mt-14 flex flex-wrap justify-center gap-8 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted-2">
            {['One claim per wallet', 'Pausable treasury', 'Event-audited'].map((t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald shadow-[0_0_8px_var(--color-emerald)]" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-28" id="how">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
              Process
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold">How it works</h2>
          </div>
          <div className="mt-16 grid gap-4 md:grid-cols-4">
            {[
              ['01', 'Connect', 'Wallet switches to Monad.'],
              ['02', 'Sponsor', 'DAOs & protocols deposit MON.'],
              ['03', 'Claim', 'Eligible users claim once.'],
              ['04', 'Transact', 'Users pay gas and explore Monad.'],
            ].map(([n, t, d]) => (
              <div key={n} className="panel p-6 transition duration-300 hover:-translate-y-1">
                <div className="font-mono text-[0.66rem] tracking-[0.25em] text-gold">{n}</div>
                <h3 className="mt-4 font-display text-xl">{t}</h3>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-hair px-6 py-28" id="faq">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">FAQ</div>
            <h2 className="mt-3 font-display text-3xl font-semibold">Clear answers</h2>
          </div>
          <div className="mt-12 space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="panel p-6">
                <h3 className="font-display text-lg">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-32 text-center">
        <h2 className="font-display text-4xl font-semibold">Trust should be verifiable.</h2>
        <p className="mx-auto mt-4 max-w-lg text-muted">
          Every deposit and claim emits an on-chain event. No hidden balances.
        </p>
        <Link href="/dashboard" className="mt-8 inline-block">
          <Button size="lg">Open Dashboard</Button>
        </Link>
      </section>

      <footer className="border-t border-hair px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="font-display font-semibold">
            Gas Sponsor Ledger
            <span className="mt-1 block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
              Built on Monad
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted">
            <Link href="/dashboard" className="hover:text-gold">
              App
            </Link>
            <Link href="/sponsor" className="hover:text-gold">
              Sponsor
            </Link>
            <Link href="/claim" className="hover:text-gold">
              Claim
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
