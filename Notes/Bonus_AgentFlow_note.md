# Bonus Module: สร้าง Multi-Agent Dashboard ด้วย Claude Agent SDK (AgentFlow)

> **Bonus Module** — ต่อยอดจากหลักสูตร "Claude Code มือโปร: ดำน้ำลึกสู่ Production"
> **วิทยากร:** อาจารย์สามิตร โกยม | IT Genius Engineering Co., Ltd.
> **รูปแบบ:** อบรมออนไลน์ (สอนสด) ผ่าน Zoom Meeting
> **ระยะเวลาโดยประมาณ:** 3 ชั่วโมง

---

## บทนำ

ตลอดหลักสูตรหลักเราสร้าง stock-app และสอนให้ Claude Code มีทีม Sub-agents เฉพาะทาง (code-reviewer, test-writer, security-auditor) คอยช่วยงานเราตอนพัฒนา Bonus Module นี้จะก้าวข้ามจาก "ใช้ AI ช่วย dev" ไปสู่ "**สร้างผลิตภัณฑ์ที่รัน AI agent เป็น runtime**"

เราจะสร้าง **AgentFlow** — dashboard สำหรับสั่งงานทีม AI Agent หลายตัวพร้อมกัน ด้วย Anthropic Agent SDK (`@anthropic-ai/sdk`) ซึ่งเป็นคนละบริบทกับ Claude Code Sub-agents โดยสิ้นเชิง

---

## จุดเชื่อม: Sub-agent vs Runtime Agent

ก่อนลงมือ ต้องแยกความต่างสองแนวคิดนี้ให้ชัด เพราะเป็นรากของ Bonus นี้ทั้งหมด

| มิติ | Sub-agent ใน Claude Code | Runtime Agent ด้วย Agent SDK |
|---|---|---|
| **คืออะไร** | ไฟล์ `.claude/agents/*.md` (Markdown + frontmatter) | โค้ด TypeScript ที่เรียก Anthropic API |
| **รันตอนไหน** | Dev-time — ตอนเราพัฒนาโปรเจกต์ | Runtime — ตอนผู้ใช้ใช้แอปจริง |
| **ใครควบคุม** | Claude Code CLI บนเครื่อง dev | โค้ดแอปของเรา (Next.js / Fastify) |
| **วัตถุประสงค์** | ช่วยรีวิวโค้ด, เขียน test, audit ตอน dev | ทำงานแทนผู้ใช้จริง: ค้นข้อมูล, สร้างไฟล์, ส่งอีเมล |
| **ผู้ใช้** | เราคนเดียว (นักพัฒนา) | ผู้ใช้ปลายทางของ product |
| **ตัวอย่าง** | `.claude/agents/code-reviewer.md` ช่วยตรวจ PR | Research Agent ค้นหา market trend แล้ว export PDF ให้ลูกค้า |
| **library** | ไม่มี — เป็น config ล้วน | `@anthropic-ai/sdk` เรียก Claude API ผ่านโค้ด |

```
┌────────────────────────────────────────────────────────────────┐
│  DEV-TIME (Claude Code Sub-agents)                             │
│                                                                │
│  นักพัฒนา ──► Claude Code CLI ──► Sub-agent (.md file)       │
│                                     ├─ code-reviewer.md        │
│                                     ├─ test-writer.md          │
│                                     └─ security-auditor.md     │
│                                                                │
│  ใช้ตอน: เขียนโค้ด, review, เขียน test บนเครื่อง dev        │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  RUNTIME (Agent SDK — สิ่งที่เราสร้างใน Bonus นี้)           │
│                                                                │
│  ผู้ใช้ปลายทาง ──► AgentFlow Dashboard                       │
│                      └─► โค้ด TypeScript (@anthropic-ai/sdk) │
│                           └─► Anthropic API (Claude)          │
│                                ├─ Research Agent              │
│                                ├─ Code Agent                  │
│                                └─ Content Agent               │
│                                                                │
│  ใช้ตอน: production — ผู้ใช้สั่งงาน agent 24/7               │
└────────────────────────────────────────────────────────────────┘
```

> **Key Concept:** Sub-agent คือ "เครื่องมือ dev" ของเราคนเดียว — Runtime agent คือ "ฟีเจอร์ของ product" ที่ผู้ใช้ทุกคนเข้าถึงได้

---

## ข้อกำหนดเบื้องต้นก่อนเริ่ม

### สิ่งที่ต้องมี

| รายการ | รายละเอียด |
|---|---|
| **Anthropic API Key** | สร้างได้ที่ https://console.anthropic.com — ใช้ key จริง ไม่ใช่ free tier |
| **Node.js** | LTS 20.x ขึ้นไป |
| **pnpm** | เวอร์ชัน 9.x |
| **VS Code** | พร้อม extension TypeScript + ESLint |

### ข้อควรระวังด้านค่าใช้จ่าย (Cost Awareness)

Bonus นี้สร้าง agent ที่เรียก Claude API จริง — ทุก token มีค่าใช้จ่าย

