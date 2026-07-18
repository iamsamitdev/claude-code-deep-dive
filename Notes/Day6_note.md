# หลักสูตร Claude Code มือโปร: ดำน้ำลึกสู่ Production — วันที่ 6 (Bonus Module)

## สร้าง Mission Control ให้ทีม AI ด้วย Claude Code Agent Teams (AgentFlow)

**รูปแบบ:** อบรมออนไลน์ (สอนสด) ผ่าน Zoom Meeting
**ระยะเวลาโดยประมาณ:** 3 ชั่วโมง
**วิทยากร:** อาจารย์สามิตร โกยม | IT Genius Engineering Co., Ltd.

> **หมายเหตุ:** วันที่ 6 เป็น **Bonus Module** ต่อยอดจากหลักสูตรหลัก 5 วัน หลังจากที่เราพา StockApp ขึ้น production จริงในวันที่ 5 แล้ว วันนี้เราจะยกระดับวิธีทำงานกับ AI ไปอีกขั้น จากการมี "ผู้ช่วย" ไปสู่การมี "ทีม AI" ที่ทำงานขนานกันจริง และสร้างจอเฝ้าดูทีมนั้นแบบเรียลไทม์

---

## บทนำ

ตลอดหลักสูตรหลัก 5 วัน เราสอนให้ Claude Code มีทีม **Sub-agents** เฉพาะทาง (code-reviewer, test-writer, security-auditor) คอยช่วยงานตอนพัฒนา วันที่ 6 นี้จะก้าวไปอีกขั้น: ใช้ฟีเจอร์ **Agent Teams** ของ Claude Code สร้าง "ทีม AI ที่ทำงานขนานกันจริง" แล้วสร้าง **AgentFlow Mission Control** เว็บแอปที่เฝ้าดูทีมนั้นแบบเรียลไทม์ ทั้ง dashboard และ **ห้องทำงาน 3D แบบ isometric pixel-art** ที่พอร์ตมาจากดีไซน์ต้นแบบในโฟลเดอร์ `Design3D/` ของอาจารย์

วันนี้เราจะทำ 5 เรื่องใหญ่:

1. **เข้าใจความต่าง Sub-agents vs Agent Teams** และเกณฑ์เลือกใช้ให้เหมาะกับงาน
2. **เปิดใช้ Agent Teams** (ฟีเจอร์ experimental) และคุมทีมด้วยคีย์ลัด + delegate mode
3. **สำรวจไฟล์สถานะทีม** ที่ Agent Teams เขียนลงดิสก์ ซึ่งเป็นแหล่งข้อมูลของ Mission Control
4. **ชี้ Mission Control เข้าทีมจริง** และเห็นตัวละคร 3D ขยับตามสถานะงานจริง
5. **ต่อ Hooks** ให้เหตุการณ์ "งานเสร็จ / คนว่าง" ไหลเข้า dashboard อัตโนมัติ

**จุดขายสำคัญของเวอร์ชันนี้: ไม่ต้องซื้อ API แยก**

| | เวอร์ชันเดิม (Agent SDK) | เวอร์ชันนี้ (Agent Teams) |
|---|---|---|
| ตัวรัน agent | โค้ดเราเรียก Anthropic API เอง | Claude Code รันให้ทั้งหมด |
| ค่าใช้จ่าย | ต้องมี `ANTHROPIC_API_KEY` จ่ายตาม token | คิดโควตาจาก **subscription (Pro/Max)** ที่มีอยู่แล้ว |
| ฐานข้อมูล | PostgreSQL + Prisma | ไม่ต้องมี อ่านไฟล์สถานะทีมจากดิสก์ |
| บทบาทของเว็บแอป | เป็นทั้งตัวรันและตัวแสดงผล | เป็น "จอเฝ้าดู" (read-only) อย่างเดียว |

> โค้ดเวอร์ชัน Agent SDK เดิมถูกย้ายไปเก็บใน `agentflow-poc/_trash/` เพื่ออ้างอิง ไม่ใช้ในการสอนแล้ว

สไตล์ของวันนี้ยังคงเป็น **Vibe Coding** เหมือน 5 วันที่ผ่านมา คุณไม่ได้พิมพ์โค้ดหรือ config เอง แต่ **สั่ง Claude Code ด้วย prompt** แล้วทำหน้าที่ **ตรวจสอบ (review)** ผลลัพธ์ทุกครั้ง

---

## แนวคิดหลัก: Sub-agents vs Agent Teams

เรารู้จัก Sub-agents จากวันที่ 3 แล้ว Agent Teams คือ "ญาติที่โตกว่า" ต้องแยกให้ชัดก่อนลงมือ เพราะทั้งราคาและวิธีใช้ต่างกันมาก

| มิติ | Sub-agents (วันที่ 3) | Agent Teams (Bonus นี้) |
|---|---|---|
| **คืออะไร** | ผู้ช่วยที่ถูก spawn ภายใน session เดียว | หลาย Claude Code session ทำงานร่วมกันเป็นทีม |
| **การสื่อสาร** | รายงานกลับหา main agent ทางเดียว | teammates **คุยกันเองได้** ผ่าน inbox ไม่ต้องผ่าน lead |
| **Context** | แยก context ต่อ sub-agent | แต่ละ teammate คือ session เต็มตัว มี context ของตัวเอง |
| **Task list** | ไม่มี task list กลาง | มี **shared task list** ที่ทุกคนหยิบงาน/อัปเดตร่วมกัน |
| **การทำงาน** | เหมาะกับงาน sequential ที่รายงานกลับ | เหมาะกับงาน **parallel** ที่ต้องแลกเปลี่ยน/ถกเถียงกัน |
| **ต้นทุน token** | ประมาณ 4-7 เท่าของ session เดี่ยว | ประมาณ **15 เท่า** ของ session เดี่ยว แพงกว่ามาก |
| **สถานะฟีเจอร์** | GA ใช้งานปกติ | **Experimental** ต้องเปิด flag เอง |

