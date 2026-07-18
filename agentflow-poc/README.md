# AgentFlow — Agent Teams Mission Control (Bonus)

โปรเจกต์สาธิตสำหรับ Bonus Module ของหลักสูตร Claude Code Deep Dive
**Mission Control สำหรับเฝ้าดูทีม Claude Code Agent Teams แบบเรียลไทม์** ผ่าน dashboard และห้องทำงาน 3D

> ⭐ จุดขายของเวอร์ชันนี้: **ไม่ต้องซื้อ API แยก** - ทีม AI รันผ่าน Claude Code
> ด้วยฟีเจอร์ Agent Teams ซึ่งคิดโควตาจาก subscription (Pro/Max) ที่มีอยู่แล้ว
> แอปนี้เป็นแค่ "จอเฝ้าดู" ที่อ่านสถานะทีมจากไฟล์บนดิสก์ - ไม่เรียก API ใด ๆ เลย

Stack: Next.js 16 · TypeScript · Tailwind v4 + shadcn/ui · Three.js (Office 3D จากดีไซน์ `Design3D/`)

## แนวคิด

```
Claude Code (เทอร์มินัล)                    agentflow-poc (เบราว์เซอร์)
┌─────────────────────────┐                ┌──────────────────────────┐
│ Agent Teams             │   เขียนไฟล์    │ Mission Control (/)      │
│  team-lead              │ ─────────────► │  Roster · Tasks · Inbox  │
│  ├─ reviewer            │  ~/.claude/    │  Activity (จาก hooks)    │
│  ├─ tester              │   teams/…      ├──────────────────────────┤
│  └─ doc-writer          │   tasks/…      │ Office 3D (/office)      │
│ (subscription Pro/Max)  │                │  ตัวละครขยับตามสถานะจริง │
└─────────────────────────┘   อ่านอย่างเดียว └──────────────────────────┘
```

## วิธีรัน (โหมดเดโม - ไม่ต้องมีทีมจริง)

```bash
pnpm install
cp .env.example .env      # ค่าเริ่มต้นชี้ AGENTFLOW_DATA_DIR=./sample-data อยู่แล้ว
pnpm dev
```

เปิด http://localhost:3000 จะเห็นทีมตัวอย่าง `stock-squad` (4 คน + task 5 งาน)
และ http://localhost:3000/office เห็นตัวละคร 3D ขยับตามสถานะ

## วิธีต่อกับทีมจริง

1. เปิดฟีเจอร์ (experimental) ใน `~/.claude/settings.json`:
   ```json
   { "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
   ```
2. เปิด Claude Code ในโปรเจกต์งานจริง (เช่น stock-app) แล้วสั่งตั้งทีม เช่น
   "สร้างทีมช่วยรีวิว + เขียน test + อัปเดตเอกสาร spawn teammate 3 คน..."
3. แก้ `.env` ของโปรเจกต์นี้: ลบหรือเว้นว่าง `AGENTFLOW_DATA_DIR` (จะกลับไปอ่าน `~/.claude`)
   และตั้ง `AGENTFLOW_TEAM=<ชื่อทีม>` ถ้ามีหลายทีม
4. รีสตาร์ท `pnpm dev` - dashboard จะแสดงทีมจริง อัปเดตทุก 3 วินาที
5. (ตัวเลือก) ติดตั้ง hooks `TeammateIdle` / `TaskCompleted` ตาม `examples/hooks/`
   เพื่อให้การ์ด Activity มีเหตุการณ์ไหลเข้ามา

## สิ่งที่สาธิต

- **อ่านสถานะ Agent Teams จากดิสก์** (`src/lib/teams/reader.ts`) - teams/, tasks/, inboxes
  แบบ defensive parsing เพราะฟีเจอร์ยัง experimental
- **Mission Control dashboard** - Team Roster, Shared Task List, Inbox, Activity จาก hooks
- **Office 3D** (`/office`) - ฉาก isometric pixel-art พอร์ตจาก `Design3D/office-pixel-scene.js`
  ตัวละครเดินไปโต๊ะเมื่อมีงาน in_progress และเดินเล่นเมื่อ idle
- **Hooks integration** (`examples/hooks/`) - TeammateIdle / TaskCompleted append ลง
  `~/.claude/agentflow/activity.jsonl`

## หมายเหตุ

- โค้ด TS ไม่มี semicolon ตาม convention ใน CLAUDE.md
- โค้ดเวอร์ชันเก่า (Agent SDK + Prisma เรียก API ตรง) ถูกย้ายไป `_trash/` เพื่ออ้างอิง
- บน Windows ทีมแสดงแบบ in-process ใน Claude Code (split panes ต้องใช้ tmux/iTerm2 บน macOS/Linux)