- **ใช้ `claude-sonnet-4-6` เป็น default** สำหรับ Sub-agent ทั่วไป
- **ใช้ `claude-opus-4-6` เฉพาะ Main Agent (Orchestrator)** เมื่อต้องวิเคราะห์ intent ซับซ้อน
- ตั้ง `maxIterations = 10` ทุก agent loop — ป้องกัน infinite loop และค่าใช้จ่ายพุ่ง
- ดูการใช้ token จริงที่ https://console.anthropic.com/usage
- ในชั้นเรียน PoC นี้เปิด agent ครั้งละ 1-2 ตัวเพื่อประหยัดต้นทุน

---

## Tech Stack (PoC สำหรับสอน)

> **หมายเหตุสำคัญ:** เพื่อให้สอนได้ในเวลา ~3 ชั่วโมง เราใช้ **Next.js App เดียว** (full-stack) แทนสถาปัตยกรรม production ของ AgentFlow จริงที่ใช้ Monorepo/Fastify/Redis ตาม SPEC.md การเรียนรู้แก่น Agent Loop, Tool Use และ Multi-Agent Routing ยังคงเหมือนกันทุกประการ

| Layer | Technology | หมายเหตุ |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack PoC |
| **Language** | TypeScript 5.x strict | ห้าม semicolon ตาม coding standard |
| **AI Core** | `@anthropic-ai/sdk` (latest) | Anthropic Agent SDK |
| **Database** | PostgreSQL + Prisma 6.x | จัดเก็บ Task, Agent, ActivityLog |
| **UI** | shadcn/ui + Tailwind v4 | Dashboard + Command Box |
| **State** | React Server Components + fetch | เรียบง่าย ยังไม่ใช้ Zustand |

ส่วน production AgentFlow จริง (นอกขอบเขตการสอนวันนี้) ใช้: Turborepo Monorepo, Fastify, Redis BullMQ, WebSocket Pub/Sub ตามที่ระบุใน SPEC.md

---

## Spec-Driven Development: meta-demo ก่อนลงมือ

หนึ่งใน key takeaway ของ Bonus นี้คือการใช้เอกสาร AgentFlow (README / REQUIREMENTS / SPEC / IMPLEMENTATION_PLAN / CLAUDE.md) เป็น **"วัตถุดิบให้ Claude Code ลงมือเองได้ทันที"** — นี่คือ Spec-Driven Development ที่เราฝึกมาตลอดหลักสูตร

### สั่ง Claude Code ให้อ่านเอกสารทั้งชุดก่อนลงมือ

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
อ่านเอกสารทั้ง 5 ไฟล์นี้ก่อน:
@README.md @REQUIREMENTS.md @SPEC.md @IMPLEMENTATION_PLAN.md @CLAUDE.md

จากนั้นสรุปสั้น ๆ:
1. AgentFlow คืออะไร และ MVP ต้องทำอะไรบ้าง
2. Tech stack ที่เราจะใช้ใน PoC (Next.js full-stack)
3. Phase 0-2 มีงานย่อยอะไร (เฉพาะที่เกี่ยวข้องกับ PoC นี้)
รอให้ฉันยืนยันก่อนลงมือ Phase 0
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่านไฟล์ทั้งหมด สรุป scope ที่ถูกต้อง และรอคำยืนยัน ไม่กระโจนทำงานทันที

**✅ Checkpoint ตรวจสอบ:**
- Claude สรุปได้ว่า PoC โฟกัส Phase 0-2 (ไม่ใช่ Phase 5-7)
- ระบุว่าใช้ Next.js full-stack แทน Monorepo
- ไม่มีการสร้างไฟล์ก่อนได้รับคำยืนยัน

> **Meta-Lesson:** การมีเอกสารครบชุดทำให้ Claude Code เริ่มงานได้อย่างถูกทิศทางโดยไม่ต้องอธิบายซ้ำทุกครั้ง นี่คือ ROI ของการลงทุนเขียน Spec ให้ดีตั้งแต่ต้น

---

## Phase 0: Project Setup

**เป้าหมาย:** วางโครงสร้างโปรเจกต์ Next.js 16 ให้พร้อมพัฒนา

### 0.1 สร้างโปรเจกต์ Next.js 16 พร้อม shadcn/ui

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
สร้างโปรเจกต์ Next.js 16 ชื่อ agentflow-poc ด้วย:
- TypeScript strict mode
- Tailwind CSS v4
- App Router
- src/ directory

จากนั้นติดตั้ง dependencies:
- @anthropic-ai/sdk (ล่าสุด)
- prisma (6.x)
- @prisma/client
- shadcn/ui (init ด้วย default settings, Dark mode)

สร้างไฟล์ .env.local จาก template:
ANTHROPIC_API_KEY=
DATABASE_URL=postgresql://postgres:password@localhost:5432/agentflow

