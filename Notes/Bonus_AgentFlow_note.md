# Bonus Module: สร้าง Mission Control ให้ทีม AI ด้วย Claude Code Agent Teams (AgentFlow)

> **Bonus Module** - ต่อยอดจากหลักสูตร "Claude Code มือโปร: ดำน้ำลึกสู่ Production"
> **วิทยากร:** อาจารย์สามิตร โกยม | IT Genius Engineering Co., Ltd.
> **รูปแบบ:** อบรมออนไลน์ (สอนสด) ผ่าน Zoom Meeting
> **ระยะเวลาโดยประมาณ:** 3 ชั่วโมง

---

## บทนำ

ตลอดหลักสูตรหลักเราสอนให้ Claude Code มีทีม Sub-agents เฉพาะทาง (code-reviewer, test-writer, security-auditor) คอยช่วยงานตอนพัฒนา Bonus Module นี้จะก้าวไปอีกขั้น: ใช้ฟีเจอร์ **Agent Teams** ของ Claude Code สร้าง "ทีม AI ที่ทำงานขนานกันจริง" แล้วสร้าง **AgentFlow Mission Control** - เว็บแอปที่เฝ้าดูทีมนั้นแบบเรียลไทม์ ทั้ง dashboard และ**ห้องทำงาน 3D แบบ isometric pixel-art** ที่ออกแบบภายใต้ UI ต้นแบบจากโฟลเดอร์ `Design3D/` ของอาจารย์

**จุดขายสำคัญของเวอร์ชันนี้: ไม่ต้องซื้อ API แยก**

| | เวอร์ชันเดิม (Agent SDK) | เวอร์ชันนี้ (Agent Teams) |
|---|---|---|
| ตัวรัน agent | โค้ดเราเรียก Anthropic API เอง | Claude Code รันให้ทั้งหมด |
| ค่าใช้จ่าย | ต้องมี `ANTHROPIC_API_KEY` จ่ายตาม token | คิดโควตาจาก **subscription (Pro/Max)** ที่มีอยู่แล้ว |
| ฐานข้อมูล | PostgreSQL + Prisma | ไม่ต้องมี - อ่านไฟล์สถานะทีมจากดิสก์ |
| บทบาทของเว็บแอป | เป็นทั้งตัวรันและตัวแสดงผล | เป็น "จอเฝ้าดู" (read-only) อย่างเดียว |

> โค้ดเวอร์ชัน Agent SDK เดิมถูกย้ายไปเก็บใน `agentflow-poc/_trash/` เพื่ออ้างอิง ไม่ใช้ในการสอนแล้ว

---

## จุดเชื่อม: Sub-agents vs Agent Teams

เรารู้จัก Sub-agents จากวันที่ 3 แล้ว - Agent Teams คือญาติที่โตกว่า ต้องแยกให้ชัดก่อนลงมือ

| มิติ | Sub-agents (วันที่ 3) | Agent Teams (Bonus นี้) |
|---|---|---|
| **คืออะไร** | ผู้ช่วยที่ถูก spawn ภายใน session เดียว | หลาย Claude Code session ทำงานร่วมกันเป็นทีม |
| **การสื่อสาร** | รายงานกลับหา main agent ทางเดียว | teammates **คุยกันเองได้** ผ่าน inbox ไม่ต้องผ่าน lead |
| **Context** | แยก context ต่อ sub-agent | แต่ละ teammate คือ session เต็มตัว มี context ของตัวเอง |
| **Task list** | ไม่มี task list กลาง | มี **shared task list** ที่ทุกคนหยิบงาน/อัปเดตร่วมกัน |
| **การทำงาน** | เหมาะกับงาน sequential ที่รายงานกลับ | เหมาะกับงาน **parallel** ที่ต้องแลกเปลี่ยน/ถกเถียงกัน |
| **ต้นทุน token** | ประมาณ 4-7 เท่าของ session เดี่ยว | ประมาณ **15 เท่า** ของ session เดี่ยว - แพงกว่ามาก |
| **สถานะฟีเจอร์** | GA ใช้งานปกติ | **Experimental** - ต้องเปิด flag เอง |

