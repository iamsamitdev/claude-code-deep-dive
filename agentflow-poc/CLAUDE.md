# AgentFlow — Context สำหรับ Claude Code

โปรเจกต์ตัวอย่าง (Bonus) ของหลักสูตร "Claude Code มือโปร: ดำน้ำลึกสู่ Production"
**Mission Control** สำหรับเฝ้าดู **Claude Code Agent Teams** แบบเรียลไทม์
ไม่เรียก API ตรง ไม่มี API key ไม่มี database - อ่านสถานะทีมจากไฟล์บนดิสก์เท่านั้น
(ทีมจริงรันใน Claude Code และคิดโควตาจาก subscription Pro/Max)

## Tech Stack
- Next.js 16 (App Router) + TypeScript + React 19
- Tailwind CSS v4 + shadcn/ui
- Three.js (npm `three`) - ฉาก Office 3D พอร์ตจาก `Design3D/office-pixel-scene.js`
- ไม่มี Prisma / ไม่มี @anthropic-ai/sdk (ของเดิมย้ายไป `_trash/` แล้ว)

## กฎการเขียนโค้ด
- ห้ามใส่ semicolon (;) ในโค้ด TS/JS
- single quote, Server Components เป็นค่าเริ่มต้น, comment ภาษาไทย
- ห้ามใช้ em dash ในเอกสาร ใช้ dash ธรรมดา

## สถาปัตยกรรม (สำคัญ)
- **แหล่งข้อมูลเดียวคือไฟล์ของ Agent Teams** ใน data dir (ค่าเริ่มต้น `~/.claude`):
  - `teams/{team}/config.json` + `teams/{team}/inboxes/*.json` - สมาชิก + ข้อความ
  - `tasks/{team}/*.json` - task list กลางของทีม
  - `agentflow/activity.jsonl` - เหตุการณ์จาก hooks (TeammateIdle / TaskCompleted)
- ตัวอ่านทั้งหมดอยู่ที่ `src/lib/teams/reader.ts` - **parse แบบ defensive เสมอ**
  เพราะ Agent Teams เป็นฟีเจอร์ experimental โครงสร้างไฟล์อาจเปลี่ยน (field ไหนไม่เจอให้ fallback ห้าม throw)
- env override: `AGENTFLOW_DATA_DIR` (ชี้ `./sample-data` เพื่อเดโม), `AGENTFLOW_TEAM` (เลือกทีม)
- หน้า `/` = Mission Control dashboard (RSC + `RefreshPoller` รีเฟรชทุก 3 วิ)
- หน้า `/office` = ฉาก 3D อ่านจาก `GET /api/office-state` (poll ทุก 2.5 วิ)
  - ฉากมี slot ตัวละครตายตัว 6 ตัว (`main, research, code, content, data, ops`)
    map สมาชิกทีมจริงเข้า slot ตามลำดับ lead ก่อนเสมอ

## โครงสร้าง
- `src/lib/teams/reader.ts` - อ่าน/parse สถานะทีม (จุดเดียวที่แตะไฟล์)
- `src/app/page.tsx` - Mission Control dashboard
- `src/app/api/office-state/route.ts` - แปลงสถานะทีม → รูปแบบที่ฉาก 3D ใช้
- `src/lib/office/scene.ts` + `src/components/office-canvas.tsx` - ฉาก 3D (พอร์ตจาก Design3D)
- `sample-data/` - ข้อมูลทีมจำลองสำหรับเดโม UI โดยไม่ต้องรันทีมจริง
- `examples/hooks/` - hook script + settings snippet สำหรับต่อ activity log
- `_trash/` - โค้ดเวอร์ชัน Agent SDK เดิม (เก็บไว้อ้างอิง ไม่ใช้แล้ว)

## ข้อควรระวัง
- อย่า import อะไรจาก `_trash/`
- reader ต้องไม่ throw แม้ไฟล์หาย/JSON พัง - คืนค่าว่างแทน
- ฝั่ง UI ห้าม fetch ไฟล์ระบบตรง ๆ ต้องผ่าน reader (ฝั่ง server) เท่านั้น