ห้าม hardcode API key ใด ๆ ในโค้ด — ใช้ process.env เสมอ
เขียน TypeScript ไม่มี semicolon เขียน comment เป็นภาษาไทย
```

**🤖 Claude Code จะทำอะไร:**
1. รัน `pnpm create next-app@latest agentflow-poc --typescript --tailwind --app --src-dir`
2. ติดตั้ง package ที่ระบุ
3. รัน `npx shadcn@latest init`
4. สร้างไฟล์ `.env.local` พร้อม comment อธิบาย

**✅ Checkpoint ตรวจสอบ:**
- รัน `pnpm dev` แล้ว http://localhost:3000 ขึ้น
- `@anthropic-ai/sdk` อยู่ใน `package.json`
- ไฟล์ `.env.local` มีอยู่แต่ **ไม่มีค่า API key จริง** (ต้องกรอกเอง)
- ไม่มี key ใด ๆ ถูก commit (เพิ่ม `.env.local` ใน `.gitignore`)

### 0.2 สร้าง Prisma Schema

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
สร้าง Prisma schema ที่ prisma/schema.prisma สำหรับ agentflow-poc
ให้มี model ดังนี้ (อ้างอิง SPEC.md section 3):
- Agent: id, name, type (enum: MAIN/RESEARCH/CODE/CONTENT/DATA/OPS), 
         systemPrompt, model (default: claude-sonnet-4-6), 
         status (enum: ONLINE/WORKING/IDLE/ERROR), 
         isEnabled, createdAt, updatedAt
- Task: id, title, description, status (enum: QUEUED/IN_PROGRESS/COMPLETED/FAILED/CANCELLED), 
        input (Json), output (Json?), tokensUsed (Int default 0),
        agentId (optional FK → Agent), createdAt, completedAt?
- ActivityLog: id, taskId (FK → Task), message, level (default: "info"), timestamp

จากนั้นรัน:
1. npx prisma generate
2. npx prisma migrate dev --name init
3. สร้าง seed script ที่ prisma/seed.ts เพิ่ม Agent 5 ตัว:
   Main Agent (model: claude-opus-4-6), Research Agent, Code Agent, 
   Content Agent, Data Agent (ทั้งสี่หลัง model: claude-sonnet-4-6)
   พร้อม systemPrompt อธิบายบทบาทแต่ละตัวเป็นภาษาไทย
4. รัน npx prisma db seed
```

**🤖 Claude Code จะทำอะไร:** สร้าง schema ครบ, รัน migrate, สร้าง seed พร้อม system prompt ที่สมเหตุสมผลสำหรับแต่ละ agent type

**✅ Checkpoint ตรวจสอบ:**
- รัน `npx prisma studio` แล้วเห็น table Agent มีข้อมูล 5 rows
- `model` ของ Main Agent เป็น `claude-opus-4-6` (ไม่ใช่ sonnet)
- `status` ของทุก agent เป็น `IDLE` ตั้งต้น

---

## Phase 1: Core Agent Engine

**เป้าหมาย:** สร้าง Agent Loop ที่เรียก Claude API ได้จริง พร้อม Dashboard พื้นฐาน

### 1.1 เข้าใจ Agent Loop ก่อนลงมือ

Agent Loop คือหัวใจของระบบ — เป็น while loop ที่:
1. ส่ง message ให้ Claude
2. Claude ตอบกลับ — ถ้า `stop_reason = "end_turn"` จบงาน
3. ถ้า `stop_reason = "tool_use"` Claude ต้องการใช้เครื่องมือ → execute tool → ส่งผลกลับ
4. วนซ้ำจนถึง max iterations

```
ผู้ใช้ส่งคำสั่ง
       │
       ▼
  เริ่ม Agent Loop (iteration = 0)
       │
       ▼
  เรียก Claude API (messages.create)
       │
       ├─── stop_reason = "end_turn" ──► จบ → บันทึกผล
       │
       ├─── stop_reason = "tool_use" ──► execute tool ──► ส่งผล tool_result กลับ
       │                                                         │
       │                                                         ▼
       │                                               iteration++ → วนใหม่
       │
       └─── iteration >= maxIterations ──► หยุด → บันทึก status "max_iterations_reached"
```

### 1.2 โค้ดอ้างอิง: Agent Loop (จาก SPEC.md section 6)

> ไฟล์อ้างอิง: `src/lib/agent/orchestrator.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk"

interface AgentRunOptions {
  agentId: string
  agentName: string
  systemPrompt: string
  model: string
  taskInput: string
  mcpTools?: Anthropic.Tool[]
  maxIterations?: number
  onProgress?: (message: string, tokensUsed: number) => Promise<void>
}

interface AgentRunResult {
  output: string
  tokensUsed: number
  status: "completed" | "max_iterations_reached" | "error"
  iterations: number
}

// รัน Agent Loop กับ Claude API
async function runAgent(options: AgentRunOptions): Promise<AgentRunResult> {
  const {
    systemPrompt,
    model,
    taskInput,
    mcpTools = [],
    maxIterations = 10,
    onProgress,
  } = options

  // สร้าง Anthropic client — ห้าม hardcode key
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // เริ่มต้น message history ด้วย user message แรก
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: taskInput }
  ]

  let iteration = 0
  let tokensUsed = 0
  let finalOutput = ""

  while (iteration < maxIterations) {
    // เรียก Claude API
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      tools: mcpTools.length > 0 ? mcpTools : undefined,
      messages,
    })

    // สะสม token ที่ใช้ทุก iteration
    tokensUsed += response.usage.input_tokens + response.usage.output_tokens

    // เพิ่ม response ของ Claude เข้า message history
    messages.push({ role: "assistant", content: response.content })

    // แจ้งความคืบหน้า (ถ้ามี callback)
    if (onProgress) {
      const textContent = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("")
      await onProgress(textContent, tokensUsed)
    }

    // จบงานเรียบร้อย
    if (response.stop_reason === "end_turn") {
      finalOutput = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("")
      return { output: finalOutput, tokensUsed, status: "completed", iterations: iteration + 1 }
    }

    // Claude ต้องการใช้ Tool
    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      )

      // execute ทุก tool ที่ Claude ขอ แล้วรวม result
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await executeToolCall(toolUse, mcpTools)
          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: result,
          }
        })
      )

      // ส่งผล tool กลับ Claude เพื่อดำเนินงานต่อ
      messages.push({ role: "user", content: toolResults })
    }

    iteration++
  }

  // ถึง max iterations
  return {
    output: finalOutput || "หยุดทำงาน: ถึงจำนวนรอบสูงสุด",
    tokensUsed,
    status: "max_iterations_reached",
    iterations: maxIterations,
  }
}

// execute tool call จาก Claude (placeholder — เชื่อม MCP จริงใน Phase 3)
async function executeToolCall(
  toolUse: Anthropic.ToolUseBlock,
  availableTools: Anthropic.Tool[]
): Promise<string> {
  // ตรวจว่า tool นี้มีใน list ที่กำหนดไว้
  const toolDef = availableTools.find((t) => t.name === toolUse.name)
  if (!toolDef) {
    return `Error: ไม่พบ tool "${toolUse.name}"`
  }

  // Phase 1 — ยังไม่เชื่อม MCP จริง ตอบ mock result
  return `Tool "${toolUse.name}" ทำงานเสร็จแล้ว (mock result)`
}

export { runAgent }
export type { AgentRunOptions, AgentRunResult }
```

