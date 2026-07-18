import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

// ===== Agent Teams state reader =====
// อ่านสถานะทีมของ Claude Code Agent Teams ตรงจากไฟล์บนดิสก์ (ไม่ต้องมี API key)
// - รายชื่อทีม/สมาชิก:  {dataDir}/teams/{team}/config.json + inboxes/
// - task list กลาง:     {dataDir}/tasks/{team}/*.json
// - activity จาก hooks: {dataDir}/agentflow/activity.jsonl (เขียนโดย hook ของเรา)
//
// หมายเหตุ: Agent Teams เป็นฟีเจอร์ experimental - โครงสร้างไฟล์อาจเปลี่ยนได้
// โค้ดนี้จึง parse แบบ defensive: field ไหนไม่เจอให้ fallback แทนที่จะพัง

export interface TeamMember {
  id: string
  name: string
  role: 'lead' | 'teammate'
  status: 'working' | 'idle'
  currentTask?: string
}

export interface TeamTask {
  id: string
  subject: string
  status: 'pending' | 'in_progress' | 'completed' | 'unknown'
  owner?: string
  description?: string
}

export interface TeamMessage {
  from: string
  to?: string
  text: string
  timestamp?: string
}

export interface ActivityEvent {
  time?: string
  event: string
  detail?: string
}

export interface TeamState {
  teamName: string | null
  dataDir: string
  members: TeamMember[]
  tasks: TeamTask[]
  messages: TeamMessage[]
  activity: ActivityEvent[]
}

// โฟลเดอร์ข้อมูล — ค่าเริ่มต้นคือ ~/.claude, override ได้ด้วย AGENTFLOW_DATA_DIR
// (ชี้ไป ./sample-data เพื่อเดโมโดยไม่ต้องรันทีมจริง)
function resolveDataDir(): string {
  const fromEnv = process.env.AGENTFLOW_DATA_DIR?.trim()
  if (fromEnv) return path.resolve(process.cwd(), fromEnv)
  return path.join(os.homedir(), '.claude')
}

async function readJson(file: string): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

async function listDir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir)
  } catch {
    return []
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined
}

// เลือกทีม: ใช้ AGENTFLOW_TEAM ถ้าตั้งไว้ ไม่งั้นหยิบทีมที่แก้ไขล่าสุด
async function resolveTeamName(dataDir: string): Promise<string | null> {
  const fromEnv = process.env.AGENTFLOW_TEAM?.trim()
  if (fromEnv) return fromEnv

  const teamsDir = path.join(dataDir, 'teams')
  const names = await listDir(teamsDir)
  if (names.length === 0) return null

  const withTime = await Promise.all(
    names.map(async (n) => {
      try {
        const st = await fs.stat(path.join(teamsDir, n))
        return { n, m: st.mtimeMs, dir: st.isDirectory() }
      } catch {
        return { n, m: 0, dir: false }
      }
    })
  )
  const dirs = withTime.filter((x) => x.dir).sort((a, b) => b.m - a.m)
  return dirs[0]?.n ?? null
}

// normalize สถานะ task จากหลายรูปแบบที่อาจพบ
function normalizeTaskStatus(v: unknown): TeamTask['status'] {
  const s = asString(v)?.toLowerCase() ?? ''
  if (s.includes('progress') || s === 'active' || s === 'working') return 'in_progress'
  if (s.includes('complete') || s === 'done' || s === 'resolved') return 'completed'
  if (s === 'pending' || s === 'queued' || s === 'todo' || s === 'open') return 'pending'
  return s ? 'unknown' : 'pending'
}

// อ่าน task ทั้งหมดของทีมจาก {dataDir}/tasks/{team}/*.json
async function readTasks(dataDir: string, team: string): Promise<TeamTask[]> {
  const dir = path.join(dataDir, 'tasks', team)
  const files = (await listDir(dir)).filter((f) => f.endsWith('.json'))

  const tasks = await Promise.all(
    files.map(async (f): Promise<TeamTask | null> => {
      const j = asRecord(await readJson(path.join(dir, f)))
      if (!j) return null
      const description = asString(j.description) ?? asString(j.body)
      return {
        id: asString(j.id) ?? f.replace(/\.json$/, ''),
        subject:
          asString(j.subject) ??
          asString(j.title) ??
          description?.slice(0, 80) ??
          f,
        status: normalizeTaskStatus(j.status ?? j.state),
        owner: asString(j.owner) ?? asString(j.assignee) ?? asString(j.assignedTo),
        description
      }
    })
  )
  return tasks
    .filter((t): t is TeamTask => t !== null)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
}