> **Key Concept:** Agent Teams เก็บสถานะทีมเป็น **ไฟล์ JSON บนดิสก์** (task list, inbox ข้อความ, config ทีม) นี่คือหัวใจของ Bonus นี้ เพราะแปลว่าเว็บแอปของเราแค่ "อ่านไฟล์" ก็เห็นทุกอย่างที่ทีมทำ โดยไม่ต้องเรียก API แม้แต่ครั้งเดียว

### เลือกใช้อะไรเมื่อไร

- ใช้ **Sub-agents** เมื่อ: งานมีลำดับชัดเจน, ต้องการผลกลับมาประกอบคำตอบเดียว, ประหยัดโควตา
- ใช้ **Agent Teams** เมื่อ: งานแบ่งขนานได้จริง (รีวิว + เขียน test + เขียนเอกสาร พร้อมกัน), อยากให้สมาชิกแลกเปลี่ยนข้อมูล/แย้งกันเองได้

---

## ข้อกำหนดเบื้องต้นก่อนเริ่ม

### สิ่งที่ต้องมี

| รายการ | รายละเอียด |
|---|---|
| **Claude subscription** | Pro หรือ Max — Agent Teams คิดโควตาจาก subscription โดยตรง |
| **Claude Code** | เวอร์ชันล่าสุด (Agent Teams เป็นฟีเจอร์ experimental) |
| **Node.js** | LTS 20.x ขึ้นไป + pnpm 9.x ขึ้นไป |
| **โปรเจกต์ประกอบ** | `agentflow-poc` (Mission Control), `stock-app` (สนามให้ทีมทำงาน), `Design3D/` (ต้นแบบ UI) |
| **API Key** | **ไม่ต้องมี** |

> **Stack ของ agentflow-poc:** Next.js 16 · TypeScript · Tailwind v4 + shadcn/ui · Three.js (Office 3D จากดีไซน์ `Design3D/`)

### ⚠️ เช็คก่อนเริ่ม: อย่าให้เผลอวิ่งเข้า API billing

ถ้าเครื่องมี `ANTHROPIC_API_KEY` ตั้งค้างไว้ใน environment, Claude Code จะคิดเงินผ่าน API แทน subscription ให้ตรวจและปิดก่อน:

```powershell
# PowerShell — ตรวจว่ามี key ค้างไหม
echo $env:ANTHROPIC_API_KEY

# ถ้ามี ให้ลบออกจาก session ปัจจุบัน (และไปลบใน System Environment Variables ให้ถาวร)
Remove-Item Env:ANTHROPIC_API_KEY
```

### Quota Awareness (สำคัญกว่า Cost Awareness เดิม)

Agent Teams ไม่มีบิลแยก แต่ **กินโควตา subscription เร็วมาก** (ประมาณ 15 เท่าของ session เดี่ยว) จึงต้องวางแผนการใช้ในคลาสให้ดี:

- ใช้ทีมเล็ก: **lead + teammates 2-3 คน** พอสำหรับการเรียน
- แบ่งขอบเขตไฟล์ของแต่ละ teammate ให้ชัด ลดการคุยวนซ้ำซึ่งเปลืองโควตา
- ใช้ **delegate mode** (Shift+Tab) ให้ lead ทำหน้าที่ประสานอย่างเดียว ไม่ลงมือเขียนโค้ดเอง
- ในคลาสเปิดทีมครั้งละ 1 ทีม และปิดทีม (shutdown) เมื่อจบ workshop ทุกครั้ง
- เช็คโควตาคงเหลือได้จากหน้า usage ของบัญชี Claude

---

## สถาปัตยกรรม AgentFlow เวอร์ชัน Agent Teams

```
Claude Code (เทอร์มินัล)                        agentflow-poc (เบราว์เซอร์)
┌───────────────────────────┐                  ┌────────────────────────────┐
│ Agent Team: stock-squad   │    เขียนไฟล์     │ Mission Control (/)        │
│  team-lead (ประสานงาน)    │ ───────────────► │  Roster · Task List        │
│  ├─ reviewer              │   ~/.claude/     │  Inbox · Activity          │
│  ├─ tester                │    teams/…       ├────────────────────────────┤
│  └─ doc-writer            │    tasks/…       │ Office 3D (/office)        │
│                           │                  │  ตัวละคร pixel เดินทำงาน  │
│ (โควตาจาก Pro/Max)        │   อ่านอย่างเดียว │  (ดีไซน์จาก Design3D)      │
└───────────────────────────┘                  └────────────────────────────┘
         │                                                ▲
         │ hooks: TeammateIdle / TaskCompleted            │
         └──► ~/.claude/agentflow/activity.jsonl ─────────┘
```

> **Key Concept:** ทิศทางของข้อมูลเป็น **ทางเดียว** เสมอ Claude Code (ฝั่งซ้าย) เป็นฝ่าย "เขียน" สถานะทีมลงไฟล์ ส่วน agentflow-poc (ฝั่งขวา) เป็นฝ่าย "อ่านอย่างเดียว" เว็บแอปไม่เคยสั่งงานทีมหรือเรียก API เลย นี่คือเหตุผลที่มันปลอดภัยและต้นทุนแทบเป็นศูนย์

### ไฟล์สถานะที่ Agent Teams สร้างให้ (แหล่งข้อมูลของเรา)

| ตำแหน่ง | เก็บอะไร |
|---|---|
| `~/.claude/teams/{ชื่อทีม}/config.json` | ข้อมูลทีมและรายชื่อสมาชิก |
| `~/.claude/teams/{ชื่อทีม}/inboxes/*.json` | กล่องข้อความของสมาชิกแต่ละคน (คุยกันเองผ่านตรงนี้) |
| `~/.claude/tasks/{ชื่อทีม}/*.json` | shared task list — งานละ 1 ไฟล์ JSON |

