import { Bot, ListChecks, MessageSquare, Activity, Crown, Terminal } from 'lucide-react'
import { getTeamState, type TeamTask } from '@/lib/teams/reader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RefreshPoller } from '@/components/dashboard/refresh-poller'

export const dynamic = 'force-dynamic'

const taskBadge: Record<TeamTask['status'], { label: string; variant: 'secondary' | 'warning' | 'success' }> = {
  pending: { label: 'รอคิว', variant: 'secondary' },
  in_progress: { label: 'กำลังทำ', variant: 'warning' },
  completed: { label: 'เสร็จ', variant: 'success' },
  unknown: { label: 'ไม่ทราบ', variant: 'secondary' }
}

const SPAWN_EXAMPLE = `สร้างทีมชื่อ stock-squad ช่วยกันยกระดับคุณภาพ stock-app
spawn teammate 3 คน แบ่งขอบเขตไฟล์ชัดเจน ห้ามแก้ไฟล์ทับกัน:
1. reviewer  - รีวิวโค้ดใน app/actions/ และ lib/
2. tester    - เขียน unit test ให้ lib/product-status.ts และ lib/validations.ts
3. doc-writer - อัปเดต README และ docs/spec.md ให้ตรงโค้ดจริง
สร้าง task list กลาง แล้วรายงานเมื่อแต่ละงานเสร็จ`

export default async function MissionControlPage() {
  const state = await getTeamState()
  const inProgress = state.tasks.filter((t) => t.status === 'in_progress').length
  const completed = state.tasks.filter((t) => t.status === 'completed').length

  const stats = [
    { label: 'สมาชิกทีม', value: String(state.members.length), sub: state.teamName ?? 'ยังไม่พบทีม', icon: Bot },
    { label: 'Tasks', value: `${inProgress} กำลังทำ`, sub: `${completed} เสร็จ / ${state.tasks.length} ทั้งหมด`, icon: ListChecks },
    { label: 'ข้อความ', value: String(state.messages.length), sub: 'ใน inbox ทีม', icon: MessageSquare },
    { label: 'Activity', value: String(state.activity.length), sub: 'จาก hooks', icon: Activity }
  ]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <RefreshPoller intervalMs={3000} />

      <header className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-xl">🛰️</div>
        <div>
          <h1 className="text-2xl font-bold">AgentFlow <span className="text-muted-foreground">· Mission Control</span></h1>
          <p className="text-sm text-muted-foreground">
            เฝ้าดูทีม Claude Code Agent Teams แบบเรียลไทม์ - อ่านจาก <code className="rounded bg-muted px-1">{state.dataDir}</code>
          </p>
        </div>
      </header>

      {!state.teamName && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col gap-2 pt-6 text-sm">
            <p className="font-semibold">ยังไม่พบทีม Agent Teams ในเครื่องนี้</p>
            <p className="text-muted-foreground">ทางเลือกที่ 1: ดูเดโมด้วยข้อมูลตัวอย่าง - ตั้งค่าใน .env แล้วรีสตาร์ท dev server</p>
            <pre className="rounded-md bg-muted p-2 text-xs">AGENTFLOW_DATA_DIR=./sample-data</pre>
            <p className="text-muted-foreground">ทางเลือกที่ 2: เปิดทีมจริงจาก Claude Code (ต้องเปิด experimental flag ก่อน) แล้วหน้านี้จะเจอทีมอัตโนมัติ</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><s.icon className="size-5" /></div>
              <div>
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label} · {s.sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Terminal className="size-4" /> สั่งงานทีมอย่างไร?</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground">
              Mission Control เป็นจอ <span className="font-medium text-foreground">read-only</span> - การสั่งงานทำผ่าน
              Claude Code ในเทอร์มินัล (คิดโควตาจาก subscription ไม่ใช้ API key)
            </p>
            <pre className="overflow-auto rounded-md bg-muted p-3 text-xs leading-5">{SPAWN_EXAMPLE}</pre>
            <div className="text-xs text-muted-foreground">
              คีย์ลัดใน Claude Code: <kbd className="rounded border px-1">Shift+↑/↓</kbd> สลับดู teammate ·{' '}
              <kbd className="rounded border px-1">Shift+Tab</kbd> delegate mode ·{' '}
              <kbd className="rounded border px-1">Ctrl+T</kbd> เปิด/ปิด task list
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Team Roster</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {state.members.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีสมาชิก</p>}
            {state.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="flex items-center gap-1.5 font-medium">
                    {m.role === 'lead' && <Crown className="size-3.5 text-amber-500" />}
                    {m.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.role === 'lead' ? 'Team Lead' : 'Teammate'}
                    {m.currentTask ? ` · ${m.currentTask}` : ''}
                  </div>
                </div>
                <Badge variant={m.status === 'working' ? 'warning' : 'secondary'}>
                  {m.status === 'working' ? 'Working' : 'Idle'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Shared Task List</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {state.tasks.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีงานในทีม</p>}
            {state.tasks.map((t) => {
              const b = taskBadge[t.status]
              return (
                <div key={t.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t.subject}</span>
                    <Badge variant={b.variant}>{b.label}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">#{t.id}{t.owner ? ` · ${t.owner}` : ' · ยังไม่มีเจ้าของ'}</div>
                  <Separator className="mt-1" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Inbox ล่าสุด</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {state.messages.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีข้อความระหว่างสมาชิก</p>}
              {state.messages.slice(0, 8).map((m, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{m.from}</span>
                  <span className="text-muted-foreground"> → {m.to ?? '-'}: </span>
                  <span className="text-muted-foreground">{m.text.length > 120 ? m.text.slice(0, 120) + '…' : m.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity (จาก Hooks)</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {state.activity.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  ยังไม่มีเหตุการณ์ - ติดตั้ง hook TeammateIdle / TaskCompleted ตาม examples/hooks/
                </p>
              )}
              {state.activity.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground">{e.time ?? '--:--'}</span>
                  <Badge variant={e.event === 'TaskCompleted' ? 'success' : 'secondary'}>{e.event}</Badge>
                  <span className="truncate text-muted-foreground">{e.detail}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
