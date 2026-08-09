'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy /pay → Event VIP checkout */
export default function PayRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/events/arc-summit-vip/vip')
  }, [router])
  return (
    <div className="py-20 text-center text-sm text-muted">Redirecting to VIP checkout…</div>
  )
}
