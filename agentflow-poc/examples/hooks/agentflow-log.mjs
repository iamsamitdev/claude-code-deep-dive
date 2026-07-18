#!/usr/bin/env node
// Hook script สำหรับ Agent Teams — append เหตุการณ์ลง activity log ของ Mission Control
// ใช้กับ hook event: TeammateIdle และ TaskCompleted (ต้องเปิด CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
//
// Claude Code ส่งข้อมูล hook เข้ามาทาง stdin เป็น JSON
// เราอ่านมา สรุปเป็นบรรทัดเดียว แล้ว append ลง ~/.claude/agentflow/activity.jsonl
// (Mission Control จะอ่านไฟล์นี้ไปแสดงในการ์ด Activity)

import { appendFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const eventName = process.argv[2] ?? 'UnknownEvent'

// อ่าน payload จาก stdin (ถ้าไม่มีก็ไม่เป็นไร — log แค่ชื่อ event)
let payload = {}
try {
  const raw = await new Promise((resolve) => {
    let buf = ''
    process.stdin.on('data', (d) => (buf += d))
    process.stdin.on('end', () => resolve(buf))
    setTimeout(() => resolve(buf), 500)
  })
  if (raw.trim()) payload = JSON.parse(raw)
} catch {
  // payload พังก็ข้าม — hook ห้ามทำให้ Claude Code สะดุด
}

const dir = join(homedir(), '.claude', 'agentflow')
mkdirSync(dir, { recursive: true })

const detailParts = []
if (payload.teammate_name) detailParts.push(String(payload.teammate_name))
if (payload.agent_name) detailParts.push(String(payload.agent_name))
if (payload.task_subject) detailParts.push(String(payload.task_subject))
if (payload.task_id) detailParts.push('#' + String(payload.task_id))

const line = JSON.stringify({
  time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  event: eventName,
  detail: detailParts.join(' · ') || undefined
})

appendFileSync(join(dir, 'activity.jsonl'), line + '\n', 'utf8')

// exit 0 เสมอ = ไม่ block การทำงานของทีม (ถ้าอยาก block ให้ใช้ exit code 2 — ดูโน้ต Bonus)
process.exit(0)