> **หมายเหตุ (Windows):** `~/.claude` คือ `C:\Users\<ชื่อคุณ>\.claude`

### ส่วนที่คงไว้จากดีไซน์เดิม: Office 3D จาก Design3D

หน้า `/office` ของ agentflow-poc คือฉาก isometric pixel-art ที่ **พอร์ตมาจาก `Design3D/office-pixel-scene.js`** ของอาจารย์ ตัวละคร 6 ตัวเดินเล่นเมื่อว่างและเดินไปโต๊ะเมื่อมีงาน เวอร์ชันนี้เราคงฉากเดิมไว้ทั้งหมด แค่เปลี่ยนแหล่งข้อมูลจาก database เป็นไฟล์สถานะทีมจริง โดย map สมาชิกทีมเข้า slot ตัวละคร: lead ได้ตัว `main` ตรงกลาง ส่วน teammates ไล่เข้า slot ที่เหลือตามลำดับ

---

## การเปิดใช้ Agent Teams

Agent Teams เป็นฟีเจอร์ **experimental ปิดเป็นค่าเริ่มต้น** เปิดด้วย env variable โดยเพิ่มใน `~/.claude/settings.json` (สร้างไฟล์ถ้ายังไม่มี):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

จากนั้น **รีสตาร์ท Claude Code** (จำหลักการจากเรื่อง sub-agents ในวันที่ 3: การตั้งค่าที่อ่านตอนเริ่ม session ต้องเปิด session ใหม่จึงจะมีผล)

### คีย์ลัดที่ต้องรู้

| คีย์ | ทำอะไร |
|---|---|
| `Shift+↑` / `Shift+↓` | สลับดูหน้าจอของ teammate แต่ละคน |
| `Enter` | เข้าไปดู session ของ teammate ที่เลือก (พิมพ์คุยกับมันตรง ๆ ได้) |
| `Escape` | ขัดจังหวะ teammate ที่กำลังทำงาน |
| `Shift+Tab` | เปิด **delegate mode** จำกัดให้ lead ใช้เครื่องมือประสานงานเท่านั้น |
| `Ctrl+T` | เปิด/ปิด task list ของทีม |

### Display mode และข้อจำกัดบน Windows

- **in-process (ค่าเริ่มต้น):** ทุก teammate อยู่ในเทอร์มินัลเดียว สลับดูด้วย Shift+↑/↓ — **ใช้ได้ทุก OS รวมถึง Windows**
- **split panes:** แยก pane ต่อ teammate เห็นพร้อมกันทุกคน — ต้องใช้ tmux หรือ iTerm2 (macOS/Linux เท่านั้น)

> ในคลาสนี้เราใช้ Windows จึงใช้ in-process mode และนี่คือเหตุผลที่ Mission Control ของเรามีคุณค่า: มันคือ "split panes เวอร์ชันเว็บ" ที่เห็นทั้งทีมพร้อมกันบนเบราว์เซอร์ แถมเป็นห้อง 3D

---

## Module 6.1: Phase 0 — รู้จัก agentflow-poc + รันโหมดเดโม

**เป้าหมาย:** เห็น Mission Control ทำงานทันทีด้วยข้อมูลตัวอย่าง ก่อนต่อทีมจริง (ประหยัดโควตา ไม่ต้องเปิดทีมจริงตั้งแต่แรก)

### 🛠️ ขั้นตอนที่ 1: สำรวจโปรเจกต์ด้วย Claude Code

เปิด Claude Code ในโฟลเดอร์ `agentflow-poc` แล้วสั่ง:

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
อ่าน @CLAUDE.md และ @README.md แล้วสรุปสั้น ๆ:
1. โปรเจกต์นี้อ่านข้อมูลทีมจากที่ไหน (path อะไรบ้าง)
2. env variable อะไรใช้ override ได้บ้าง
3. หน้า /office เอาดีไซน์มาจากไหน และ map สมาชิกทีมเข้าตัวละครอย่างไร
อย่าเพิ่งแก้ไฟล์ใด ๆ
```

**🤖 Claude Code จะทำอะไร:** อ่านเอกสารแล้วสรุป: อ่านจาก `~/.claude` (teams/, tasks/), override ด้วย `AGENTFLOW_DATA_DIR` + `AGENTFLOW_TEAM`, ฉาก 3D พอร์ตจาก `Design3D/office-pixel-scene.js` มี slot ตัวละคร 6 ตัว

**✅ Checkpoint ตรวจสอบ:**

- Claude ตอบครบ 3 ข้อโดยไม่แก้ไฟล์
- เข้าใจตรงกันว่าแอปนี้ **ไม่เรียก API และไม่มี database**

> **Key Concept:** การเปิดวันด้วย prompt แบบ "อ่านแล้วสรุป อย่าเพิ่งแก้" เป็นเทคนิคที่ใช้ทุกวันในหลักสูตร — ให้ Claude สร้างความเข้าใจร่วมกับเราก่อน แล้วค่อยสั่งทำทีละงาน ลดโอกาสที่มันจะลงมือแก้ผิดจุด

---

### 🛠️ ขั้นตอนที่ 2: รันโหมดเดโม (sample-data)

```bash
cd agentflow-poc
pnpm install
cp .env.example .env    # ค่าเริ่มต้นชี้ AGENTFLOW_DATA_DIR=./sample-data อยู่แล้ว
pnpm dev
```

**✅ Checkpoint ตรวจสอบ:**

- เปิด http://localhost:3000 เห็นทีมตัวอย่าง `stock-squad`: สมาชิก 4 คน, task 5 งาน (เสร็จ 1 / กำลังทำ 2 / รอ 2), inbox มีข้อความ, Activity มี 3 เหตุการณ์
- เปิด http://localhost:3000/office เห็นห้อง 3D — ตัวละครที่มีงาน `in_progress` (tester, doc-writer) เดินไปโต๊ะทำงาน ตัวที่ว่างเดินเล่น
- คลิกตัวละครแล้วเห็น popup ชื่อ + สถานะ + งานปัจจุบัน

**📄 คำสั่ง/ไฟล์อ้างอิง — โครงสร้าง env ที่เกี่ยวข้อง:**

```bash
# .env (โหมดเดโม)
AGENTFLOW_DATA_DIR=./sample-data   # ชี้ไปยังข้อมูลจำลองในโปรเจกต์
AGENTFLOW_TEAM=stock-squad         # เลือกทีมที่จะแสดง
```

> **Key Concept (ทำไมต้องมี sample-data):** เพราะ Agent Teams เป็นฟีเจอร์ experimental โครงสร้างไฟล์จริงอาจต่างกันเล็กน้อยตามเวอร์ชัน การมีข้อมูลจำลองทำให้เราพัฒนา/ทดสอบ UI ได้โดยไม่ต้องเปิดทีมจริง (ประหยัดโควตาด้วย) นี่คือเทคนิค **fixture data** ที่ใช้กันจริงในงาน production

---

## Module 6.2: Phase 1 — เปิดทีมจริงครั้งแรก + สำรวจไฟล์สถานะ

**เป้าหมาย:** สร้าง Agent Team จริงให้ทำงานกับ stock-app แล้วสำรวจว่าไฟล์สถานะหน้าตาเป็นอย่างไร

### 🛠️ ขั้นตอนที่ 3: เปิด flag แล้ว spawn ทีมแรก

เปิด Claude Code ใน **stock-app** (หลังตั้งค่า `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` และรีสตาร์ทแล้ว):

**💬 Prompt ที่ใช้สั่ง Claude Code (lead):**

```
สร้างทีมชื่อ stock-squad ช่วยกันยกระดับคุณภาพโปรเจกต์นี้
spawn teammate 3 คน แบ่งขอบเขตไฟล์ชัดเจน ห้ามแก้ไฟล์ทับกัน:

1. reviewer  - รีวิวโค้ดใน app/actions/ และ lib/ เท่านั้น
   รายงานปัญหาเป็น list พร้อมระดับความรุนแรง (ไม่แก้โค้ดเอง)
2. tester    - เขียน unit test ให้ lib/product-status.ts และ lib/validations.ts
   (สร้างไฟล์ใหม่ใน tests/ เท่านั้น)
3. doc-writer - ตรวจ README.md กับ docs/spec.md ให้ตรงโค้ดจริง
   (แก้เฉพาะไฟล์ .md)

สร้าง task list กลางแบ่งงานให้ชัด ให้แต่ละคน mark งานเสร็จเมื่อจบ
และส่งข้อความบอกเพื่อนร่วมทีมถ้าพบสิ่งที่กระทบงานคนอื่น
```

จากนั้นกด **Shift+Tab เข้า delegate mode** เพื่อให้ lead โฟกัสประสานงานอย่างเดียว

**🤖 Claude Code จะทำอะไร:** สร้างทีม, spawn teammates 3 session, สร้าง shared task list แล้วมอบหมายงาน — teammates เริ่มทำงานขนานกันทันที

**✅ Checkpoint ตรวจสอบ:**

- กด `Ctrl+T` เห็น task list ของทีม มีงานแบ่งตามคน
- กด `Shift+↓` สลับไปดูหน้าจอ reviewer / tester / doc-writer ได้
- แต่ละ teammate ทำงานในขอบเขตไฟล์ของตัวเอง ไม่ก้าวก่ายกัน

> ⚠️ **จุดสำคัญ:** การแบ่ง **ขอบเขตไฟล์ต่อคนให้ชัด** คือหัวใจของการ spawn ทีม ถ้าสองคนได้รับมอบให้แก้ไฟล์เดียวกัน จะเกิดการเขียนทับกัน (file conflict) ซึ่งเป็นปัญหาอันดับหนึ่งของ Agent Teams

---

### 🛠️ ขั้นตอนที่ 4: สำรวจไฟล์สถานะทีม (ขั้นที่สำคัญที่สุดของ Bonus นี้)

ระหว่างทีมทำงาน เปิดเทอร์มินัลอีกหน้าต่าง (PowerShell) แล้วส่องเข้าไปดูไฟล์สถานะที่ Agent Teams เขียนให้:

```powershell
# ดูว่ามีทีมอะไรบ้าง
ls ~\.claude\teams\
ls ~\.claude\teams\stock-squad\

# ดู task list กลาง — งานละ 1 ไฟล์
ls ~\.claude\tasks\stock-squad\
cat ~\.claude\tasks\stock-squad\1.json