// อ่านข้อความจาก inbox ของสมาชิกทุกคน
async function readMessages(dataDir: string, team: string): Promise<TeamMessage[]> {
  const dir = path.join(dataDir, 'teams', team, 'inboxes')
  const files = (await listDir(dir)).filter((f) => f.endsWith('.json'))
  const all: TeamMessage[] = []

  for (const f of files) {
    const owner = f.replace(/\.json$/, '')
    const j = await readJson(path.join(dir, f))
    const items = Array.isArray(j)
      ? j
      : Array.isArray(asRecord(j)?.messages)
        ? (asRecord(j)?.messages as unknown[])
        : []
    for (const it of items) {
      const m = asRecord(it)
      if (!m) continue
      const text =
        asString(m.text) ?? asString(m.summary) ?? asString(m.content) ?? asString(m.message)
      if (!text) continue
      all.push({
        from: asString(m.from) ?? asString(m.sender) ?? 'unknown',
        to: asString(m.to) ?? owner,
        text,
        timestamp: asString(m.timestamp) ?? asString(m.time) ?? asString(m.createdAt)
      })
    }
  }
  // เรียงใหม่ล่าสุดขึ้นก่อน (ถ้าไม่มี timestamp ให้คงลำดับเดิม)
  return all
    .sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''))
    .slice(0, 30)
}

// อ่าน activity log ที่ hook (TeammateIdle / TaskCompleted) ของเรา append ไว้
async function readActivity(dataDir: string): Promise<ActivityEvent[]> {
  const file = path.join(dataDir, 'agentflow', 'activity.jsonl')
  try {
    const raw = await fs.readFile(file, 'utf8')
    const lines = raw.split('\n').filter((l) => l.trim())
    const events = lines
      .map((l): ActivityEvent | null => {
        try {
          const j = asRecord(JSON.parse(l))
          if (!j) return null
          return {
            time: asString(j.time),
            event: asString(j.event) ?? 'event',
            detail: asString(j.detail)
          }
        } catch {
          return null
        }
      })
      .filter((e): e is ActivityEvent => e !== null)
    return events.slice(-20).reverse()
  } catch {
    return []
  }
}

// อ่านสมาชิกทีมจาก config.json (ถ้าไม่มี ให้เดาจากชื่อไฟล์ inbox)
async function readMembers(
  dataDir: string,
  team: string,
  tasks: TeamTask[]
): Promise<TeamMember[]> {
  const cfg = asRecord(await readJson(path.join(dataDir, 'teams', team, 'config.json')))
  const names: { name: string; role: 'lead' | 'teammate' }[] = []

  const rawMembers = cfg?.members ?? cfg?.teammates ?? cfg?.agents
  if (Array.isArray(rawMembers)) {
    for (const it of rawMembers) {
      const m = asRecord(it)
      const name = m ? (asString(m.name) ?? asString(m.id)) : asString(it)
      if (!name) continue
      const roleStr = m ? (asString(m.role)?.toLowerCase() ?? '') : ''
      names.push({ name, role: roleStr.includes('lead') ? 'lead' : 'teammate' })
    }
  }

  // fallback: ใช้ชื่อไฟล์ inbox เป็นรายชื่อสมาชิก
  if (names.length === 0) {
    const inboxFiles = await listDir(path.join(dataDir, 'teams', team, 'inboxes'))
    for (const f of inboxFiles.filter((x) => x.endsWith('.json'))) {
      const name = f.replace(/\.json$/, '')
      names.push({ name, role: name.toLowerCase().includes('lead') ? 'lead' : 'teammate' })
    }
  }

  // ถ้ายังไม่เจอ lead เลย ให้ตัวแรกเป็น lead
  if (names.length > 0 && !names.some((n) => n.role === 'lead')) names[0].role = 'lead'
  // lead ขึ้นก่อนเสมอ
  names.sort((a, b) => (a.role === 'lead' ? -1 : b.role === 'lead' ? 1 : 0))

  return names.map((n) => {
    const mine = tasks.find(
      (t) => t.status === 'in_progress' && t.owner?.toLowerCase() === n.name.toLowerCase()
    )
    return {
      id: n.name,
      name: n.name,
      role: n.role,
      status: mine ? 'working' : 'idle',
      currentTask: mine?.subject
    }
  })
}

// จุดเรียกหลัก — คืนสถานะทีมทั้งหมดในครั้งเดียว
export async function getTeamState(): Promise<TeamState> {
  const dataDir = resolveDataDir()
  const teamName = await resolveTeamName(dataDir)

  if (!teamName) {
    return { teamName: null, dataDir, members: [], tasks: [], messages: [], activity: [] }
  }

  const tasks = await readTasks(dataDir, teamName)
  const [members, messages, activity] = await Promise.all([
    readMembers(dataDir, teamName, tasks),
    readMessages(dataDir, teamName),
    readActivity(dataDir)
  ])

  return { teamName, dataDir, members, tasks, messages, activity }
}