**จุดสำคัญที่ต้องทำความเข้าใจในโค้ดนี้:**
- `stop_reason` มีสามค่าที่ต้องจัดการ: `"end_turn"`, `"tool_use"`, `"max_tokens"`
- token counting ต้องบวกทั้ง `input_tokens` และ `output_tokens` ทุก iteration
- message history ต้อง **push ทั้ง assistant response และ tool_result** ก่อนเรียก Claude รอบถัดไป
- `mcpTools` เป็น optional — agent ที่ไม่ต้องใช้ tool ก็รันได้

### 1.3 สร้าง Server Action สำหรับรัน Agent

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
สร้าง Server Action ที่ src/app/actions/agent.ts
โดยอ้างอิง orchestrator ที่เพิ่งสร้างที่ src/lib/agent/orchestrator.ts

ให้มีฟังก์ชัน runAgentTask(taskId: string, agentId: string, input: string):
1. ดึงข้อมูล Agent จาก database ด้วย Prisma (systemPrompt, model, type)
2. อัปเดต Task status เป็น IN_PROGRESS และ Agent status เป็น WORKING
3. เรียก runAgent() จาก orchestrator พร้อม onProgress callback ที่บันทึก ActivityLog
4. เมื่อเสร็จ อัปเดต Task status เป็น COMPLETED หรือ FAILED
5. อัปเดต Task.tokensUsed และ Task.output
6. reset Agent status กลับเป็น IDLE
7. return { success: boolean, output: string, tokensUsed: number }