# ดู inbox ที่สมาชิกใช้คุยกัน
ls ~\.claude\teams\stock-squad\inboxes\
cat ~\.claude\teams\stock-squad\inboxes\reviewer.json
```

**✅ Checkpoint ตรวจสอบ:**

- เห็นไฟล์ task เป็น JSON มี field ประมาณ id / subject หรือ title / status / owner
- เห็นข้อความใน inbox เมื่อสมาชิกส่งหากัน
- **จดไว้:** field จริงที่เห็นชื่ออะไรบ้าง — ถ้าต่างจากที่ `reader.ts` ของเรารองรับ เดี๋ยว Phase 2 จะได้รู้ว่าต้องปรับตรงไหน

> **Key Concept (Spec ของจริงคือไฟล์จริง):** กับฟีเจอร์ experimental อย่าเชื่อเอกสารหรือโค้ดตัวอย่างเกินไฟล์ที่เห็นตรงหน้า `reader.ts` ของเราจึงเขียนแบบ **defensive parsing**: ลองหลายชื่อ field (subject/title, owner/assignee), เจอ JSON พังก็ข้าม ไม่ throw นี่คือวิธีเขียนโค้ดต่อกับระบบที่ยังไม่นิ่ง

---

## Module 6.3: Phase 2 — ชี้ Mission Control เข้าทีมจริง

**เป้าหมาย:** เปลี่ยนจาก sample-data เป็นข้อมูลทีมจริง แล้วเห็นตัวละคร 3D ขยับตามทีมจริง

### 🛠️ ขั้นตอนที่ 5: สลับแหล่งข้อมูล

แก้ `.env` ของ agentflow-poc:

```bash
# ว่าง = กลับไปอ่าน ~/.claude (ของจริง)
AGENTFLOW_DATA_DIR=
# ระบุชื่อทีม (หรือเว้นว่างให้เลือกทีมล่าสุดอัตโนมัติ)
AGENTFLOW_TEAM=stock-squad
```

รีสตาร์ท `pnpm dev`

**✅ Checkpoint ตรวจสอบ:**

- Dashboard แสดงทีม `stock-squad` จริง: roster ตรงกับ teammates ที่ spawn, task list ตรงกับ `Ctrl+T` ใน Claude Code
- ตัวเลขอัปเดตเองทุก 3 วินาที (RefreshPoller) โดยไม่ต้อง refresh หน้า
- เปิด `/office` — ตัวละครที่กำลังถืองาน `in_progress` เดินเข้าโต๊ะ พองานเสร็จ (สถานะเปลี่ยน) ตัวละครกลับไปเดินเล่น

---

### 🛠️ ขั้นตอนที่ 6: ถ้าข้อมูลไม่ขึ้น — debug ตามแนวทางหลักสูตร

**💬 Prompt ที่ใช้สั่ง Claude Code (ใน agentflow-poc):**

```
Mission Control ไม่แสดงข้อมูลทีมจริง ช่วย debug ให้หน่อย:

สภาพแวดล้อม: AGENTFLOW_DATA_DIR ว่าง, AGENTFLOW_TEAM=stock-squad
สิ่งที่เห็น: การ์ด "ยังไม่พบทีม" ทั้งที่ ls ~\.claude\teams\stock-squad มีไฟล์อยู่จริง

นี่คือตัวอย่างไฟล์ task จริง 1 ไฟล์:
<วางเนื้อหา JSON ที่ cat มาจากขั้นตอนที่ 4>

ดู @src/lib/teams/reader.ts แล้วหาว่า parse field ไหนไม่ตรงกับไฟล์จริง
แก้ reader ให้รองรับ (เพิ่มชื่อ field ใหม่เข้า fallback เดิม อย่าลบของเก่า)
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** เทียบ JSON จริงกับ parser แล้วเพิ่ม field mapping ที่ขาด เช่น ชื่อ status ที่ต่างออกไป

**✅ Checkpoint ตรวจสอบ:**

- แก้แบบ "เพิ่ม fallback" ไม่ใช่เขียนทับ mapping เดิม (sample-data ต้องยังใช้ได้)
- ข้อมูลจริงขึ้นครบทั้ง dashboard และ office 3D

> **Key Concept:** นี่คือ prompt debug แบบ **3 ส่วน** ที่ฝึกในวันที่ 2 — บอก **สภาพแวดล้อม** + **สิ่งที่เห็น** + **หลักฐาน (ไฟล์จริง)** ครบในครั้งเดียว ทำให้ Claude หาสาเหตุได้แม่นยำโดยไม่ต้องเดา และการสั่งว่า "เพิ่ม fallback อย่าลบของเก่า" คือการปกป้อง regression ของ sample-data ไปพร้อมกัน

---

## Module 6.4: Phase 3 — ต่อ Hooks ให้ Activity ไหลเข้า Mission Control

**เป้าหมาย:** ใช้ hooks ของ Agent Teams ดันเหตุการณ์ "งานเสร็จ / คนว่าง" เข้า dashboard

Agent Teams มี hook เฉพาะ 2 ตัว (ต่อยอดจากเรื่อง Hooks ในวันที่ 3):

| Hook | ยิงเมื่อไร | ความสามารถพิเศษ |
|---|---|---|
| `TeammateIdle` | teammate กำลังจะว่างงาน | exit code 2 = สั่งงานต่อ ไม่ให้ว่าง |
| `TaskCompleted` | งานกำลังจะถูก mark เสร็จ | exit code 2 = ไม่ให้ผ่าน (quality gate) |

ใน Bonus นี้เราใช้แบบ **สังเกตการณ์** (exit 0 เสมอ): แค่ append เหตุการณ์ลง log ให้ Mission Control อ่าน

### 🛠️ ขั้นตอนที่ 7: ติดตั้ง hook script

โปรเจกต์เตรียมไว้แล้วที่ `agentflow-poc/examples/hooks/`:

- `agentflow-log.mjs` — อ่าน payload จาก stdin แล้ว append ลง `~/.claude/agentflow/activity.jsonl`
- `settings.snippet.json` — ตัวอย่าง config

**💬 Prompt ที่ใช้สั่ง Claude Code (ใน stock-app):**

```
เพิ่ม hooks ใน .claude/settings.json ของโปรเจกต์นี้ (merge กับของเดิม อย่าลบ)
โดยอ้างอิงตัวอย่างจาก @<path ไป agentflow-poc>/examples/hooks/settings.snippet.json:

- TeammateIdle และ TaskCompleted → รัน agentflow-log.mjs พร้อมชื่อ event เป็น argument
- แก้ path ของ script ให้ชี้ตำแหน่งจริงในเครื่องนี้
```

**🤖 Claude Code จะทำอะไร:** merge config hooks เข้ากับ `.claude/settings.json` เดิม โดยแก้ path ของ `agentflow-log.mjs` ให้ชี้ตำแหน่งจริง — เราตรวจก่อนว่าไม่ลบ hooks เดิมที่มีอยู่

