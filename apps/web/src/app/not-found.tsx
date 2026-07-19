import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-gold">404</div>
      <h1 className="mt-3 font-display text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 text-muted">This route does not exist in Gas Sponsor Ledger.</p>
      <Link href="/dashboard" className="mt-8">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}
