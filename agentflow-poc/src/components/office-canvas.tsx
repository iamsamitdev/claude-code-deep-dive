'use client'

import { useEffect, useRef, useState } from 'react'
import type { OfficeHandle } from '@/lib/office/scene'
import { SLOT_COLORS } from '@/lib/office/scene'

interface AgentInfo { id: string; name: string; type: string; model: string; status: string; task: string }

export function OfficeCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<OfficeHandle | null>(null)
  const latestRef = useRef<AgentInfo[]>([])
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [selected, setSelected] = useState<AgentInfo | null>(null)
  const [ready, setReady] = useState(false)

  // mount ฉาก 3D (import แบบ dynamic เพื่อให้ three โหลดฝั่ง client เท่านั้น)
  useEffect(() => {
    let disposed = false
    let handle: OfficeHandle | null = null
    void (async () => {
      const { createOfficeScene } = await import('@/lib/office/scene')
      if (disposed || !mountRef.current) return
      handle = createOfficeScene(mountRef.current, (id) => {
        const found = latestRef.current.find((a) => a.id === id)
        if (found) setSelected(found)
      })
      handleRef.current = handle
      setReady(true)
    })()
    return () => { disposed = true; handle?.dispose(); handleRef.current = null }
  }, [])

  // poll สถานะทีมจริงจากไฟล์ Agent Teams (ผ่าน /api/office-state) แล้วป้อนให้ฉาก
  useEffect(() => {
    let alive = true
    async function poll() {
      try {
        const res = await fetch('/api/office-state', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { agents: AgentInfo[] }
        if (!alive) return
        latestRef.current = data.agents
        setAgents(data.agents)
        handleRef.current?.update(data.agents.map((a) => ({ id: a.id, status: a.status, task: a.task })))
        setSelected((s) => (s ? data.agents.find((a) => a.id === s.id) ?? s : s))
      } catch {}
    }
    void poll()
    const iv = setInterval(poll, 2500)
    return () => { alive = false; clearInterval(iv) }
  }, [])

  const workingCount = agents.filter((a) => a.status === 'working').length

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />
      {!ready && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">กำลังโหลดห้อง 3D...</div>}

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl border bg-background/80 px-4 py-3 text-sm backdrop-blur">
        <div className="font-semibold">ห้อง 3D — ลากเพื่อหมุน</div>
        <div className="text-xs text-muted-foreground">สมาชิกทีมเดินทำงานแบบเรียลไทม์ · คลิกตัวเพื่อดูรายละเอียด</div>
      </div>

      {/* แผงสถานะเอเจนต์ (มุมขวาบน - จากดีไซน์ Design3D) + popup รายละเอียด */}
      <div className="absolute right-4 top-4 flex w-64 flex-col gap-3">
        <div className="rounded-xl border bg-background/85 p-3 shadow-lg backdrop-blur">
          <div className="mb-2 flex items-center justify-between px-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">เอเจนต์</span>
            <span className={workingCount > 0 ? 'text-xs font-bold text-green-600' : 'text-xs font-bold text-muted-foreground'}>
              {workingCount} ทำงาน
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {agents.length === 0 && <span className="px-1.5 text-xs text-muted-foreground">ยังไม่พบทีม</span>}
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="flex items-center justify-between rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: SLOT_COLORS[a.id] ?? '#888888' }} />
                  <span className="max-w-32 truncate text-sm font-medium">{a.name}</span>
                </span>
                <span className={a.status === 'working' ? 'text-xs font-medium text-green-600' : 'text-xs text-muted-foreground'}>
                  {a.status === 'working' ? 'กำลังทำงาน' : 'ว่าง'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="rounded-xl border bg-background/90 p-4 text-sm shadow-lg backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="font-bold">{selected.name}</span>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{selected.type} · ทีม {selected.model}</div>
            <div className="mt-2">สถานะ: <span className={selected.status === 'working' ? 'text-green-600 font-medium' : 'text-muted-foreground'}>{selected.status === 'working' ? 'กำลังทำงาน' : 'ว่าง'}</span></div>
            {selected.task && <div className="mt-1 text-xs text-muted-foreground line-clamp-3">งานล่าสุด: {selected.task}</div>}
          </div>
        )}
      </div>

      {/* แถบเลือกเอเจนต์ (ด้านล่างกลางจอ - จากดีไซน์ Design3D) */}
      {agents.length > 0 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-start gap-3 rounded-2xl border bg-background/85 px-5 py-3 shadow-lg backdrop-blur">
          {agents.map((a) => {
            const color = SLOT_COLORS[a.id] ?? '#888888'
            const active = selected?.id === a.id
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="flex w-14 flex-col items-center gap-1"
                title={a.status === 'working' ? `${a.name} · กำลังทำงาน` : `${a.name} · ว่าง`}
              >
                <span
                  className={
                    'flex size-10 items-center justify-center rounded-full border-2 bg-background text-sm font-bold transition-transform ' +
                    (active ? 'scale-110' : 'hover:scale-105')
                  }
                  style={{
                    borderColor: color,
                    color,
                    boxShadow: a.status === 'working' ? `0 0 12px ${color}` : undefined
                  }}
                >
                  {a.name.charAt(0).toUpperCase()}
                </span>
                <span className={'w-14 truncate text-center text-[10px] font-medium ' + (active ? 'text-foreground' : 'text-muted-foreground')}>
                  {a.name}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