**✅ Checkpoint ตรวจสอบ:**

- รีสตาร์ท Claude Code แล้ว spawn ทีมสั้น ๆ อีกครั้ง (งานเล็ก ๆ 2 tasks พอ — ประหยัดโควตา)
- เมื่องานเสร็จ เห็นบรรทัดใหม่ใน `~\.claude\agentflow\activity.jsonl`
- การ์ด **Activity (จาก Hooks)** ใน Mission Control มีเหตุการณ์ TaskCompleted / TeammateIdle ไหลเข้ามาเอง

---

### 🛠️ แนวคิดต่อยอด: Quality Gate ด้วย exit code 2

ยังไม่ทำในคลาส แต่ให้เห็นภาพพลังจริงของ hook คู่นี้:

```
TaskCompleted hook:
  รัน pnpm exec tsc --noEmit + pnpm test
  ├── ผ่านทั้งคู่ → exit 0 → งานถูก mark เสร็จ
  └── มีอะไรพัง → exit 2 + ข้อความ feedback
        → Claude Code ไม่ยอมให้ mark เสร็จ, teammate ต้องกลับไปแก้เอง
```

> **Key Concept:** นี่คือ **AI Quality Gate** แบบเดียวกับที่ฝึกในวันที่ 3 แต่บังคับใช้กับ **ทีม AI ทั้งทีมอัตโนมัติ** — งานจะถูก mark เสร็จได้ก็ต่อเมื่อผ่าน typecheck + test เท่านั้น ไม่มีมนุษย์ต้องคอยจ้ำจี้

---

## Module 6.5: Phase 4 (โจทย์ท้าทาย) — ปรับแต่ง Mission Control

เลือกทำตามเวลา ทุกข้อสั่งผ่าน Claude Code ใน agentflow-poc ตามแนว Vibe Coding:

1. **ตั้งชื่อตัวละครตามทีมจริง:** ฉากตอนนี้ map สมาชิกเข้า slot ตามลำดับ ลองสั่งให้ป้ายชื่อเหนือหัวตัวละคร (ใน `src/lib/office/scene.ts`) แสดงชื่อ teammate จริงแทนชื่อ slot
2. **เพิ่ม slot ที่ 7:** ทีมใหญ่กว่า 6 คนจะล้น ลองเพิ่มโต๊ะและตัวละครอีกตัวในฉาก (ดู pattern จาก `AGENTS` array)
3. **การ์ดสรุปเวลา:** เพิ่ม "งานเสร็จไปกี่งานใน 10 นาทีล่าสุด" โดยใช้ timestamp จาก activity.jsonl
4. **แจ้งเตือนงานค้าง:** ถ้ามี task `in_progress` นานผิดปกติ (teammate อาจลืม mark เสร็จ — ข้อจำกัดที่พบจริงของฟีเจอร์นี้) ให้ขึ้น badge เตือนใน dashboard

**✅ Checkpoint ทุกข้อ:** `pnpm typecheck` ผ่าน, ไม่มี semicolon, ห้ามแตะ `_trash/`

---

## Workshop ท้ายวัน: เปิดทีมจริง + เฝ้าดูผ่าน Mission Control

### โจทย์ Workshop

เปิด Agent Team จริงให้ยกระดับคุณภาพ stock-app แล้วเฝ้าดูทีมทำงานผ่าน Mission Control ทั้ง dashboard และห้อง 3D จากนั้นต่อ hooks ให้ Activity ไหลเข้า และปิดทีมอย่างถูกวิธีเมื่อจบ ใช้ Vibe Coding ตลอด — สั่ง Claude Code แล้ว review ทุกครั้ง

### 🛠️ Workshop ขั้นตอนที่ W1: รันโหมดเดโมให้ขึ้นก่อน

**💬 Prompt / คำสั่งที่ใช้:**

```
cd agentflow-poc
pnpm install
cp .env.example .env
pnpm dev
```

**✅ Checkpoint:** http://localhost:3000 เห็นทีม `stock-squad` ตัวอย่าง, `/office` เห็นตัวละคร 3D ขยับตามสถานะ

---

### 🛠️ Workshop ขั้นตอนที่ W2: เปิดทีมจริงใน stock-app

**💬 Prompt ที่ใช้สั่ง Claude Code (ใน stock-app หลังเปิด flag + รีสตาร์ท):**

```
สร้างทีมชื่อ stock-squad spawn teammate 3 คน (reviewer, tester, doc-writer)
แบ่งขอบเขตไฟล์ชัดเจน ห้ามแก้ไฟล์ทับกัน สร้าง task list กลาง
ให้แต่ละคน mark งานเสร็จเมื่อจบ และคุยกันผ่าน inbox ถ้ากระทบงานคนอื่น
```

จากนั้นกด `Shift+Tab` เข้า delegate mode