ใช้ TypeScript strict mode ห้าม semicolon เขียน comment ภาษาไทย
```

**🤖 Claude Code จะทำอะไร:** สร้าง `src/app/actions/agent.ts` พร้อม `'use server'` directive, Prisma queries, error handling ครบ

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์มี `'use server'` บรรทัดแรก
- ทุก Prisma call อยู่ใน try/catch
- Agent status กลับเป็น IDLE แม้เกิด error (ใน finally block)
- ไม่มี hardcode API key

### 1.4 สร้าง Dashboard พื้นฐานและ Command Box

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
สร้างหน้า Dashboard ที่ src/app/page.tsx และ component ที่จำเป็น:

1. src/app/page.tsx (Server Component):
   - ดึงรายการ Agent ทั้งหมดจาก database
   - ดึง Task ล่าสุด 10 รายการ
   - แสดง AgentList และ CommandBox

2. src/components/dashboard/AgentCard.tsx:
   - แสดงชื่อ Agent, type, status badge (สี: IDLE=gray, WORKING=yellow, ERROR=red)
   - แสดง model ที่ใช้

3. src/components/dashboard/CommandBox.tsx (Client Component):
   - textarea สำหรับพิมพ์คำสั่ง
   - dropdown เลือก Agent target
   - ปุ่ม "สั่งงาน" ที่เรียก Server Action runAgentTask
   - แสดง loading state และ output ที่ได้รับ

4. src/components/dashboard/TaskList.tsx:
   - แสดงรายการ Task พร้อม status badge
   - แสดง tokensUsed แต่ละ task

ใช้ shadcn/ui components, Dark mode, ภาษาไทย ห้าม semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้าง component ทั้งหมด, ตั้งค่า server/client component ให้ถูกต้อง

**✅ Checkpoint ตรวจสอบ:**
- เปิด http://localhost:3000 เห็น list of agents จาก database จริง
- พิมพ์คำสั่งง่าย ๆ เช่น "สวัสดี ช่วยแนะนำตัวด้วย" เลือก Research Agent แล้วกด "สั่งงาน"
- เห็น response จาก Claude ปรากฏใน UI
- Task ถูกบันทึกใน database (ตรวจผ่าน Prisma Studio)

**📄 ตัวอย่าง output ที่ควรเห็น:**

```
สั่งงาน: "หาข้อมูลเทรนด์ AI ปี 2026 สรุปสั้น ๆ"
Agent: Research Agent
────────────────────────────────────
Claude ตอบกลับ:
"เทรนด์ AI ที่โดดเด่นในปี 2026 ประกอบด้วย:
1. Agentic AI — AI ที่ทำงานหลายขั้นตอนและใช้ tool ได้อัตโนมัติ...
2. Multi-modal reasoning — วิเคราะห์ภาพ เสียง และข้อความพร้อมกัน...
3. ..."
────────────────────────────────────
Token ที่ใช้: 1,247 (input: 892 + output: 355)
Status: COMPLETED
```

---

## Phase 2: Multi-Agent Routing + Task Queue

**เป้าหมาย:** Main Agent วิเคราะห์คำสั่งและ route งานไปยัง Sub-agent ที่เหมาะสมอัตโนมัติ พร้อม Task Queue UI

### 2.1 ออกแบบ Main Agent Orchestrator

Main Agent มีบทบาทพิเศษ: ไม่ได้ทำงานเองโดยตรง แต่ **วิเคราะห์ intent** ของผู้ใช้แล้วตัดสินใจว่าจะส่งงานให้ Sub-agent ตัวไหน

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
สร้าง System Prompt สำหรับ Main Agent ที่ src/lib/agent/prompts/main-agent.ts

Main Agent มีชื่อว่า "Alex" ทำหน้าที่เป็น Orchestrator โดย:
- รับคำสั่งจากผู้ใช้ (ภาษาไทยหรืออังกฤษ)
- วิเคราะห์ว่าควรส่งงานให้ Agent ตัวไหน
- ตอบกลับเป็น JSON เสมอในรูปแบบ:
  { "targetAgent": "RESEARCH|CODE|CONTENT|DATA|OPS", "taskDescription": "...", "reason": "..." }
- ถ้างานไม่เหมาะกับ agent ใดให้ targetAgent = "MAIN" และตอบเองเลย

ตัวอย่าง routing logic:
- "หาข้อมูล / ค้นคว้า / วิเคราะห์" → RESEARCH
- "เขียนโค้ด / แก้ bug / สร้าง script" → CODE
- "เขียนบทความ / โพสต์ / รายงาน" → CONTENT
- "วิเคราะห์ข้อมูล / สถิติ / กราฟ" → DATA
- "ส่งอีเมล / สร้างไฟล์ / จัดการ calendar" → OPS

export เป็น string ค่าเดียว ห้าม semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ prompt ที่ออกแบบมาอย่างดี ระบุ output format ชัดเจน

**✅ Checkpoint ตรวจสอบ:**
- System prompt บังคับให้ตอบเป็น JSON เสมอ (สำคัญ — routing จะ parse JSON นี้)
- มีตัวอย่าง routing ที่ครอบคลุม use case หลัก
- ไม่มี semicolon ในไฟล์

### 2.2 สร้าง Routing Logic

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
สร้าง routing logic ที่ src/lib/agent/router.ts

ฟังก์ชัน routeCommand(userMessage: string): Promise<RouteResult>
โดย:
1. เรียก Main Agent (claude-opus-4-6) ด้วย system prompt จาก main-agent.ts
   ด้วย userMessage เป็น input
2. Parse JSON response → ได้ targetAgent และ taskDescription
3. ดึง Agent record จาก database ตาม targetAgent type
4. สร้าง Task record ใน database พร้อม status QUEUED
5. return { taskId, targetAgent, targetAgentId, taskDescription }

interface RouteResult {
  taskId: string
  targetAgent: string
  targetAgentId: string
  taskDescription: string
}

ถ้า JSON parse ผิดพลาดให้ fallback เป็น MAIN agent
ห้าม semicolon เขียน comment ภาษาไทย
```

**🤖 Claude Code จะทำอะไร:** สร้าง router พร้อม error handling สำหรับ JSON parse failure

**✅ Checkpoint ตรวจสอบ:**
- ทดสอบด้วย prompt "หาข้อมูลเกี่ยวกับ Claude AI" → targetAgent ควรเป็น RESEARCH
- ทดสอบด้วย prompt "เขียน Python script อ่าน CSV" → targetAgent ควรเป็น CODE
- Task ถูกสร้างใน database ทุกครั้ง

### 2.3 Task Queue UI + Agent Status Polling

สำหรับ PoC นี้เราใช้ **polling** แทน WebSocket เพื่อความเรียบง่าย (WebSocket เป็น Phase 4 production)

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
สร้าง Task Queue component และ polling mechanism:

1. src/components/dashboard/TaskQueue.tsx (Client Component):
   - แสดงรายการ Task ล่าสุด 10 อันดับ
   - แต่ละ row: title, agent name, status badge, tokensUsed
   - status badge: QUEUED=blue, IN_PROGRESS=yellow (pulse), COMPLETED=green, FAILED=red
   - useEffect poll /api/tasks ทุก 3 วินาที

2. src/app/api/tasks/route.ts (API Route):
   - GET /api/tasks — ดึง Task ล่าสุด 10 รายการพร้อม agent info
   - return JSON