> **Key Concept:** Agent Teams เก็บสถานะทีมเป็น**ไฟล์ JSON บนดิสก์** (task list, inbox ข้อความ, config ทีม) - นี่คือหัวใจของ Bonus นี้ เพราะแปลว่าเว็บแอปของเราแค่ "อ่านไฟล์" ก็เห็นทุกอย่างที่ทีมทำ โดยไม่ต้องเรียก API แม้แต่ครั้งเดียว

### เลือกใช้อะไรเมื่อไร

- ใช้ **Sub-agents** เมื่อ: งานมีลำดับชัดเจน, ต้องการผลกลับมาประกอบคำตอบเดียว, ประหยัดโควตา
- ใช้ **Agent Teams** เมื่อ: งานแบ่งขนานได้จริง (รีวิว + เขียน test + เขียนเอกสาร พร้อมกัน), อยากให้สมาชิกแลกเปลี่ยนข้อมูล/แย้งกันเองได้

---

## ข้อกำหนดเบื้องต้นก่อนเริ่ม

### สิ่งที่ต้องมี

| รายการ | รายละเอียด |
|---|---|
| **Claude subscription** | Pro หรือ Max - Agent Teams คิดโควตาจาก subscription โดยตรง |
| **Claude Code** | เวอร์ชันล่าสุด (Agent Teams เป็นฟีเจอร์ experimental) |
| **Node.js** | LTS 20.x ขึ้นไป + pnpm 9.x ขึ้นไป |
| **โปรเจกต์ประกอบ** | `agentflow-poc` (Mission Control), `stock-app` (สนามให้ทีมทำงาน), `Design3D/` (ต้นแบบ UI) |
| **API Key** | **ไม่ต้องมี** |

### ⚠️ เช็คก่อนเริ่ม: อย่าให้เผลอวิ่งเข้า API billing

ถ้าเครื่องมี `ANTHROPIC_API_KEY` ตั้งค้างไว้ใน environment, Claude Code จะคิดเงินผ่าน API แทน subscription ให้ตรวจและปิดก่อน:

```powershell
# PowerShell - ตรวจว่ามี key ค้างไหม
echo $env:ANTHROPIC_API_KEY

# ถ้ามี ให้ลบออกจาก session ปัจจุบัน (และไปลบใน System Environment Variables ให้ถาวร)
Remove-Item Env:ANTHROPIC_API_KEY
```

### Quota Awareness (สำคัญกว่า Cost Awareness เดิม)

Agent Teams ไม่มีบิลแยก แต่**กินโควตา subscription เร็วมาก** (ประมาณ 15 เท่าของ session เดี่ยว)

- ใช้ทีมเล็ก: **lead + teammates 2-3 คน** พอสำหรับการเรียน
- แบ่งขอบเขตไฟล์ของแต่ละ teammate ให้ชัด - ลดการคุยวนซ้ำซึ่งเปลืองโควตา
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

### ไฟล์สถานะที่ Agent Teams สร้างให้ (แหล่งข้อมูลของเรา)

| ตำแหน่ง | เก็บอะไร |
|---|---|
| `~/.claude/teams/{ชื่อทีม}/config.json` | ข้อมูลทีมและรายชื่อสมาชิก |
| `~/.claude/teams/{ชื่อทีม}/inboxes/*.json` | กล่องข้อความของสมาชิกแต่ละคน (คุยกันเองผ่านตรงนี้) |
| `~/.claude/tasks/{ชื่อทีม}/*.json` | shared task list - งานละ 1 ไฟล์ JSON |

> **หมายเหตุ (Windows):** `~/.claude` คือ `C:\Users\<ชื่อคุณ>\.claude`

### ส่วนที่คงไว้จากดีไซน์เดิม: Office 3D จาก Design3D

หน้า `/office` ของ agentflow-poc คือฉาก isometric pixel-art ที่**พอร์ตมาจาก `Design3D/office-pixel-scene.js`** ของอาจารย์ - ตัวละคร 6 ตัวเดินเล่นเมื่อว่างและเดินไปโต๊ะเมื่อมีงาน เวอร์ชันนี้เราคงฉากเดิมไว้ทั้งหมด แค่เปลี่ยนแหล่งข้อมูลจาก database เป็นไฟล์สถานะทีมจริง โดย map สมาชิกทีมเข้า slot ตัวละคร: lead ได้ตัว `main` ตรงกลาง ส่วน teammates ไล่เข้า slot ที่เหลือตามลำดับ

