import { NextResponse } from 'next/server'
import { getTeamState } from '@/lib/teams/reader'

export const dynamic = 'force-dynamic'

// ตัวละครในฉาก 3D (พอร์ตจาก Design3D) มี slot ตายตัว 6 ตัว
// map สมาชิกทีมจริงเข้า slot ตามลำดับ: lead → 'main', teammates → ที่เหลือ
const SCENE_SLOTS = ['main', 'research', 'code', 'content', 'data', 'ops'] as const

// ส่งสถานะทีม Agent Teams ให้ฉาก 3D - อ่านจากไฟล์ ไม่มี database ไม่มี API key
export async function GET() {
  const state = await getTeamState()

  const agents = state.members.slice(0, SCENE_SLOTS.length).map((m, i) => ({
    id: SCENE_SLOTS[i],
    name: m.name,
    type: m.role === 'lead' ? 'LEAD' : 'TEAMMATE',
    model: state.teamName ?? '-',
    status: m.status,
    task: m.currentTask ?? ''
  }))

  return NextResponse.json({ team: state.teamName, agents })
}
