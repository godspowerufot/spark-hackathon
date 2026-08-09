'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { FaqAccordion } from '@/components/shared/FaqAccordion'
import { TypewriterHeadline } from '@/components/shared/TypewriterHeadline'
import { Button } from '@/components/ui/Button'
import { APP_NAME } from '@/constants/app'

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.19, 1, 0.22, 1] as const },
}

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

      {/* Hero: brand + one line + one sentence + CTAs + full-bleed video */}
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
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.72) 42%, rgba(0,0,0,0.94) 100%), radial-gradient(ellipse at 50% 28%, rgba(212,175,55,0.12), transparent 55%)',
          }}
        />
        <motion.div
          className="max-w-4xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
        >
          <div className="font-display text-[clamp(3.5rem,12vw,8rem)] font-bold leading-none tracking-[-0.03em]">
            <span className="glow-spark">Spark</span>
            <span className="text-white/90">Gas</span>
          </div>
          <div className="mt-8">
            <TypewriterHeadline />
          </div>
          <p className="mx-auto mt-7 max-w-lg text-[1.05rem] font-light leading-relaxed text-ink/85">
            On Arc, sponsored USDC is gas and ticket money — claim once, buy VIP, prove it with a
            scan.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/events">
              <Button size="lg">Browse events</Button>
            </Link>
            <Link href="/events/new">
              <Button size="lg" variant="secondary">
                List an event
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* One job: the guest path */}
      <section className="px-6 py-28" id="how">
        <div className="mx-auto max-w-5xl">
          <motion.div className="max-w-2xl" {...fadeUp}>
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
              Event mode
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Three moves to the door
            </h2>
            <p className="mt-3 text-muted">
              Sponsors fill the vault. Guests never need a faucet. Merchants get an on-chain VIP
              payment they can verify with QR.
            </p>
          </motion.div>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Claim',
                d: 'Sign once on Arc. The relayer pays gas so a zero-balance wallet can start.',
              },
              {
                n: '02',
                t: 'Buy VIP',
                d: 'Spend that same USDC through FirstPayment. Memo locks the purchase to the event.',
              },
              {
                n: '03',
                t: 'Scan',
                d: 'Your foil pass carries a QR. Door staff open verify — the Arc tx must match.',
              },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.19, 1, 0.22, 1] }}
              >
                <div className="font-mono text-[0.66rem] tracking-[0.25em] text-gold">{step.n}</div>
                <h3 className="mt-4 font-display text-2xl">{step.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{step.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* One job: why Arc */}
      <section
        className="relative overflow-hidden border-y border-hair px-6 py-28"
        id="arc"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, rgba(212,175,55,0.08), transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(0,208,132,0.06), transparent 45%), #070707',
        }}
      >
        <div className="mx-auto max-w-5xl">
          <motion.div className="max-w-2xl" {...fadeUp}>
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
              Why Arc
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Gas is the currency
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Arc uses native USDC for gas. SparkGas sponsors that USDC so a guest can claim, then
              pay VIP without bridging or wrapping — the product story only works if money and gas
              are the same asset.
            </p>
            <p className="mt-4 text-sm text-muted-2">
              Monad remains the classic gas-sponsorship demo. Event Mode lives on Arc.
            </p>
          </motion.div>
        </div>
      </section>

      {/* One job: merchants */}
      <section className="px-6 py-28" id="merchants">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <motion.div className="max-w-xl" {...fadeUp}>
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">
              Merchants
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              List a night. Get paid on-chain.
            </h2>
            <p className="mt-4 text-muted">
              Connect your wallet, set VIP price, publish. Guests buy through the shared checkout;
              your listing owns the story and the verify link.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <Link href="/events/new">
              <Button size="lg">Create event</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-hair px-6 py-28" id="faq">
        <div className="mx-auto max-w-4xl">
          <motion.div className="text-center" {...fadeUp}>
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">FAQ</div>
            <h2 className="mt-3 font-display text-3xl font-semibold">Clear answers</h2>
          </motion.div>
          <div className="mt-12">
            <FaqAccordion />
          </div>
        </div>
      </section>

      <section className="px-6 py-32 text-center">
        <motion.div {...fadeUp}>
          <h2 className="font-display text-4xl font-semibold sm:text-5xl">
            The door can read the chain.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">
            Passes, payouts, and claims leave a trail — not a screenshot.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/events">
              <Button size="lg">Enter Event Mode</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">
                Open app
              </Button>
            </Link>
          </div>
        </motion.div>
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
            {APP_NAME}
            <span className="mt-1 block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-2">
              Event Mode on Arc · Gas sponsorship on Monad
            </span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted">
            <Link href="/events" className="hover:text-gold">
              Events
            </Link>
            <Link href="/events/new" className="hover:text-gold">
              Create
            </Link>
            <Link href="/passes" className="hover:text-gold">
              Passes
            </Link>
            <Link href="/sponsor" className="hover:text-gold">
              Sponsor
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