---

## การเปิดใช้ Agent Teams

Agent Teams เป็นฟีเจอร์ **experimental ปิดเป็นค่าเริ่มต้น** เปิดด้วย env variable:

เพิ่มใน `~/.claude/settings.json` (สร้างไฟล์ถ้ายังไม่มี):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

จากนั้น**รีสตาร์ท Claude Code** (จำหลักการจากเรื่อง sub-agents: การตั้งค่าที่อ่านตอนเริ่ม session ต้องเปิด session ใหม่)

### คีย์ลัดที่ต้องรู้

| คีย์ | ทำอะไร |
|---|---|
| `Shift+↑` / `Shift+↓` | สลับดูหน้าจอของ teammate แต่ละคน |
| `Enter` | เข้าไปดู session ของ teammate ที่เลือก (พิมพ์คุยกับมันตรง ๆ ได้) |
| `Escape` | ขัดจังหวะ teammate ที่กำลังทำงาน |
| `Shift+Tab` | เปิด **delegate mode** - จำกัดให้ lead ใช้เครื่องมือประสานงานเท่านั้น |
| `Ctrl+T` | เปิด/ปิด task list ของทีม |

### Display mode และข้อจำกัดบน Windows

- **in-process (ค่าเริ่มต้น):** ทุก teammate อยู่ในเทอร์มินัลเดียว สลับดูด้วย Shift+↑/↓ - **ใช้ได้ทุก OS รวมถึง Windows**
- **split panes:** แยก pane ต่อ teammate เห็นพร้อมกันทุกคน - ต้องใช้ tmux หรือ iTerm2 (macOS/Linux เท่านั้น)

> ในคลาสนี้เราใช้ Windows จึงใช้ in-process mode - และนี่คือเหตุผลที่ Mission Control ของเรามีคุณค่า: มันคือ "split panes เวอร์ชันเว็บ" ที่เห็นทั้งทีมพร้อมกันบนเบราว์เซอร์ แถมเป็นห้อง 3D

---

## Phase 0: รู้จัก agentflow-poc + รันโหมดเดโม

**เป้าหมาย:** เห็น Mission Control ทำงานทันทีด้วยข้อมูลตัวอย่าง ก่อนต่อทีมจริง

### 0.1 สำรวจโปรเจกต์ด้วย Claude Code

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

### 0.2 รันโหมดเดโม (sample-data)

```bash
cd agentflow-poc
pnpm install
cp .env.example .env    # ค่าเริ่มต้นชี้ AGENTFLOW_DATA_DIR=./sample-data อยู่แล้ว
pnpm dev
```

**✅ Checkpoint ตรวจสอบ:**
- เปิด http://localhost:3000 เห็นทีมตัวอย่าง `stock-squad`: สมาชิก 4 คน, task 5 งาน (เสร็จ 1 / กำลังทำ 2 / รอ 2), inbox มีข้อความ, Activity มี 3 เหตุการณ์
- เปิด http://localhost:3000/office เห็นห้อง 3D - ตัวละครที่มีงาน `in_progress` (tester, doc-writer) เดินไปโต๊ะทำงาน ตัวที่ว่างเดินเล่น
- คลิกตัวละครแล้วเห็น popup ชื่อ + สถานะ + งานปัจจุบัน

> **ทำไมต้องมี sample-data?** เพราะ Agent Teams เป็นฟีเจอร์ experimental - โครงสร้างไฟล์จริงอาจต่างกันเล็กน้อยตามเวอร์ชัน การมีข้อมูลจำลองทำให้เราพัฒนา/ทดสอบ UI ได้โดยไม่ต้องเปิดทีมจริง (ประหยัดโควตาด้วย) นี่คือเทคนิค fixture data ที่ใช้กันจริงในงาน production

---

## Phase 1: เปิดทีมจริงครั้งแรก + สำรวจไฟล์สถานะ

**เป้าหมาย:** สร้าง Agent Team จริงให้ทำงานกับ stock-app แล้วสำรวจว่าไฟล์สถานะหน้าตาเป็นอย่างไร