3. src/app/api/agents/route.ts:
   - GET /api/agents — ดึง Agent ทั้งหมดพร้อม status ปัจจุบัน

4. อัปเดต CommandBox ให้ใช้ routeCommand จาก router.ts
   แทนการเลือก agent เอง:
   - ผู้ใช้พิมพ์คำสั่ง กด "สั่งงาน"
   - เรียก routeCommand → ได้ taskId
   - รัน runAgentTask ใน background
   - refresh Task Queue

ห้าม semicolon ภาษาไทย TypeScript strict
```

**🤖 Claude Code จะทำอะไร:** สร้าง API routes, Client Component พร้อม polling, เชื่อม routing เข้ากับ CommandBox

**✅ Checkpoint ตรวจสอบ:**
- พิมพ์คำสั่ง กด "สั่งงาน" — เห็น Task ปรากฏใน Queue พร้อม status QUEUED
- Status เปลี่ยนเป็น IN_PROGRESS แล้วเป็น COMPLETED โดยไม่ต้อง refresh หน้า
- คอนโซล browser ไม่มี error

### 2.4 เพิ่ม Pause / Cancel Task

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
เพิ่มฟีเจอร์ Pause และ Cancel Task:

1. src/app/actions/task.ts:
   - cancelTask(taskId: string): อัปเดต status เป็น CANCELLED, reset agent status เป็น IDLE
   - (Pause ใน PoC นี้ทำเป็น Cancel แล้วสร้าง Task ใหม่ เพราะ Agent Loop ทำงาน synchronous)

2. อัปเดต TaskQueue.tsx:
   - เพิ่มปุ่ม Cancel ข้าง Task ที่มี status QUEUED หรือ IN_PROGRESS
   - เรียก cancelTask Server Action เมื่อกด
   - refresh list หลัง cancel

เพิ่ม ActivityLog display:
3. src/components/dashboard/ActivityLog.tsx:
   - แสดง log ล่าสุด 20 รายการ (ดึงจาก /api/activity)
   - poll ทุก 5 วินาที
   - format: [timestamp] [level] message

ห้าม semicolon ภาษาไทย
```

**✅ Checkpoint ตรวจสอบ:**
- กด Cancel ขณะ Task กำลังรัน → status เปลี่ยนเป็น CANCELLED
- Agent status กลับเป็น IDLE
- เห็น ActivityLog ไหลเข้ามาขณะ Agent ทำงาน

### 2.5 เชื่อม MCP Tool หนึ่งตัว (Web Search)

เพื่อให้เห็นภาพ Tool Use จริง เราเพิ่ม web_search tool อย่างง่ายให้ Research Agent

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
สร้าง Tool Definition สำหรับ web_search ที่ src/lib/tools/web-search.ts:

export const webSearchTool: Anthropic.Tool = {
  name: "web_search",
  description: "ค้นหาข้อมูลจากอินเทอร์เน็ต ใช้เมื่อต้องการข้อมูลปัจจุบัน",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "คำค้นหา" },
      maxResults: { type: "number", description: "จำนวนผลลัพธ์สูงสุด (default: 5)" }
    },
    required: ["query"]
  }
}

// Mock implementation (PoC — เชื่อม search API จริงใน production)
export async function executeWebSearch(input: { query: string; maxResults?: number }): Promise<string> {
  // ใน production เชื่อม Brave Search API หรือ Serper API
  return `ผลการค้นหา "${input.query}": (mock) พบข้อมูลที่เกี่ยวข้อง 3 รายการ...`
}

จากนั้นอัปเดต orchestrator.ts:
- ถ้า agent type = RESEARCH ให้ส่ง [webSearchTool] เข้า mcpTools
- ใน executeToolCall ถ้า tool name = "web_search" ให้เรียก executeWebSearch

