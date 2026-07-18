'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// รีเฟรชข้อมูล Server Component เป็นระยะ — แทน WebSocket แบบง่ายสุดสำหรับ PoC
export function RefreshPoller({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const iv = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(iv)
  }, [router, intervalMs])

  return null
}