### 1.1 เปิด flag แล้ว spawn ทีมแรก

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

**🤖 Claude Code จะทำอะไร:** สร้างทีม, spawn teammates 3 session, สร้าง shared task list แล้วมอบหมายงาน - teammates เริ่มทำงานขนานกันทันที

**✅ Checkpoint ตรวจสอบ:**
- กด `Ctrl+T` เห็น task list ของทีม มีงานแบ่งตามคน
- กด `Shift+↓` สลับไปดูหน้าจอ reviewer / tester / doc-writer ได้
- แต่ละ teammate ทำงานในขอบเขตไฟล์ของตัวเอง ไม่ก้าวก่ายกัน

### 1.2 สำรวจไฟล์สถานะทีม (ขั้นที่สำคัญที่สุดของ Bonus นี้)

ระหว่างทีมทำงาน เปิดเทอร์มินัลอีกหน้าต่าง (PowerShell):

```powershell
# ดูว่ามีทีมอะไรบ้าง
ls ~\.claude\teams\
ls ~\.claude\teams\stock-squad\

# ดู task list กลาง - งานละ 1 ไฟล์
ls ~\.claude\tasks\stock-squad\
cat ~\.claude\tasks\stock-squad\1.json

# ดู inbox ที่สมาชิกใช้คุยกัน
ls ~\.claude\teams\stock-squad\inboxes\
cat ~\.claude\teams\stock-squad\inboxes\reviewer.json
```

**✅ Checkpoint ตรวจสอบ:**
- เห็นไฟล์ task เป็น JSON มี field ประมาณ id / subject หรือ title / status / owner
- เห็นข้อความใน inbox เมื่อสมาชิกส่งหากัน
- **จดไว้:** field จริงที่เห็นชื่ออะไรบ้าง - ถ้าต่างจากที่ `reader.ts` ของเรารองรับ เดี๋ยว Phase 2 จะได้รู้ว่าต้องปรับตรงไหน

> **Key Concept (Spec ของจริงคือไฟล์จริง):** กับฟีเจอร์ experimental อย่าเชื่อเอกสารหรือโค้ดตัวอย่างเกินไฟล์ที่เห็นตรงหน้า - `reader.ts` ของเราจึงเขียนแบบ **defensive parsing**: ลองหลายชื่อ field (subject/title, owner/assignee), เจอ JSON พังก็ข้าม ไม่ throw - นี่คือวิธีเขียนโค้ดต่อกับระบบที่ยังไม่นิ่ง

---

## Phase 2: ชี้ Mission Control เข้าทีมจริง

**เป้าหมาย:** เปลี่ยนจาก sample-data เป็นข้อมูลทีมจริง แล้วเห็นตัวละคร 3D ขยับตามทีมจริง

### 2.1 สลับแหล่งข้อมูล

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
- เปิด `/office` - ตัวละครที่กำลังถืองาน `in_progress` เดินเข้าโต๊ะ พองานเสร็จ (สถานะเปลี่ยน) ตัวละครกลับไปเดินเล่น

### 2.2 ถ้าข้อมูลไม่ขึ้น: debug ตามแนวทางหลักสูตร

**💬 Prompt ที่ใช้สั่ง Claude Code (ใน agentflow-poc):**