**✅ Checkpoint:** `Ctrl+T` เห็น task list, `Shift+↓` สลับดู teammate ได้, ไฟล์สถานะโผล่ใน `~\.claude\teams\stock-squad\` และ `~\.claude\tasks\stock-squad\`

---

### 🛠️ Workshop ขั้นตอนที่ W3: ชี้ Mission Control เข้าทีมจริง

**💬 Prompt / คำสั่งที่ใช้:**

```
แก้ .env ของ agentflow-poc:
AGENTFLOW_DATA_DIR=            (เว้นว่าง = อ่าน ~/.claude ของจริง)
AGENTFLOW_TEAM=stock-squad
แล้วรีสตาร์ท pnpm dev
```

ถ้าข้อมูลไม่ขึ้น ใช้ prompt debug 3 ส่วนจากขั้นตอนที่ 6 (วางไฟล์ JSON จริงให้ Claude ดู แล้วให้แก้ `reader.ts` แบบเพิ่ม fallback)

**✅ Checkpoint:** dashboard แสดงทีมจริง อัปเดตทุก 3 วินาที, `/office` ตัวละครขยับตามสถานะงานจริง

---

### 🛠️ Workshop ขั้นตอนที่ W4: ต่อ Hooks + ปิดทีมให้ถูกวิธี

**💬 Prompt ที่ใช้สั่ง Claude Code (ใน stock-app):**

```
เพิ่ม hooks TeammateIdle และ TaskCompleted ใน .claude/settings.json (merge อย่าลบของเดิม)
ให้รัน agentflow-log.mjs จาก agentflow-poc/examples/hooks/ พร้อมชื่อ event เป็น argument
แก้ path ให้ตรงเครื่องนี้
```

รีสตาร์ท Claude Code แล้ว spawn ทีมสั้น ๆ (2 tasks) เพื่อทดสอบ เมื่อจบให้ **shutdown ทีม** ทุกครั้ง

**✅ Checkpoint:** การ์ด Activity ใน Mission Control มีเหตุการณ์ไหลเข้าเอง, ปิดทีมเรียบร้อยเพื่อไม่ให้เปลืองโควตา

### เกณฑ์ที่ถือว่า Workshop สำเร็จ

| เกณฑ์ | วิธีตรวจสอบ |
|---|---|
| โหมดเดโมขึ้นได้ | เปิด `localhost:3000` + `/office` เห็นทีมตัวอย่าง |
| เปิดทีมจริงได้ | `Ctrl+T` เห็น task list, ไฟล์สถานะโผล่ใน `~/.claude` |
| Mission Control เห็นทีมจริง | dashboard + office 3D แสดงข้อมูลทีมจริง อัปเดตทุก 3 วินาที |
| Hooks ทำงาน | มีบรรทัดใหม่ใน `activity.jsonl` และการ์ด Activity ไหลเข้า |
| ปิดทีมเรียบร้อย | shutdown ทีมสำเร็จ ไม่มี teammate ค้าง |

---

## ข้อจำกัดของ Agent Teams ที่ต้องรู้ (ณ ปัจจุบัน)

ฟีเจอร์ยัง experimental ข้อจำกัดเหล่านี้เจอได้จริงในคลาส:

- **`/resume` และ `/rewind` ไม่คืนชีพ teammates** — resume session ของ lead แล้ว teammates เดิมหายไป (lead อาจพยายามส่งข้อความหาคนที่ไม่อยู่แล้ว) ถ้า session หลุดให้ตั้งทีมใหม่
- **Task status ค้าง** — บางครั้ง teammate ทำงานเสร็จแต่ลืม mark เสร็จ ทำให้งานที่ depend กันไม่เดิน เห็นได้ชัดจาก Mission Control แล้วเข้าไปสะกิดผ่าน lead ได้
- **ปิดทีมช้า** — teammate จะทำ request/tool call ปัจจุบันให้จบก่อนถึงจะ shutdown
- **Windows ไม่มี split panes** — ใช้ in-process + Mission Control ของเราแทน
- **โควตาหมดเร็ว** — ทีม 4 คนกินประมาณ 15 เท่าของ session เดี่ยว วางแผนการใช้ในคลาสให้ดี

### Best Practices สรุปสั้น

1. เปิด **delegate mode** ให้ lead เสมอ — lead ที่ลงมือเองคือสาเหตุอันดับหนึ่งของไฟล์ชนกัน
2. spawn พร้อม **ขอบเขตไฟล์ชัดเจน** ต่อ teammate — ห้ามสองคนแก้ไฟล์เดียวกัน
3. ทีมเล็กพอดีงาน — เพิ่มคนเมื่องานขนานกันได้จริงเท่านั้น
4. งาน sequential ใช้ Sub-agents ธรรมดา ถูกกว่าและนิ่งกว่า

> **Key Concept:** Agent Teams ไม่ได้มาแทน Sub-agents แต่เป็นเครื่องมืออีกชิ้นในกล่อง เลือกใช้ให้ตรงกับรูปทรงของงาน — งานขนานที่ต้องถกเถียงกันใช้ Team, งานเรียงลำดับที่รายงานกลับใช้ Sub-agent

---

## ของหวาน: Self-study ต่อยอด

### 1. Split panes บน macOS/Linux

ถ้ามีเครื่อง mac: ติดตั้ง tmux แล้วรัน Claude Code ใน tmux — spawn ทีมแล้วแต่ละ teammate จะได้ pane ของตัวเอง เห็นทั้งทีมพิมพ์งานพร้อมกันในเทอร์มินัลเดียว (ประสบการณ์เดียวกับ Mission Control แต่อยู่ใน terminal)

### 2. Quality Gate เต็มรูปแบบ

ทำ Module 6.4 (แนวคิด exit code 2) จริง: เขียน `TaskCompleted` hook ที่รัน typecheck + test แล้ว exit 2 พร้อม feedback เมื่อพัง วัดผลว่าทีม AI ส่งงานผ่าน gate ได้กี่เปอร์เซ็นต์โดยไม่ต้องมีมนุษย์คุม

### 3. เฝ้าหลายทีมพร้อมกัน

`reader.ts` ตอนนี้อ่านทีมเดียว ลองขยายเป็น multi-team: dropdown เลือกทีม, สรุปทุกทีมในหน้าเดียว ได้ฝึก React state + API design เพิ่ม

### 4. เสียงแจ้งเตือน + TTS

เมื่อ `TaskCompleted` เข้ามา ให้ Mission Control เล่นเสียง หรือใช้ Web Speech API อ่านชื่องานที่เสร็จ สนุกและได้ฝึก browser API (แนวเดียวกับ Voice Meeting ที่เคยวางไว้ในเวอร์ชันเดิม แต่ทำได้ฟรี)

---

## สรุปวันที่ 6 (Bonus Module)

**สิ่งที่เรียนรู้และทำได้แล้ว:**

- เข้าใจความต่าง **Sub-agents vs Agent Teams** และเกณฑ์เลือกใช้ (sequential vs parallel, ต้นทุนโควตา 4-7x vs 15x)
- เปิดใช้ Agent Teams ผ่าน `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` และคุมทีมด้วยคีย์ลัด + delegate mode
- ใช้ **subscription (Pro/Max) แทน API key** และรู้วิธีกันไม่ให้เผลอวิ่งเข้า API billing
- อ่านสถานะทีมจากไฟล์จริง: `teams/{team}/` (config + inboxes) และ `tasks/{team}/` (shared task list)
- สร้าง **Mission Control** ที่อ่านไฟล์เหล่านั้นแบบ defensive parsing แล้วแสดงผลทั้ง dashboard และห้อง 3D จากดีไซน์ Design3D
- ต่อ **hooks TeammateIdle / TaskCompleted** เข้า activity log และเข้าใจแนวคิด quality gate ด้วย exit code 2
- รู้ข้อจำกัดจริงของฟีเจอร์ experimental และวิธีทำงานร่วมกับมัน (fixture data, defensive parsing, สำรวจไฟล์จริงก่อนเขียนโค้ด)

### ภาพรวมทั้งหลักสูตร (Vibe → Production → AI Team)

```
วันที่ 1: Vibe Coding & Foundation
  Claude Code เป็น AI agent ใน terminal สร้าง StockApp ด้วย prompt