ห้าม semicolon ภาษาไทย
```

**🤖 Claude Code จะทำอะไร:** สร้าง tool definition และเชื่อมเข้า orchestrator

**✅ Checkpoint ตรวจสอบ:**
- สั่ง Research Agent ว่า "หาข้อมูลราคา iPhone ล่าสุด"
- ใน ActivityLog เห็น log ว่า Claude เรียก tool "web_search"
- response ของ Claude รวมผล tool แล้วสรุปให้ผู้ใช้

---

## สรุป: Dashboard ขั้นต่ำที่สมบูรณ์ (Phase 0-2)

เมื่อจบ Phase 2 ระบบ AgentFlow PoC มีครบดังนี้:

```
┌─────────────────────────────────────────────────────┐
│              AgentFlow Dashboard                    │
│                                                     │
│  Agents (5 ตัว)          Task Queue               │
│  ┌──────────────────┐    ┌──────────────────────┐  │
│  │ Main Agent (Alex)│    │ [COMPLETED] หาข้อมูล │  │
│  │ Status: IDLE     │    │   Research · 1,247 tk │  │
│  ├──────────────────┤    ├──────────────────────┤  │
│  │ Research Agent   │    │ [IN_PROGRESS] เขียน  │  │
│  │ Status: WORKING  │    │   Code · 432 tk      │  │
│  ├──────────────────┤    ├──────────────────────┤  │
│  │ Code Agent       │    │ [QUEUED] สร้างรายงาน │  │
│  │ Status: IDLE     │    │   Content · pending  │  │
│  └──────────────────┘    └──────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Command Box                                 │   │
│  │ ป้อนคำสั่ง: ________________________________│   │
│  │                            [สั่งงาน]        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Activity Log                                       │
│  [14:32:01] Research Agent รับงาน: หาข้อมูล AI    │
│  [14:32:03] เรียก tool: web_search (query=...)     │
│  [14:32:05] ได้ผลลัพธ์ · tokensUsed: 1,247        │
└─────────────────────────────────────────────────────┘
```

**สิ่งที่เรียนรู้และทำได้แล้ว:**
- สร้าง Agent Loop ด้วย `@anthropic-ai/sdk` — while loop, จัดการ `stop_reason`, นับ token
- ออกแบบ Multi-Agent Routing: Main Agent วิเคราะห์ intent แล้วส่งต่อ Sub-agent
- เชื่อม MCP Tool (web_search) เข้ากับ Agent Loop
- สร้าง Task Queue, ActivityLog, Agent Status ใน Dashboard
- Cost awareness: นับ token ทุก call, ใช้ Sonnet/Opus ต่างกันตาม role

---

## ของหวาน: Phase 5-7 สำหรับ Self-study

Phase ต่อไปนี้อยู่นอกขอบเขตการสอนวันนี้ แต่เป็น "ของหวาน" ที่ทำให้ AgentFlow กลายเป็น product ระดับ production อย่างแท้จริง สรุปให้เห็นภาพว่าต้องใช้อะไรต่อ

---

### Phase 5: 3D Virtual Office

**ภาพรวม:** แสดง Agent แต่ละตัวในรูปแบบ Avatar 3D ในห้องทำงานเสมือน เมื่อ Agent ทำงานจะมี visual indicator (speech bubble, glow animation) — ผู้ใช้คลิก Avatar เพื่อดูรายละเอียด

**Tech ที่ต้องใช้:**
- `@react-three/fiber` (React Three Fiber) — render 3D scene ภายใน React component
- `@react-three/drei` — helper utilities เช่น `OrbitControls`, `Text`, `useGLTF`
- `three` (Three.js) — low-level 3D engine
- Spline (ทางเลือก) — สร้าง 3D model แบบ no-code แล้ว export เป็น React component

**แนวทางเริ่มต้น:**
```
1. เพิ่ม R3F Canvas ใน Dashboard หน้าใหม่
2. สร้าง Office Scene (isometric camera, floor, walls)
3. แต่ละ Agent = Box geometry + Text label + material สี
4. เชื่อม WebSocket events (หรือ polling) → เปลี่ยน material ตาม Agent status
5. Click detection ด้วย onPointerDown → แสดง popup รายละเอียด
```

**เหตุผลที่อยู่นอกขอบเขตวันนี้:** Three.js มี learning curve สูง, optimize FPS ต้องใช้เวลา, ไม่ส่งผลต่อ core Agent logic

---

### Phase 6: Voice Meeting

**ภาพรวม:** ผู้ใช้พูดสั่ง Agent ด้วยเสียงได้ทันที Agent ตอบกลับด้วยเสียงของตัวเอง (แต่ละ Agent มี voice ต่างกัน) พร้อม transcript แบบเรียลไทม์

**Tech ที่ต้องใช้:**
- **Whisper API** (OpenAI) — แปลงเสียงพูดเป็นข้อความ (Speech-to-Text) แบบเรียลไทม์
- **ElevenLabs API** — แปลงข้อความเป็นเสียงพูด (Text-to-Speech) พร้อมเลือก voice ต่างกันต่อ Agent
- **WebAudio API** (browser) — จับเสียงจาก microphone, ส่งเป็น audio chunk ผ่าน WebSocket
- Voice mapping ตาม SPEC.md: Main=Charon, Research=Sulafat, Code=Puck, Content=Erinome

**แนวทางเริ่มต้น:**
```
1. MediaRecorder API → record audio chunk ทุก 1-2 วินาที
2. ส่ง chunk ผ่าน WebSocket → backend รับ
3. backend → Whisper API → ได้ text
4. text → Claude Agent → ได้ response
5. response → ElevenLabs API → audio buffer
6. ส่ง audio กลับ browser → play ทันที
```

**เหตุผลที่อยู่นอกขอบเขตวันนี้:** ต้องมี real-time WebSocket (ยังไม่ได้ทำ), ค่า API Whisper + ElevenLabs เพิ่มขึ้น, latency management ซับซ้อน

---

### Phase 7: Memory & Context (RAG)

**ภาพรวม:** Agent จดจำ context การทำงานข้าม session ด้วย Retrieval-Augmented Generation (RAG) — ก่อนรัน Agent Loop จะดึงความจำที่เกี่ยวข้องมาใส่ใน system prompt อัตโนมัติ

**Tech ที่ต้องใช้:**
- **pgvector** (PostgreSQL extension) — เก็บ vector embedding ของ content
- **Anthropic Embeddings API** หรือ OpenAI `text-embedding-3-small` — สร้าง embedding จาก text
- Prisma Schema เพิ่ม `Memory` model พร้อม `Unsupported("vector(1536)")`
- Cosine similarity search (`<->` operator ใน pgvector)

**Flow RAG:**
```
ก่อนรัน Agent:
  1. สร้าง embedding จาก task input
  2. ค้นหา Memory ที่ cosine similarity สูงสุด (top 5)
  3. inject เข้า system prompt: "บริบทที่เกี่ยวข้อง: ..."