```
Mission Control ไม่แสดงข้อมูลทีมจริง ช่วย debug ให้หน่อย:

สภาพแวดล้อม: AGENTFLOW_DATA_DIR ว่าง, AGENTFLOW_TEAM=stock-squad
สิ่งที่เห็น: การ์ด "ยังไม่พบทีม" ทั้งที่ ls ~\.claude\teams\stock-squad มีไฟล์อยู่จริง

นี่คือตัวอย่างไฟล์ task จริง 1 ไฟล์:
<วางเนื้อหา JSON ที่ cat มาจาก Phase 1.2>

ดู @src/lib/teams/reader.ts แล้วหาว่า parse field ไหนไม่ตรงกับไฟล์จริง
แก้ reader ให้รองรับ (เพิ่มชื่อ field ใหม่เข้า fallback เดิม อย่าลบของเก่า)
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** เทียบ JSON จริงกับ parser แล้วเพิ่ม field mapping ที่ขาด เช่น ชื่อ status ที่ต่างออกไป

**✅ Checkpoint ตรวจสอบ:**
- แก้แบบ "เพิ่ม fallback" ไม่ใช่เขียนทับ mapping เดิม (sample-data ต้องยังใช้ได้)
- ข้อมูลจริงขึ้นครบทั้ง dashboard และ office 3D

> นี่คือ prompt debug แบบ 3 ส่วนที่ฝึกใน Day 2: บอกสภาพแวดล้อม + สิ่งที่เห็น + หลักฐาน (ไฟล์จริง) ครบในครั้งเดียว

---

## Phase 3: ต่อ Hooks ให้ Activity ไหลเข้า Mission Control

**เป้าหมาย:** ใช้ hooks ของ Agent Teams ดันเหตุการณ์ "งานเสร็จ / คนว่าง" เข้า dashboard

Agent Teams มี hook เฉพาะ 2 ตัว (ต่อยอดจากเรื่อง Hooks ใน Day 3):

| Hook | ยิงเมื่อไร | ความสามารถพิเศษ |
|---|---|---|
| `TeammateIdle` | teammate กำลังจะว่างงาน | exit code 2 = สั่งงานต่อ ไม่ให้ว่าง |
| `TaskCompleted` | งานกำลังจะถูก mark เสร็จ | exit code 2 = ไม่ให้ผ่าน (quality gate) |

ใน Bonus นี้เราใช้แบบ **สังเกตการณ์** (exit 0 เสมอ): แค่ append เหตุการณ์ลง log ให้ Mission Control อ่าน

### 3.1 ติดตั้ง hook script

โปรเจกต์เตรียมไว้แล้วที่ `agentflow-poc/examples/hooks/`:

- `agentflow-log.mjs` - อ่าน payload จาก stdin แล้ว append ลง `~/.claude/agentflow/activity.jsonl`
- `settings.snippet.json` - ตัวอย่าง config

**💬 Prompt ที่ใช้สั่ง Claude Code (ใน stock-app):**

```
เพิ่ม hooks ใน .claude/settings.json ของโปรเจกต์นี้ (merge กับของเดิม อย่าลบ)
โดยอ้างอิงตัวอย่างจาก @<path ไป agentflow-poc>/examples/hooks/settings.snippet.json:

- TeammateIdle และ TaskCompleted → รัน agentflow-log.mjs พร้อมชื่อ event เป็น argument
- แก้ path ของ script ให้ชี้ตำแหน่งจริงในเครื่องนี้
```

**✅ Checkpoint ตรวจสอบ:**
- รีสตาร์ท Claude Code แล้ว spawn ทีมสั้น ๆ อีกครั้ง (งานเล็ก ๆ 2 tasks พอ - ประหยัดโควตา)
- เมื่องานเสร็จ เห็นบรรทัดใหม่ใน `~\.claude\agentflow\activity.jsonl`
- การ์ด **Activity (จาก Hooks)** ใน Mission Control มีเหตุการณ์ TaskCompleted / TeammateIdle ไหลเข้ามาเอง

### 3.2 แนวคิดต่อยอด: Quality Gate ด้วย exit code 2

ยังไม่ทำในคลาส แต่ให้เห็นภาพพลังจริงของ hook คู่นี้:

```
TaskCompleted hook:
  รัน pnpm exec tsc --noEmit + pnpm test
  ├── ผ่านทั้งคู่ → exit 0 → งานถูก mark เสร็จ
  └── มีอะไรพัง → exit 2 + ข้อความ feedback
        → Claude Code ไม่ยอมให้ mark เสร็จ, teammate ต้องกลับไปแก้เอง
