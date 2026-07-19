import Link from 'next/link'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { FaqAccordion } from '@/components/shared/FaqAccordion'
import { TypewriterHeadline } from '@/components/shared/TypewriterHeadline'
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

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24 text-center">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        >
          <source src="/6624829-uhd_2160_3840_30fps.mp4" type="video/mp4" />
        </video>
        {/* Heavy dark scrim + brand glow so the headline pops over the video */}
        <div
          className="absolute inset-0 -z-10 bg-black/60"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.78) 45%, rgba(0,0,0,0.94) 100%), radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.1), transparent 55%), radial-gradient(ellipse at 50% 80%, rgba(0,208,132,0.05), transparent 50%)',
          }}
        />
        <div className="max-w-4xl">
          <div className="mb-6 font-mono text-[0.68rem] uppercase tracking-[0.35em] text-gold">
            SparkGas · Monad
          </div>
          <TypewriterHeadline />
          <p className="mx-auto mt-8 max-w-xl text-[1.1rem] font-light leading-relaxed text-ink/90">
            New wallets on Monad can&apos;t transact with{' '}
            <span className="font-mono text-gold">0 MON</span>. Sponsors fund the vault — you claim
            free gas once by signing, no balance required.
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
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">FAQ</div>
            <h2 className="mt-3 font-display text-3xl font-semibold">Clear answers</h2>
          </div>
          <FaqAccordion />
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

      <footer className="border-t border-hair pb-10 pt-6">
        <div className="overflow-hidden whitespace-nowrap py-6" aria-hidden="true">
          <div className="animate-marquee inline-flex will-change-transform">
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="font-display text-[clamp(4rem,10vw,9rem)] font-bold leading-none tracking-[-0.02em]"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <span key={i} className="mr-16 inline-flex items-baseline">
                    <span className="glow-spark">Spark</span>
                    <span className="text-white/15">Gas</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
          <div className="font-display font-semibold">
            SparkGas
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
