'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy /pay → Agent desk */
export default function PayRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/agent')
  }, [router])
  return (
    <div className="py-20 text-center text-sm text-muted">Redirecting to agent desk…</div>
  )
}