```

นี่คือ AI Quality Gate แบบเดียวกับ Day 3 แต่บังคับใช้กับ**ทีม AI ทั้งทีมอัตโนมัติ**

---

## Phase 4 (โจทย์ท้าทาย): ปรับแต่ง Mission Control

เลือกทำตามเวลา - ทุกข้อสั่งผ่าน Claude Code ใน agentflow-poc ตามแนว Vibe Coding:

1. **ตั้งชื่อตัวละครตามทีมจริง:** ฉากตอนนี้ map สมาชิกเข้า slot ตามลำดับ ลองสั่งให้ป้ายชื่อเหนือหัวตัวละคร (ใน `src/lib/office/scene.ts`) แสดงชื่อ teammate จริงแทนชื่อ slot
2. **เพิ่ม slot ที่ 7:** ทีมใหญ่กว่า 6 คนจะล้น ลองเพิ่มโต๊ะและตัวละครอีกตัวในฉาก (ดู pattern จาก `AGENTS` array)
3. **การ์ดสรุปเวลา:** เพิ่ม "งานเสร็จไปกี่งานใน 10 นาทีล่าสุด" โดยใช้ timestamp จาก activity.jsonl
4. **แจ้งเตือนงานค้าง:** ถ้ามี task `in_progress` นานผิดปกติ (teammate อาจลืม mark เสร็จ - ข้อจำกัดที่พบจริงของฟีเจอร์นี้) ให้ขึ้น badge เตือนใน dashboard

**✅ Checkpoint ทุกข้อ:** `pnpm typecheck` ผ่าน, ไม่มี semicolon, ห้ามแตะ `_trash/`

---

## ข้อจำกัดของ Agent Teams ที่ต้องรู้ (ณ ปัจจุบัน)

ฟีเจอร์ยัง experimental - ข้อจำกัดเหล่านี้เจอได้จริงในคลาส:

- **`/resume` และ `/rewind` ไม่คืนชีพ teammates** - resume session ของ lead แล้ว teammates เดิมหายไป (lead อาจพยายามส่งข้อความหาคนที่ไม่อยู่แล้ว) ถ้า session หลุดให้ตั้งทีมใหม่
- **Task status ค้าง** - บางครั้ง teammate ทำงานเสร็จแต่ลืม mark เสร็จ ทำให้งานที่ depend กันไม่เดิน - เห็นได้ชัดจาก Mission Control แล้วเข้าไปสะกิดผ่าน lead ได้
- **ปิดทีมช้า** - teammate จะทำ request/tool call ปัจจุบันให้จบก่อนถึงจะ shutdown
- **Windows ไม่มี split panes** - ใช้ in-process + Mission Control ของเราแทน
- **โควตาหมดเร็ว** - ทีม 4 คนกินประมาณ 15 เท่าของ session เดี่ยว วางแผนการใช้ในคลาสให้ดี

### Best Practices สรุปสั้น

1. เปิด **delegate mode** ให้ lead เสมอ - lead ที่ลงมือเองคือสาเหตุอันดับหนึ่งของไฟล์ชนกัน
2. spawn พร้อม **ขอบเขตไฟล์ชัดเจน** ต่อ teammate - ห้ามสองคนแก้ไฟล์เดียวกัน
3. ทีมเล็กพอดีงาน - เพิ่มคนเมื่องานขนานกันได้จริงเท่านั้น
4. งาน sequential ใช้ Sub-agents ธรรมดา ถูกกว่าและนิ่งกว่า

---

## ของหวาน: Self-study ต่อยอด

### 1. Split panes บน macOS/Linux

ถ้ามีเครื่อง mac: ติดตั้ง tmux แล้วรัน Claude Code ใน tmux - spawn ทีมแล้วแต่ละ teammate จะได้ pane ของตัวเอง เห็นทั้งทีมพิมพ์งานพร้อมกันในเทอร์มินัลเดียว (ประสบการณ์เดียวกับ Mission Control แต่อยู่ใน terminal)

### 2. Quality Gate เต็มรูปแบบ

ทำ Phase 3.2 จริง: เขียน `TaskCompleted` hook ที่รัน typecheck + test แล้ว exit 2 พร้อม feedback เมื่อพัง - วัดผลว่าทีม AI ส่งงานผ่าน gate ได้กี่เปอร์เซ็นต์โดยไม่ต้องมีมนุษย์คุม

### 3. เฝ้าหลายทีมพร้อมกัน

`reader.ts` ตอนนี้อ่านทีมเดียว ลองขยายเป็น multi-team: dropdown เลือกทีม, สรุปทุกทีมในหน้าเดียว - ได้ฝึก React state + API design เพิ่ม

### 4. เสียงแจ้งเตือน + TTS

เมื่อ `TaskCompleted` เข้ามา ให้ Mission Control เล่นเสียง หรือใช้ Web Speech API อ่านชื่องานที่เสร็จ - สนุกและได้ฝึก browser API (แนวเดียวกับ Voice Meeting ที่เคยวางไว้ในเวอร์ชันเดิม แต่ทำได้ฟรี)

---

## สรุป Bonus Module

**สิ่งที่เรียนรู้และทำได้แล้ว:**

- เข้าใจความต่าง **Sub-agents vs Agent Teams** และเกณฑ์เลือกใช้ (sequential vs parallel, ต้นทุนโควตา 4-7x vs 15x)
- เปิดใช้ Agent Teams ผ่าน `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` และคุมทีมด้วยคีย์ลัด + delegate mode
- ใช้ **subscription (Pro/Max) แทน API key** - รู้วิธีกันไม่ให้เผลอวิ่งเข้า API billing
- อ่านสถานะทีมจากไฟล์จริง: `teams/{team}/` (config + inboxes) และ `tasks/{team}/` (shared task list)
- สร้าง **Mission Control** ที่อ่านไฟล์เหล่านั้นแบบ defensive parsing แล้วแสดงผลทั้ง dashboard และห้อง 3D จากดีไซน์ Design3D
- ต่อ **hooks TeammateIdle / TaskCompleted** เข้า activity log และเข้าใจแนวคิด quality gate ด้วย exit code 2
- รู้ข้อจำกัดจริงของฟีเจอร์ experimental และวิธีทำงานร่วมกับมัน (fixture data, defensive parsing, สำรวจไฟล์จริงก่อนเขียนโค้ด)

**หัวใจที่เอาไปใช้ได้ทันที:** ระบบ AI ที่ดีไม่จำเป็นต้องเริ่มจากการเรียก API เอง - บางครั้ง "การอ่านสถานะของเครื่องมือที่มีอยู่แล้วมาแสดงให้เห็นภาพ" ก็สร้างมูลค่ามหาศาล ด้วยต้นทุนที่แทบเป็นศูนย์

---

## แหล่งอ้างอิง

| แหล่ง | URL | ใช้สำหรับ |
|---|---|---|
| **Agent Teams (ทางการ)** | https://code.claude.com/docs/en/agent-teams | แนวคิด, การเปิดใช้, คีย์ลัด, ข้อจำกัด |
| **Claude Code + Pro/Max plan** | https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan | การคิดโควตาจาก subscription |
| **Hooks (ทางการ)** | https://code.claude.com/docs/en/hooks | TeammateIdle, TaskCompleted และ exit code 2 |
| **Sub-agents (ทางการ)** | https://code.claude.com/docs/en/sub-agents | เทียบกับ Agent Teams |
| **โปรเจกต์ Mission Control** | `C:\TrainingDocument\Claude Code Deep Dive\agentflow-poc` | โค้ดอ้างอิงทั้งหมดของ Bonus นี้ |
| **ดีไซน์ต้นแบบ Office 3D** | `C:\TrainingDocument\Claude Code Deep Dive\Design3D` | `office-pixel-scene.js` + `Office Pixel 3D.dc.html` |

---

> **คำส่งท้ายจากอาจารย์สามิตร:**
> เวอร์ชันแรกของ AgentFlow เราสร้าง agent runtime เองด้วย Agent SDK ซึ่งสอนแก่นของ Agent Loop ได้ดี แต่มีกำแพงคือ API key และค่าใช้จ่าย - เวอร์ชัน Agent Teams นี้พลิกมุม: ให้ Claude Code เป็น runtime ที่เราจ่ายด้วย subscription อยู่แล้ว ส่วนเราสร้างสิ่งที่มองไม่เห็นให้มองเห็น ทีม AI ที่เคยซ่อนอยู่ในเทอร์มินัลกลายเป็นออฟฟิศ 3D ที่ทุกคนในห้องดูแล้วเข้าใจใน 5 วินาที
>
> บทเรียนที่ลึกที่สุดของ Bonus นี้: **เครื่องมือที่เก็บสถานะเป็นไฟล์เปิดโอกาสให้เราต่อยอดได้เสมอ** - อ่านมัน เฝ้ามัน แล้วสร้างประสบการณ์ใหม่ครอบมัน