หลังรัน Agent:
  4. บันทึก task output เป็น Memory ใหม่ พร้อม embedding
```

**เหตุผลที่อยู่นอกขอบเขตวันนี้:** ต้องตั้งค่า pgvector ใน Docker, embedding cost เพิ่ม, ต้องออกแบบ retrieval strategy ให้ดี

---

## สรุป + ข้อควรระวังในการใช้งานจริง

### สิ่งที่เรียนรู้จาก Bonus Module นี้

1. **Sub-agent vs Runtime Agent** — เข้าใจความต่างชัดเจน: sub-agent คือ dev tool, runtime agent คือ product feature
2. **Agent Loop pattern** — while loop + stop_reason + tool_use + max_iterations คือแกนหลักของทุก agentic system
3. **Multi-Agent Routing** — Main Agent เป็น orchestrator ที่ parse intent แล้วส่งต่อให้ Sub-agent ที่เหมาะสม
4. **MCP Tool Integration** — ทำให้ Agent ทำงานกับโลกภายนอกได้ (search, drive, email)
5. **Spec-Driven Development** — เอกสารครบชุดทำให้ Claude Code ลงมือได้ถูกทิศตั้งแต่ต้น

### ข้อควรระวังก่อนนำไป Production

**Cost Control**
- ตั้ง `maxIterations` เสมอ — default แนะนำ 10 สำหรับงานทั่วไป
- ใช้ Sonnet สำหรับ Sub-agent, Opus เฉพาะ Main Agent / งานที่ต้องการ reasoning สูง
- ตั้ง token budget ต่อ agent ต่อวัน — ป้องกัน runaway cost
- Monitor ที่ https://console.anthropic.com/usage เสมอ

**Security**
- ห้าม hardcode `ANTHROPIC_API_KEY` ในโค้ดทุกกรณี — ใช้ `process.env` เสมอ
- ไฟล์ `.env.local` ต้องอยู่ใน `.gitignore`
- MCP OAuth credentials (Google Drive, Gmail) ต้องเข้ารหัสก่อนเก็บใน database
- ทุก API endpoint ต้องผ่าน auth middleware ก่อน production deploy

**Reliability**
- Agent Loop ต้องมี timeout นอกจาก maxIterations — ป้องกันกรณี API ค้าง
- จัดการ `stop_reason = "max_tokens"` ด้วย: ตอนนี้โค้ดอ้างอิงยังไม่ครอบคลุม
- ใช้ try/catch ทุก Claude API call — API อาจ return error 529 (overloaded) ได้
- บันทึก ActivityLog ทุก iteration เพื่อ debug ง่ายเมื่อมีปัญหา

**Performance (Production)**
- เปลี่ยน polling → WebSocket เมื่อ user base โต (Phase 4)
- เพิ่ม Redis BullMQ เพื่อรัน Agent แบบ background worker จริง (ไม่ block HTTP request)
- ใช้ Streaming response (`client.messages.stream()`) เพื่อให้ผู้ใช้เห็น output ทีละตัวอักษร

---

## แหล่งอ้างอิง

| แหล่ง | URL | ใช้สำหรับ |
|---|---|---|
| **Anthropic API Docs** | https://docs.claude.com | ข้อมูลทุกอย่างเกี่ยวกับ Claude API |
| **Anthropic SDK (Node.js)** | https://github.com/anthropic-ai/anthropic-sdk-node | `@anthropic-ai/sdk` source + examples |
| **Messages API Reference** | https://docs.anthropic.com/en/api/messages | Request/Response format, stop_reason |
| **Tool Use Guide** | https://docs.anthropic.com/en/docs/build-with-claude/tool-use | Tool definition, tool_result format |
| **MCP Documentation** | https://modelcontextprotocol.io | Model Context Protocol spec |
| **MCP Servers (official)** | https://github.com/modelcontextprotocol/servers | Google Drive, GitHub, PostgreSQL MCP |
| **AgentFlow SPEC.md** | `C:\TrainingWorkshop\vr_office_sub_agent\SPEC.md` | Architecture, Schema, Agent Loop code |
| **AgentFlow IMPL PLAN** | `C:\TrainingWorkshop\vr_office_sub_agent\IMPLEMENTATION_PLAN.md` | Phase breakdown สมบูรณ์ |

---

> **คำส่งท้ายจากอาจารย์สามิตร:**
> AgentFlow PoC ที่เราสร้างวันนี้คือ "proof that it works" — ระบบที่เรียก Claude API จริง route งานจริง บันทึก task จริง ขั้นต่อไปคือการเปลี่ยน PoC เป็น production-grade ด้วย WebSocket, Redis Queue, Authentication และ RAG Memory ซึ่งเป็นเส้นทางที่เอกสาร IMPLEMENTATION_PLAN.md ได้วางไว้ครบแล้ว
>
> หัวใจที่เอาไปใช้ได้วันนี้เลย: **Agent Loop pattern** — ไม่ว่าจะสร้าง product AI อะไร ทุกอย่างวนอยู่ที่ while loop + stop_reason + tool_use