วันที่ 2: Database, API & Business Logic
  Prisma Schema, Route Handlers, Server Actions, CRUD + validate + test

วันที่ 3: Sub-agents, MCP & Hooks
  ผู้ช่วยเฉพาะทาง, เชื่อม MCP, automation ด้วย Hooks

วันที่ 4: Containerize & CI Pipeline
  Dockerfile, Docker Compose, GitHub Actions CI → ghcr.io

วันที่ 5: Deploy to Production
  VPS Ubuntu, Nginx, Let's Encrypt HTTPS, CD อัตโนมัติ

วันที่ 6 (Bonus): Agent Teams & Mission Control (วันนี้)
  ทีม AI ทำงานขนานจริง อ่านสถานะจากไฟล์ สร้างจอเฝ้าดู 3D
  ต่อ hooks ให้ activity ไหลเข้า ทั้งหมดด้วย subscription ไม่ต้องมี API key
```

**หัวใจที่เอาไปใช้ได้ทันที:** ระบบ AI ที่ดีไม่จำเป็นต้องเริ่มจากการเรียก API เอง บางครั้ง "การอ่านสถานะของเครื่องมือที่มีอยู่แล้วมาแสดงให้เห็นภาพ" ก็สร้างมูลค่ามหาศาล ด้วยต้นทุนที่แทบเป็นศูนย์

---

## แหล่งอ้างอิง

### Agent Teams & Claude Code

- [Agent Teams (ทางการ)](https://code.claude.com/docs/en/agent-teams) — แนวคิด, การเปิดใช้, คีย์ลัด, ข้อจำกัด
- [Claude Code + Pro/Max plan](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) — การคิดโควตาจาก subscription
- [Hooks (ทางการ)](https://code.claude.com/docs/en/hooks) — TeammateIdle, TaskCompleted และ exit code 2
- [Sub-agents (ทางการ)](https://code.claude.com/docs/en/sub-agents) — เทียบกับ Agent Teams

### โปรเจกต์และดีไซน์ประกอบ

- **โปรเจกต์ Mission Control:** `C:\TrainingDocument\Claude Code Deep Dive\agentflow-poc` — โค้ดอ้างอิงทั้งหมดของ Bonus นี้
- **ดีไซน์ต้นแบบ Office 3D:** `C:\TrainingDocument\Claude Code Deep Dive\Design3D` — `office-pixel-scene.js` + `Office Pixel 3D.dc.html`
- **โน้ตต้นฉบับ Bonus:** `C:\TrainingDocument\Claude Code Deep Dive\Notes\Bonus_AgentFlow_note.md`

### Stack ที่เกี่ยวข้อง

- [Next.js Documentation](https://nextjs.org/docs) — Next.js 16
- [Three.js Documentation](https://threejs.org/docs/) — ฉาก 3D ใน `/office`
- [Tailwind CSS](https://tailwindcss.com/docs) + [shadcn/ui](https://ui.shadcn.com/) — UI ของ dashboard

---

> **คำส่งท้ายจากอาจารย์สามิตร:**
> เวอร์ชันแรกของ AgentFlow เราสร้าง agent runtime เองด้วย Agent SDK ซึ่งสอนแก่นของ Agent Loop ได้ดี แต่มีกำแพงคือ API key และค่าใช้จ่าย เวอร์ชัน Agent Teams นี้พลิกมุม: ให้ Claude Code เป็น runtime ที่เราจ่ายด้วย subscription อยู่แล้ว ส่วนเราสร้างสิ่งที่มองไม่เห็นให้มองเห็น ทีม AI ที่เคยซ่อนอยู่ในเทอร์มินัลกลายเป็นออฟฟิศ 3D ที่ทุกคนในห้องดูแล้วเข้าใจใน 5 วินาที
>
> บทเรียนที่ลึกที่สุดของ Bonus นี้: **เครื่องมือที่เก็บสถานะเป็นไฟล์เปิดโอกาสให้เราต่อยอดได้เสมอ** อ่านมัน เฝ้ามัน แล้วสร้างประสบการณ์ใหม่ครอบมัน

---

*หลักสูตร Claude Code มือโปร: ดำน้ำลึกสู่ Production — วันที่ 6 (Bonus Module) — IT Genius Engineering Co., Ltd.*
*อาจารย์สามิตร โกยม | samitkoyom@gmail.com*
