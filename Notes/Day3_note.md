# หลักสูตร Claude Code มือโปร: ดำน้ำลึกสู่ Production — วันที่ 3

## ดำน้ำลึก Sub-agents, MCP, Hooks และ Skills — หัวใจของหลักสูตร

**วันที่อบรม:** วันเสาร์ที่ 11 กรกฎาคม 2569 | เวลา 20:30–23:30 น.
**รูปแบบ:** อบรมออนไลน์ (สอนสด) ผ่าน Zoom Meeting
**วิทยากร:** อาจารย์สามิตร โกยม | IT Genius Engineering Co., Ltd.

---

## บทนำ

วันที่ 3 คือ **หัวใจของหลักสูตรทั้งหมด** — หลังจากวันที่ 1-2 ที่เราสร้างระบบ StockApp ครบทั้ง CRUD, Stock In/Out และ Dashboard แล้ว วันนี้เราจะยกระดับการทำงานกับ Claude Code ให้ไปอีกขั้น

แนวคิดหลักของวันนี้คือ "**อย่าทำงานคนเดียว — สร้างทีม AI ให้ทำแทน**" ด้วยเครื่องมือสี่ชิ้นที่ทรงพลังที่สุดใน Claude Code:

1. **Sub-agents** — ผู้ช่วย AI เฉพาะทางที่มี context แยกของตัวเอง
2. **MCP (Model Context Protocol)** — โปรโตคอลเชื่อมต่อ Claude กับโลกภายนอก เช่น ฐานข้อมูล, GitHub
3. **Hooks** — ระบบ automation ที่รันสคริปต์อัตโนมัติเมื่อ Claude ทำงาน
4. **Skills** — คู่มือ/ความรู้เฉพาะทางที่ Claude หยิบมาใช้เองอัตโนมัติเมื่อ task ตรงกับ description

สไตล์ของวันนี้คือ **Vibe Coding** — คุณไม่ได้พิมพ์ไฟล์ config หรือโค้ดเอง แต่ **สั่ง Claude Code ด้วย prompt** แล้วทำหน้าที่ตรวจสอบ (review) ผลลัพธ์ที่ได้

เมื่อจบวันนี้ คุณจะสามารถออกแบบระบบ AI-assisted development workflow ที่ทำงานแทนงานซ้ำ ๆ ได้อย่างสมบูรณ์

---

## ทบทวน Spec ก่อนเริ่ม: วันนี้คือ Phase 3 — Agentic Quality

ก่อนลงมือ เราเปิด `docs/spec.md` ที่สร้างไว้วันที่ 1 ขึ้นมาทบทวนว่าวันนี้อยู่ Phase ไหน แล้วใช้มันเป็นฐานสั่งงาน Claude Code เสมอ

### 🛠️ ขั้นตอนเปิดวัน: โหลด spec แล้วล็อกขอบเขต Phase 3

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
/clear
อ่าน @docs/spec.md แล้วสรุปสั้น ๆ ว่า Phase 3 (Agentic Quality) มีงานย่อยอะไรบ้าง
ยืนยันว่า Phase 1-2 เสร็จครบแล้ว จากนั้นรอให้ฉันสั่งทำทีละงาน อย่าเพิ่งลงมือ
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่าน `docs/spec.md` ดึงเฉพาะหัวข้อ Phase 3 มาสรุปเป็น checklist และยังไม่แตะไฟล์จนกว่าเราจะสั่ง

**✅ Checkpoint ตรวจสอบ:**

- งานที่ Claude สรุปตรงกับ Phase 3 ใน spec ไหม (Sub-agents code-reviewer/test-writer/security-auditor, MCP PostgreSQL+GitHub, Hooks)
- ถ้าอยากปรับขอบเขต ให้สั่ง Claude อัปเดต `docs/spec.md` ก่อนลงมือ — spec ต้องเป็น "แหล่งความจริงเดียว"

> **Key Concept:** การเปิด spec ต้นวันแล้ว `/clear` ทำให้ context ของ Claude สะอาดและโฟกัสเฉพาะ Phase ที่กำลังทำ ลดโอกาสที่ AI จะหลุดไปทำงานนอกแผน

---

## Module 3.1: Sub-agents คืออะไร ทำไมเปลี่ยนเกม

### ปัญหาของการใช้ Agent เดียวทำทุกอย่าง

ลองนึกภาพว่าคุณมีพนักงานคนเดียวที่ต้องทำหน้าที่ทั้งนักพัฒนา, QA engineer, security auditor และ DBA ในเวลาเดียวกัน ผลที่ได้คืองานคุณภาพต่ำกว่ามาตรฐานในทุกด้าน

Claude Code ก็เป็นแบบเดียวกัน เมื่อ context window เต็มไปด้วยงานหลายอย่าง คุณภาพของผลลัพธ์ย่อมลดลง

> **Key Concept:** Sub-agent คือ Claude instance แยกต่างหากที่ทำงานในบริบทเฉพาะทาง มี **context window ของตัวเอง (Context Isolation)** จึงมีสมาธิกับงานนั้น ๆ อย่างเต็มที่ โดยไม่รู้สึก "เครียด" จากข้อมูลอื่น ๆ ในโปรเจกต์

### Context Isolation คืออะไร?

เมื่อ Main agent มอบหมายงานให้ Sub-agent:

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Agent (Claude Code)                  │
│                                                              │
│  Context: โปรเจกต์ stock-app ทั้งหมด, ประวัติการสนทนา,     │
│           ไฟล์ที่เปิดอยู่, เป้าหมายงาน ฯลฯ                │
│                                                              │
│  "ขอให้ code-reviewer ตรวจสอบ PR นี้"                       │
└──────────────────────┬──────────────────────────────────────┘
                       │  delegate (ส่งเฉพาะข้อมูลที่จำเป็น)
                       │
         ┌─────────────▼────────────┐
         │     Sub-agent ตัวที่ 1   │
         │   (code-reviewer)        │
         │                          │
         │  Context: เฉพาะโค้ดที่  │
         │  ต้องตรวจสอบ + system   │
         │  prompt ของตัวเอง        │
         │                          │
         │  ไม่รู้ประวัติสนทนาอื่น  │
         │  ไม่รู้ไฟล์อื่นในโปรเจกต์│
         │  → Focus 100%            │
         └─────────────┬────────────┘
                       │  ส่งผลกลับ
                       ▼
         ┌─────────────────────────┐
         │    Main Agent รับผล     │
         │    และดำเนินงานต่อ       │
         └─────────────────────────┘
```

### ทำไม Sub-agent ถึงทำงานดีกว่า Agent เดียว?

| มิติ | Agent เดียว | Sub-agents เฉพาะทาง |
|---|---|---|
| **คุณภาพงาน** | ปานกลาง (ทำทุกอย่าง) | สูง (เชี่ยวชาญเฉพาะด้าน) |
| **Context Window** | เต็มเร็ว, ลืมข้อมูลเก่า | แต่ละ agent มี context สะอาด |
| **ความขนาน** | ทำทีละงาน | หลาย agent ทำงานพร้อมกันได้ |
| **System Prompt** | เดียว, ทั่วไป | แต่ละ agent มี instruction เฉพาะ |
| **Model** | เดียวกันทุกงาน | เลือก model ที่เหมาะกับงาน |
| **การ Debug** | หาต้นเหตุยาก | ตรวจสอบแต่ละ agent ได้ชัดเจน |

### ตำแหน่งเก็บไฟล์ Sub-agent

```
stock-app/
└── .claude/
    └── agents/
        ├── code-reviewer.md      ← Sub-agent เฉพาะโปรเจกต์
        ├── test-writer.md
        └── security-auditor.md

~/.claude/
└── agents/
    └── my-global-agent.md        ← Sub-agent ระดับ user (ใช้ทุกโปรเจกต์)
```

### โครงสร้างไฟล์ Sub-agent

ไฟล์ `.md` แต่ละไฟล์ประกอบด้วยสองส่วน:

```
---
name: ชื่อ agent (ไม่มีช่องว่าง)
description: คำอธิบายสั้น ๆ ว่า agent ทำอะไร (Claude ใช้เลือก agent)
tools:
  - Read
  - Grep
  - Bash
model: claude-sonnet-4-6
---

[System Prompt — เนื้อหาจาก heading นี้ลงไป]

คุณคือ... (อธิบายบทบาท, กฎ, format ผลลัพธ์ ฯลฯ)
```

**ตัวเลือก `model`:**

| ค่า | ใช้เมื่อ |
|---|---|
| `claude-opus-4-5` | งานซับซ้อน ต้องการคุณภาพสูงสุด |
| `claude-sonnet-4-6` | งานทั่วไป สมดุลระหว่างคุณภาพและความเร็ว |
| `claude-haiku-4-5` | งานง่าย ต้องการความเร็ว ประหยัด token |
| `inherit` | ใช้ model เดียวกับ main agent |

> **Vibe Coding Note:** คุณไม่ต้องพิมพ์ไฟล์ agent เองทีละบรรทัด — สั่ง Claude Code ให้สร้างให้ แล้วมาตรวจ frontmatter และ system prompt ที่ได้

---

## Module 3.2: ออกแบบและสร้าง Sub-agent เฉพาะทาง

เราจะสร้าง Sub-agent 3 ตัวสำหรับ StockApp ที่ทำงานร่วมกันเป็น "ทีม QA + Security"

---

### 🛠️ ขั้นตอนที่ 1: สร้าง code-reviewer agent

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ .claude/agents/code-reviewer.md สำหรับโปรเจกต์ stock-app
ให้เป็น sub-agent ที่ทำหน้าที่ตรวจสอบโค้ด TypeScript/Next.js 16
โดยมี:
- frontmatter: name=code-reviewer, model=claude-sonnet-4-6, tools=[Read, Grep, Glob]
- description อธิบายว่าตรวจโค้ดก่อน merge ในด้านความถูกต้อง pattern และ best practice
- system prompt ให้ตรวจ: TypeScript type safety, Next.js App Router patterns,
  Prisma ORM (N+1, transaction), Code Style (ห้าม semicolon, single quote),
  Error Handling
- กฎสำคัญ: ห้ามใช้ semicolon (;) ในทุกตัวอย่างโค้ด
- format ผลลัพธ์เป็น Markdown: ✅ จุดที่ดี / ⚠️ ต้องแก้ไข / 💡 ข้อเสนอแนะ / 📊 สรุปคะแนน
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ `.claude/agents/code-reviewer.md` พร้อม YAML frontmatter และ system prompt ครบถ้วน ไม่ขอ permission พิเศษ (เป็นแค่การสร้างไฟล์)

**✅ Checkpoint ตรวจสอบ:**
- frontmatter มี `name`, `description`, `tools`, `model` ครบ
- `description` อ่านแล้วเข้าใจบทบาทชัดเจน (Claude ใช้ตัดสินใจว่าจะเรียก agent นี้เมื่อไร)
- ตรวจหา semicolon (;) ในส่วน example code ภายใน system prompt — ต้องไม่มี
- รัน `/agents` ใน Claude Code แล้วเห็น `code-reviewer` ในรายการ

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**

~~~markdown
---
name: code-reviewer
description: ตรวจสอบโค้ด TypeScript/Next.js ของ stock-app ในด้านความถูกต้อง, pattern, และ best practice ก่อน merge
tools:
  - Read
  - Grep
  - Glob
model: claude-sonnet-4-6
---

คุณคือ Senior Code Reviewer ที่มีความเชี่ยวชาญด้าน Next.js 16 App Router, TypeScript และ Prisma ORM

## โปรเจกต์ที่ดูแล
- ชื่อ: stock-app (ระบบคลังสินค้าเบิกจ่าย)
- Stack: Next.js 16 + TypeScript + Prisma + PostgreSQL + Tailwind
- กฎสำคัญ: ห้ามใช้ semicolon (;) ในโค้ด TypeScript/JavaScript ทุกบรรทัด

## หน้าที่ของคุณ
เมื่อได้รับโค้ดหรือ diff ให้ตรวจสอบในประเด็นต่อไปนี้:

### 1. TypeScript Type Safety
- ตรวจว่ามีการใช้ `any` โดยไม่จำเป็นหรือไม่
- Props ทุกตัวมี interface หรือ type กำหนดชัดเจน
- Return type ของ function ที่ export ออกไปต้องระบุชัด
- ตรวจ Prisma return types ว่า handle null/undefined ครบ

### 2. Next.js App Router Patterns
- Server Component vs Client Component แยกใช้ถูกต้อง
- `'use client'` directive อยู่บนสุดของไฟล์
- Server Action ใช้ `'use server'` ถูกที่
- การ fetch data ใน Server Component ไม่ผ่าน API route โดยไม่จำเป็น
- `revalidatePath` / `revalidateTag` เรียกหลัง mutation

### 3. Prisma ORM
- Query ไม่มี N+1 problem (ใช้ `include` แทนการ query ซ้อน)
- Transaction ใช้ `prisma.$transaction` เมื่อต้องการ atomicity
- ไม่ expose prisma client ตรง ๆ ใน client-side code

### 4. Code Style
- ไม่มี semicolon (;) ในโค้ด TS/JS
- ใช้ single quote สำหรับ string
- ตัวแปรชื่อสื่อความหมาย ไม่ใช้ชื่อย่อที่ไม่ชัดเจน
- ไม่มี console.log ค้างในโค้ด production

### 5. Error Handling
- try/catch ครอบทุก async operation ที่ต่อ external service
- Error message สื่อความหมาย ไม่ใช่ generic "Something went wrong"

## Format ผลลัพธ์

ตอบเป็น Markdown ดังนี้:

### ✅ จุดที่ดี
- รายการสิ่งที่โค้ดทำได้ดี

### ⚠️ ต้องแก้ไข (Critical)
- **[ไฟล์:บรรทัด]** คำอธิบายปัญหา
- วิธีแก้ไขพร้อมตัวอย่างโค้ด

### 💡 ข้อเสนอแนะ (Non-critical)
- ข้อเสนอแนะที่ทำให้โค้ดดีขึ้นแต่ไม่บังคับ

### 📊 สรุปคะแนน
- **ผ่าน / ไม่ผ่าน** พร้อมเหตุผลสั้น ๆ
~~~

---

### 🛠️ ขั้นตอนที่ 2: สร้าง test-writer agent

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ .claude/agents/test-writer.md สำหรับโปรเจกต์ stock-app
ให้เป็น sub-agent QA Engineer เชี่ยวชาญ Vitest + Testing Library
โดยมี:
- frontmatter: name=test-writer, model=claude-sonnet-4-6,
  tools=[Read, Write, Grep, Glob, Bash]
- description: เขียน unit test และ integration test สำหรับ stock-app
- system prompt ครอบคลุม:
  - Prisma Models: Product (id, sku, name, category, unit, quantity, reorderPoint, price)
    และ StockTransaction (id, productId, type IN|OUT, quantity, note, createdAt)
  - Business logic สำคัญ: Stock In เพิ่ม quantity, Stock Out ห้ามเกิน quantity,
    Reorder Point แจ้งเตือน, SKU unique
  - โครงสร้าง __tests__/unit, __tests__/integration, __tests__/components
  - Mock Prisma ด้วย jest-mock-extended
  - กฎ: ห้าม semicolon, ตั้งชื่อ describe/it เป็นภาษาไทย, arrange-act-assert
  - หลังเขียน test ให้รัน pnpm test แล้วแสดงผล
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ `.claude/agents/test-writer.md` พร้อม system prompt ครอบคลุม business logic ของ stock-app และ mock pattern สำหรับ Prisma

**✅ Checkpoint ตรวจสอบ:**
- `tools` มี `Write` และ `Bash` (จำเป็นสำหรับการเขียนไฟล์ test และรัน pnpm test)
- system prompt ระบุ Prisma Model schema ถูกต้องตรงกับโปรเจกต์จริง
- ตรวจว่า mock Prisma pattern ใช้ `jest-mock-extended` และ `vi.mock` ถูกต้อง
- ไม่มี semicolon ในตัวอย่างโค้ดใน system prompt

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**

~~~markdown
---
name: test-writer
description: เขียน unit test และ integration test สำหรับ stock-app ด้วย Vitest และ Testing Library โดยเน้น business logic ของระบบคลังสินค้า
tools:
  - Read
  - Write
  - Grep
  - Glob
  - Bash
model: claude-sonnet-4-6
---

คุณคือ QA Engineer ที่เชี่ยวชาญการเขียน automated test สำหรับ Next.js + TypeScript

## โปรเจกต์ที่ดูแล
- ชื่อ: stock-app (ระบบคลังสินค้าเบิกจ่าย)
- Stack: Next.js 16 + TypeScript + Prisma + PostgreSQL + Tailwind
- Testing: Vitest + @testing-library/react + @testing-library/user-event
- กฎสำคัญ: ห้ามใช้ semicolon (;) ในโค้ด TypeScript/JavaScript ทุกบรรทัด

## Prisma Models ที่เกี่ยวข้อง
Product: id, sku (unique), name, category, unit, quantity, reorderPoint, price, createdAt, updatedAt
StockTransaction: id, productId, type (IN|OUT), quantity, note?, createdAt

## หลักการเขียน Test

### 1. ครอบคลุม Business Logic ที่สำคัญ
- Stock In: quantity ต้องเพิ่มขึ้นถูกต้อง
- Stock Out: ห้าม out เกิน quantity ที่มี
- Reorder Point: แจ้งเตือนเมื่อ quantity <= reorderPoint
- SKU: ต้อง unique ไม่ซ้ำกัน
- Auth (Better Auth): action ที่เปลี่ยนข้อมูลต้องมี session ที่ login แล้ว และหน้า protected ต้องถูก proxy (src/proxy.ts) redirect ไป `/login` เมื่อยังไม่ได้ login

### 2. รูปแบบ Test ที่ใช้
- **Unit Test**: ทดสอบ utility functions และ business logic แยกส่วน
- **Integration Test**: ทดสอบ Server Actions กับ mock Prisma
- **Component Test**: ทดสอบ React Component ด้วย Testing Library

### 3. โครงสร้างไฟล์ Test
stock-app/
└── __tests__/
    ├── unit/
    │   └── stock.utils.test.ts
    ├── integration/
    │   └── stock-actions.test.ts
    └── components/
        └── ProductTable.test.tsx

### 4. Mock Prisma
ใช้ vitest.mock และ mockDeep จาก jest-mock-extended:
```typescript
import { mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@/generated/prisma/client'
// หมายเหตุ (Prisma 7): import PrismaClient จาก generated path และ mock named export `prisma`
vi.mock('@/lib/prisma', () => ({ prisma: mockDeep<PrismaClient>() }))
```

## Format ผลลัพธ์
- เขียนไฟล์ test พร้อม import ครบ
- ตั้งชื่อ describe และ it ให้เป็นภาษาไทยที่อ่านเข้าใจง่าย
- ทุก test ต้องมี arrange-act-assert structure
- ไม่มี semicolon (;) ในโค้ดที่เขียน
- หลังเขียนเสร็จ รัน pnpm test แล้วแสดงผล
~~~

---

### 🛠️ ขั้นตอนที่ 3: สร้าง security-auditor agent

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ .claude/agents/security-auditor.md สำหรับโปรเจกต์ stock-app
ให้เป็น sub-agent Security Engineer เชี่ยวชาญ OWASP Top 10 สำหรับ Next.js
โดยมี:
- frontmatter: name=security-auditor, model=claude-opus-4-5, tools=[Read, Grep, Glob]
  (ใช้ Opus เพราะงาน security ต้องการความแม่นยำสูงสุด)
- description: ตรวจสอบความปลอดภัยด้าน OWASP Top 10, SQL Injection, XSS,
  Auth และ secrets exposure
- system prompt ครอบคลุม 7 หัวข้อ:
  1. Injection: ตรวจ raw SQL, prisma.$queryRaw ต้องใช้ Prisma.sql
  2. Auth: ตรวจ session/auth ใน route และ Server Action ทุกตัว
  3. XSS: ตรวจ dangerouslySetInnerHTML
  4. Secrets: ตรวจ API key ใน source code, .env ใน .gitignore
  5. CORS/Headers: next.config.ts, security headers
  6. Rate Limiting: ป้องกัน brute force
  7. Dependencies: รัน pnpm audit
- format: 🔴 Critical / 🟡 Medium / 🟢 Low / 📋 Security Score 0-100
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ `.claude/agents/security-auditor.md` ตั้ง `model: claude-opus-4-5` (ต่างจาก agent อื่น) เพื่อให้ได้ผลการ audit ที่ละเอียดที่สุด

**✅ Checkpoint ตรวจสอบ:**
- `model` ต้องเป็น `claude-opus-4-5` (ไม่ใช่ sonnet) — จุดที่ AI มักตั้งค่าผิดโดยใช้ model เดิมกับ agent ก่อนหน้า
- `tools` ไม่ควรมี `Write` หรือ `Bash` (agent นี้แค่ตรวจ ไม่แก้ไฟล์เอง)
- รายการตรวจสอบครบ 7 หัวข้อตามที่ระบุ
- Format ผลลัพธ์มี severity level ชัดเจนและ Security Score

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**

~~~markdown
---
name: security-auditor
description: ตรวจสอบความปลอดภัยของโค้ด stock-app ในด้าน OWASP Top 10, SQL Injection, XSS, Auth และ secrets exposure
tools:
  - Read
  - Grep
  - Glob
model: claude-opus-4-5
---

คุณคือ Security Engineer ที่เชี่ยวชาญด้าน Web Application Security สำหรับ Next.js

## โปรเจกต์ที่ดูแล
- ชื่อ: stock-app (ระบบคลังสินค้าเบิกจ่าย)
- Stack: Next.js 16 + TypeScript + Prisma + PostgreSQL

## รายการตรวจสอบความปลอดภัย

### 1. Injection Attacks
- ตรวจว่าใช้ Prisma ORM ทุกที่ (ไม่มี raw SQL ที่ไม่ sanitize)
- หากใช้ `prisma.$queryRaw` ต้องใช้ `Prisma.sql` template literal เท่านั้น
- ห้าม interpolate ค่า user input ลง SQL string โดยตรง

### 2. Authentication & Authorization
- ตรวจ route ทุกตัวว่ามีการตรวจสอบ session/auth ก่อนเข้าถึง
- Server Actions ต้องตรวจสิทธิ์ก่อนทำ mutation
- ตรวจว่าไม่มีการ expose ข้อมูลผู้ใช้อื่นผ่าน API

### 3. XSS (Cross-Site Scripting)
- ตรวจว่าไม่มีการใช้ `dangerouslySetInnerHTML` โดยไม่จำเป็น
- ถ้าใช้ต้องผ่าน sanitization library เช่น DOMPurify

### 4. Sensitive Data Exposure
- ตรวจว่าไม่มี API key, secret, password ใน source code
- Environment variables ต้องใช้ผ่าน `process.env` และไฟล์ `.env` ต้องอยู่ใน `.gitignore`
- Response จาก API ไม่ควร expose ข้อมูลที่ไม่จำเป็น

### 5. CORS และ Headers
- ตรวจ `next.config.ts` ว่า CORS settings ไม่กว้างเกินไป
- Security headers เช่น `X-Frame-Options`, `Content-Security-Policy` ตั้งค่าแล้ว

### 6. Rate Limiting
- API routes ที่รับ input จากภายนอกควรมี rate limiting
- ตรวจว่ามี protection ต่อ brute force

### 7. Dependency Vulnerabilities
- รัน `pnpm audit` และรายงาน vulnerabilities ที่พบ

## Format ผลลัพธ์

### 🔴 Critical (ต้องแก้ทันที)
- รายการช่องโหว่ระดับสูง พร้อมตำแหน่งไฟล์และวิธีแก้

### 🟡 Medium (ควรแก้ก่อน release)
- รายการปัญหาระดับกลาง

### 🟢 Low / Informational
- ข้อเสนอแนะเพิ่มเติม

### 📋 Security Score
- คะแนนรวม 0-100 พร้อมสรุปสั้น ๆ
~~~

---

### 3.2.4 จัดการ Sub-agents ด้วย `/agents`

หลังสร้างไฟล์ agent ทั้ง 3 แล้ว ตรวจสอบผ่าน Claude Code:

```
/agents
```

คำสั่ง `/agents` จะแสดงรายการ agent ทั้งหมดที่พบในโปรเจกต์และ global ให้เลือกดู แก้ไข หรือลบได้

ควรเห็น:
```
Project agents (stock-app):
  • code-reviewer — ตรวจสอบโค้ด TypeScript/Next.js...
  • test-writer — เขียน unit test และ integration test...
  • security-auditor — ตรวจสอบความปลอดภัยของโค้ด...
```

> **Key Concept:** Claude Code อ่าน `description` ใน frontmatter เพื่อตัดสินใจว่าจะเรียก sub-agent ตัวไหน เมื่อ main agent ได้รับ prompt ที่ตรงกับคำอธิบาย มันจะ delegate งานไปให้อัตโนมัติ หรือคุณสั่งตรงได้โดยระบุชื่อ agent

---

## Module 3.3: Orchestration และการทำงานแบบขนาน

### การมอบหมายงานให้ Sub-agent

**วิธีที่ 1 — ปล่อยให้ Main agent ตัดสินใจ:**
```
ช่วยตรวจสอบไฟล์ app/products/actions.ts ก่อนที่ฉันจะ merge
```
Main agent จะอ่าน description ของ agent ทั้งหมด แล้วเลือก code-reviewer และ security-auditor มาทำงาน

**วิธีที่ 2 — ระบุ agent โดยตรง:**
```
ใช้ test-writer เขียน test สำหรับ lib/stock-utils.ts
```

**วิธีที่ 3 — สั่งงานหลาย agent พร้อมกัน (Parallel):**
```
ช่วยทำทั้งสองอย่างพร้อมกัน:
1. code-reviewer: ตรวจ app/products/actions.ts
2. test-writer: เขียน test สำหรับ lib/stock-utils.ts
```

### ตัวอย่าง Parallel Orchestration บน StockApp

```
ฉันเพิ่งเขียนฟีเจอร์ Stock Out เสร็จ ช่วยทำสามอย่างนี้พร้อมกันได้เลย:
1. code-reviewer: ตรวจสอบ app/stock/actions.ts และ components/StockOutForm.tsx
2. test-writer: เขียน test ครอบคลุม business logic Stock Out (ห้าม out เกิน quantity)
3. security-auditor: สแกน app/stock/ ทั้งโฟลเดอร์
```

Claude Code จะ spawn sub-agent ทั้งสาม รันแบบขนาน แล้วรวมผลกลับมาให้คุณ

### การเรียก Agent ซ้อนกัน (Nested / Sequential)

Main agent สามารถสั่งให้ทำงานแบบ sequential โดยอิงผลจาก agent แรก:

```
ขั้นตอน: code-reviewer ตรวจโค้ดก่อน
หาก Critical issues น้อยกว่า 3 ข้อ ค่อยให้ test-writer เขียน test
มิฉะนั้น แจ้งว่าต้องแก้ไขก่อน
```

### Best Practice: Prompt ที่ดีสำหรับ Orchestration

| ❌ Prompt ที่ไม่ดี | ✅ Prompt ที่ดี |
|---|---|
| "ตรวจโค้ดหน่อย" | "code-reviewer: ตรวจ `app/products/` ทั้งโฟลเดอร์ โดยเน้นเรื่อง N+1 query และ error handling" |
| "เขียน test" | "test-writer: เขียน integration test สำหรับ Stock In action ครอบคลุม happy path และ edge case (quantity เป็น 0, ติดลบ)" |
| "ดูความปลอดภัย" | "security-auditor: สแกน API routes ทั้งหมดใน `app/api/` เน้น auth check และ input validation" |

---

## Module 3.4: ต่อโลกภายนอกด้วย MCP

### MCP คืออะไร?

**MCP (Model Context Protocol)** คือโปรโตคอลมาตรฐานแบบ open-source ที่ Anthropic สร้างขึ้น เพื่อให้ Claude เชื่อมต่อกับ "เครื่องมือ" และ "ข้อมูล" ภายนอกได้อย่างปลอดภัยและเป็นระบบ

เปรียบเทียบ: MCP เหมือน "USB-C สำหรับ AI" — มาตรฐานเดียว เชื่อมได้ทุกอย่าง

### สถาปัตยกรรม MCP

```
┌──────────────────────────────────────────────────────────┐
│                    Claude Code (Client)                   │
│                                                          │
│  ต้องการ query ข้อมูล stock จาก database                │
└─────────────────────┬────────────────────────────────────┘
                      │  MCP Protocol (JSON-RPC over stdio)
                      │
         ┌────────────▼───────────┐
         │    MCP Server          │
         │  (postgres-mcp)        │
         │                        │
         │  รับคำสั่ง SQL จาก     │
         │  Claude แล้ว execute   │
         │  กับ PostgreSQL จริง   │
         └────────────┬───────────┘
                      │  PostgreSQL connection
                      ▼
         ┌────────────────────────┐
         │    PostgreSQL DB       │
         │  (stock-app database)  │
         └────────────────────────┘
```

**MCP Server ที่นิยมใช้:**

| MCP Server | ใช้ทำอะไร |
|---|---|
| `@modelcontextprotocol/server-postgres` | Query PostgreSQL โดยตรง |
| `@modelcontextprotocol/server-github` | อ่าน/สร้าง PR, Issue บน GitHub |
| `@modelcontextprotocol/server-filesystem` | อ่าน/เขียนไฟล์นอก working dir |
| `@modelcontextprotocol/server-brave-search` | ค้นหาเว็บผ่าน Brave Search API |
| `@modelcontextprotocol/server-slack` | ส่งข้อความ Slack |

---

### 🛠️ ขั้นตอนที่ 4: สร้างไฟล์ `.mcp.json` เชื่อม PostgreSQL และ GitHub

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ .mcp.json ที่ root ของโปรเจกต์ stock-app
เพื่อเชื่อมต่อ MCP server 2 ตัว:
1. postgres — ใช้ @modelcontextprotocol/server-postgres
   connection string: postgresql://postgres:yourpassword@localhost:5432/stockapp
2. github — ใช้ @modelcontextprotocol/server-github
   ให้รับ token จาก environment variable GITHUB_TOKEN

และเพิ่ม .mcp.json ลงใน .gitignore เพื่อป้องกัน credentials รั่ว
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ `.mcp.json` ที่ root ของโปรเจกต์ และแก้ไขไฟล์ `.gitignore` เพิ่ม entry `.mcp.json` ให้

**✅ Checkpoint ตรวจสอบ:**
- `.mcp.json` อยู่ที่ root ของโปรเจกต์ (ระดับเดียวกับ `package.json`)
- `"mcpServers"` (พหูพจน์) — จุดที่ AI มักพิมพ์ผิดเป็น `"mcpServer"` (ขาด s)
- ไม่มี password จริงใน git — ตรวจว่า `.mcp.json` อยู่ใน `.gitignore` แล้ว
- รัน `/mcp` ใน Claude Code แล้วเห็น `✅ postgres — connected`

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:yourpassword@localhost:5432/stockapp"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

> **หมายเหตุความปลอดภัย:** ไม่ควรใส่ password ตรง ๆ ใน `.mcp.json` หากโปรเจกต์อยู่บน Git ให้ใช้ environment variable แทน และเพิ่ม `.mcp.json` ใน `.gitignore` หรือใช้ user-level config

### ตั้งค่าผ่าน `claude mcp add` (ทางเลือก)

นอกจากไฟล์ `.mcp.json` ยังตั้งค่าผ่าน CLI ได้:

```bash
# เพิ่ม MCP server สำหรับ PostgreSQL (project scope)
claude mcp add postgres \
  --command "npx" \
  --args "-y,@modelcontextprotocol/server-postgres,postgresql://localhost:5432/stockapp"

# เพิ่ม MCP server สำหรับ GitHub
claude mcp add github \
  --command "npx" \
  --args "-y,@modelcontextprotocol/server-github" \
  --env "GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxx"

# ดูรายการ MCP server ที่ตั้งค่าไว้
claude mcp list

# ลบ MCP server
claude mcp remove postgres
```

**ตรวจสอบสถานะ MCP ใน Claude Code:**

```
/mcp
```

จะแสดงรายการ MCP server พร้อมสถานะ (connected / error) และ tools ที่พร้อมใช้:

```
✅ postgres — connected
   Tools: query, list_tables, describe_table

✅ github — connected
   Tools: create_issue, create_pull_request, list_pull_requests
```

### ตัวอย่างการใช้ MCP กับ stock-app จริง

เมื่อ MCP เชื่อมต่อแล้ว สั่งงานผ่าน prompt ได้เลย:

**Query สินค้าใกล้หมดสต็อก:**
```
ช่วย query ฐานข้อมูล stock-app เพื่อหาสินค้าที่ quantity <= reorderPoint
แล้วแสดงผลเป็น Markdown table พร้อมคอลัมน์: sku, name, quantity, reorderPoint
```

Claude จะใช้ MCP postgres tool รัน SQL อัตโนมัติ:

```sql
SELECT sku, name, quantity, "reorderPoint"
FROM "Product"
WHERE quantity <= "reorderPoint"
ORDER BY quantity ASC
```

**สร้าง GitHub Issue อัตโนมัติ:**
```
จากผลลัพธ์ข้างต้น ช่วยสร้าง GitHub Issue ในชื่อ "แจ้งเตือน: สินค้าใกล้หมดสต็อก"
พร้อมรายชื่อสินค้า และ label "stock-alert"
```

**วิเคราะห์แนวโน้มจากข้อมูลจริง:**
```
ช่วย query จำนวน StockTransaction ในแต่ละเดือนย้อนหลัง 6 เดือน
แยกตาม type (IN/OUT) แล้วสรุปว่าเดือนไหนมีการเบิกจ่ายสูงสุด
```

---

## Module 3.5: Automate ด้วย Hooks

### Hooks คืออะไร?

Hooks คือระบบ callback ของ Claude Code ที่ให้คุณ **รันคำสั่ง shell อัตโนมัติ** เมื่อเกิด event บางอย่างระหว่าง Claude ทำงาน

เปรียบเหมือน Git hooks — แต่เป็นของ Claude Code

### Events ที่รองรับ

| Event | เกิดเมื่อ | ใช้ทำอะไร |
|---|---|---|
| `PreToolUse` | ก่อน Claude ใช้ tool | ตรวจสอบก่อนอนุญาต, log การใช้งาน |
| `PostToolUse` | หลัง Claude ใช้ tool เสร็จ | รัน linter, formatter, test |
| `UserPromptSubmit` | ผู้ใช้ส่ง prompt | แปลง prompt, inject context เพิ่ม |
| `Stop` | Claude หยุดทำงาน | notification, cleanup, type check |
| `SessionStart` | เริ่ม session ใหม่ | โหลด context, แสดงสถานะ |

### โครงสร้าง Hooks ใน `.claude/settings.json`

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolName",
        "hooks": [
          {
            "type": "command",
            "command": "คำสั่ง shell ที่ต้องการรัน"
          }
        ]
      }
    ]
  }
}
```

**อธิบาย field:**
- `EventName` — ชื่อ event เช่น `PostToolUse`
- `matcher` — ชื่อ tool ที่ต้องการ match เช่น `Write`, `Edit`, หรือ `""` สำหรับทุก tool
- `type` — ปัจจุบันรองรับ `"command"` เท่านั้น
- `command` — shell command ที่จะรัน (รันใน shell ของระบบ)

### Environment Variables ที่ Hooks ใช้ได้

| Variable | ค่า |
|---|---|
| `$CLAUDE_TOOL_INPUT_FILE_PATH` | Path ของไฟล์ที่ถูก Write/Edit |
| `$CLAUDE_TOOL_INPUT_COMMAND` | คำสั่งที่ Bash tool กำลังจะรัน |
| `$CLAUDE_TOOL_NAME` | ชื่อ tool ที่ถูกเรียก |
| `$CLAUDE_SESSION_ID` | ID ของ session ปัจจุบัน |

---

### 🛠️ ขั้นตอนที่ 5: สร้าง Hooks อัตโนมัติใน `.claude/settings.json`

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างหรืออัปเดตไฟล์ .claude/settings.json สำหรับโปรเจกต์ stock-app
โดยตั้ง hooks ดังนี้:

PostToolUse (matcher: Write และ Edit):
- ถ้าไฟล์เป็น .ts หรือ .tsx ให้รัน pnpm prettier --write บนไฟล์นั้น
  แล้วแสดงข้อความ "✅ Prettier formatted: <ชื่อไฟล์>"
- ถ้าไฟล์เป็น .test.ts หรือ .test.tsx ให้รัน pnpm vitest run บนไฟล์นั้น
  แสดงผล 20 บรรทัดท้าย

PreToolUse (matcher: Bash):
- log คำสั่งที่ Claude รัน พร้อม timestamp ลงไฟล์ /tmp/claude-stock-app-audit.log

Stop (matcher: ""):
- รัน pnpm tsc --noEmit แล้วแสดงผล TypeScript check ทั้งโปรเจกต์

SessionStart (matcher: ""):
- แสดงข้อความ stock-app session เริ่มแล้วพร้อมวันเวลา และรัน git status --short

ใช้ environment variable $CLAUDE_TOOL_INPUT_FILE_PATH สำหรับ path ของไฟล์
แก้ /path/to/stock-app ให้เป็น path จริงของโปรเจกต์นี้
```

**🤖 Claude Code จะทำอะไร:** อ่าน path ของโปรเจกต์จาก working directory แล้วสร้าง/แก้ไข `.claude/settings.json` ใส่ hooks ทั้ง 4 event พร้อม command จริง

**✅ Checkpoint ตรวจสอบ:**
- `matcher` สะกดตรงกับชื่อ tool จริง (`Write`, `Edit`, `Bash`) — ตัวพิมพ์ใหญ่สำคัญ
- path `/path/to/stock-app` ถูกแทนที่ด้วย path จริง ไม่ใช่ placeholder
- ทดสอบโดยสั่ง Claude แก้ไฟล์ `.ts` ไฟล์ใดไฟล์หนึ่ง แล้วดูว่า Prettier รันอัตโนมัติ
- ตรวจ `/tmp/claude-stock-app-audit.log` ว่ามีการ log คำสั่ง Bash จริง

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=\"$CLAUDE_TOOL_INPUT_FILE_PATH\"; if [[ \"$FILE\" == *.ts || \"$FILE\" == *.tsx ]]; then cd /path/to/stock-app && pnpm prettier --write \"$FILE\" 2>&1 | tail -1 && echo \"✅ Prettier formatted: $FILE\"; fi"
          }
        ]
      },
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=\"$CLAUDE_TOOL_INPUT_FILE_PATH\"; if [[ \"$FILE\" == *.ts || \"$FILE\" == *.tsx ]]; then cd /path/to/stock-app && pnpm prettier --write \"$FILE\" 2>&1 | tail -1 && echo \"✅ Prettier formatted: $FILE\"; fi"
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=\"$CLAUDE_TOOL_INPUT_FILE_PATH\"; if [[ \"$FILE\" == *.test.ts || \"$FILE\" == *.test.tsx ]]; then cd /path/to/stock-app && echo \"🧪 Running tests for $FILE...\" && pnpm vitest run \"$FILE\" --reporter=verbose 2>&1 | tail -20; fi"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"[$(date '+%H:%M:%S')] Claude Bash: $CLAUDE_TOOL_INPUT_COMMAND\" >> /tmp/claude-stock-app-audit.log"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "cd /path/to/stock-app && echo \"🔍 TypeScript check...\" && pnpm tsc --noEmit 2>&1 | tail -10 && echo \"✅ TypeScript check เสร็จสิ้น\""
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"🚀 Stock-app session เริ่มแล้ว: $(date '+%Y-%m-%d %H:%M')\" && cd /path/to/stock-app && git status --short 2>/dev/null && echo \"---\""
          }
        ]
      }
    ]
  }
}
```

### ภาพรวมการทำงาน: Hook อัตโนมัติใน Stock-app

```
Claude แก้ไขไฟล์ app/products/page.tsx
              │
              ▼
   Edit tool ทำงานเสร็จ
              │
              ▼
   PostToolUse event trigger
              │
              ├── Hook 1: prettier --write → format code
              │
              └── Hook 2: ตรวจว่าเป็น .test.tsx ไหม?
                          ใช่ → pnpm vitest run
                          ไม่ใช่ → ข้าม
              │
              ▼
   Claude ทำงานต่อ (ไม่ต้องรอ)
              │
              ▼
   เมื่อ Claude หยุด → Stop event
              │
              ▼
   Hook: pnpm tsc --noEmit (ตรวจ TypeScript ทั้งโปรเจกต์)
```

> **Key Concept:** Hooks ทำให้ Claude Code กลายเป็น "self-correcting" — เขียนโค้ดผิด format ก็แก้เองทันที, เขียน test ก็รันทดสอบเองเลย คุณได้ feedback loop โดยไม่ต้องสั่งเพิ่มเติม

---

### 🛠️ ขั้นตอนที่ 6: สร้าง pre-commit-check.sh สำหรับ Hook PreToolUse

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ .claude/hooks/pre-commit-check.sh สำหรับโปรเจกต์ stock-app
ให้เป็น bash script ที่:
1. รัน pnpm tsc --noEmit ถ้า error ให้ exit 1 พร้อมข้อความ "❌ TypeScript errors พบ — ยกเลิก commit"
2. รัน pnpm eslint . --ext .ts,.tsx แสดง 5 บรรทัดท้าย แต่ไม่ block commit
3. แสดงข้อความ "✅ พร้อม commit" ตอนจบ

จากนั้นอัปเดต .claude/settings.json เพิ่ม hook ใน PreToolUse
ที่ตรวจว่าคำสั่ง Bash ที่ Claude จะรันนั้นมีคำว่า "git commit" ไหม
ถ้ามีให้รัน script นี้ก่อน
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ `.claude/hooks/pre-commit-check.sh` และอัปเดต `.claude/settings.json` เพิ่ม hook ใหม่ใน `PreToolUse` โดยรวมกับ audit log hook เดิม

**✅ Checkpoint ตรวจสอบ:**
- script มีสิทธิ์ execute — รัน `ls -la .claude/hooks/` ดูว่ามี `x` permission (ถ้าไม่มีสั่ง `chmod +x`)
- hook ใน `settings.json` ใช้ `grep -q 'git commit'` ตรวจคำสั่งอย่างถูกต้อง
- ทดสอบโดยสั่ง Claude ให้ทำ `git commit` แล้วดูว่า script รันก่อน

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**

```bash
#!/bin/bash
# pre-commit-check.sh — รัน typecheck และ lint ก่อน Claude commit

echo "🔍 ตรวจสอบ TypeScript..."
cd /path/to/stock-app

# TypeScript check
pnpm tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors พบ — ยกเลิก commit"
  exit 1
fi
echo "✅ TypeScript ผ่าน"

# ESLint check
echo "🔍 ตรวจสอบ ESLint..."
pnpm eslint . --ext .ts,.tsx 2>&1 | tail -5
if [ $? -ne 0 ]; then
  echo "⚠️ ESLint warnings พบ — กรุณาตรวจสอบ"
fi

echo "✅ พร้อม commit"
```

hook ส่วน PreToolUse ที่เพิ่มใน `settings.json`:

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "CMD=\"$CLAUDE_TOOL_INPUT_COMMAND\"; if echo \"$CMD\" | grep -q 'git commit'; then bash /path/to/stock-app/.claude/hooks/pre-commit-check.sh; fi"
    }
  ]
}
```

---

## Module 3.6: Agent Skills — ติดอาวุธความรู้เฉพาะทางให้ Claude

### Skills คืออะไร?

**Agent Skills** คือความสามารถ/ความรู้เฉพาะทางที่เราจัดเตรียมให้ Claude ค้นเจอและ **หยิบมาใช้เองอัตโนมัติ** เมื่องานที่ได้รับตรงกับ description ที่กำหนดไว้

แนวคิดคือ "**progressive disclosure**" — แทนที่จะยัดความรู้ทั้งหมดเข้า context ตั้งแต่ต้น Claude จะโหลด skill เฉพาะตอนที่เกี่ยวข้องเท่านั้น ทำให้ประหยัด context window และได้ความรู้ที่ถูก domain เสมอ

**ตัวอย่างที่เห็นภาพ:** ถ้าเราสร้าง skill ชื่อ `stock-report` สำหรับ StockApp ทุกครั้งที่ถามว่า "สรุปสถานะสินค้า" Claude จะหยิบ skill นั้นมาใช้เองโดยอัตโนมัติ โดยไม่ต้องระบุทุกครั้ง

### ทำไม Skills ถึงมีประโยชน์?

- **ห่อความรู้เฉพาะ domain** — ขั้นตอนซ้ำ ๆ หรือ business logic เฉพาะโปรเจกต์ใส่ลง skill ได้
- **ประหยัด context** — skill โหลดเฉพาะตอนเกี่ยวข้อง ไม่เปลืองที่ตลอดเวลา
- **Model-invoked** — Claude ตัดสินใจหยิบมาใช้เองจาก description ไม่ต้องเรียกด้วย /command

### โครงสร้างโฟลเดอร์

```
stock-app/
└── .claude/
    └── skills/
        └── stock-report/             ← หนึ่งโฟลเดอร์ = หนึ่ง skill
            └── SKILL.md              ← ไฟล์หลัก (frontmatter + instructions)

~/.claude/
└── skills/
    └── my-global-skill/              ← skill ระดับ user (ใช้ทุกโปรเจกต์)
        └── SKILL.md
```

> **สำคัญ:** แต่ละ skill คือ **โฟลเดอร์** ไม่ใช่ไฟล์เดี่ยว — `.claude/skills/<ชื่อ-skill>/SKILL.md` สามารถมีไฟล์ประกอบอื่น ๆ (เช่น script, template) อยู่ในโฟลเดอร์เดียวกันได้ การเพิ่ม/แก้/ลบ skill มีผลทันทีใน session โดยไม่ต้อง restart

### โครงสร้าง SKILL.md

```markdown
---
name: ชื่อ skill (ไม่มีช่องว่าง)
description: คำอธิบายสั้น ๆ ว่า skill ทำอะไร — Claude ใช้ตัดสินใจว่าจะหยิบ skill นี้มาเมื่อไร
---

[เนื้อหา instructions — ขั้นตอน, กฎ, format ผลลัพธ์ ฯลฯ]
```

> **Key Concept:** `description` สำคัญที่สุด — ต้องอธิบายให้ชัดว่า skill นี้เหมาะกับ task ประเภทไหน เพราะ Claude ใช้มันตัดสินใจว่าควรหยิบ skill นี้มาใช้หรือไม่

### เปรียบเทียบ: Skill vs เครื่องมืออื่น

| เครื่องมือ | ใครเรียก | ทำอะไร | เหมาะกับ |
|---|---|---|---|
| **Slash Command** | เราเรียกเองด้วย `/ชื่อ` | Prompt สำเร็จรูป inject เข้า context | shortcut ที่เราเลือกเองทุกครั้ง |
| **Sub-agent** | เราสั่ง หรือ main agent delegate | AI แยกตัวที่มี context isolation + system prompt + tools | งานที่ต้องการ focus เฉพาะทาง |
| **Hook** | event อัตโนมัติ (PostToolUse, Stop ฯลฯ) | รัน shell script เมื่อ event เกิด | automation ระดับ workflow |
| **Skill** | **Claude เลือกเองอัตโนมัติ** จาก description | โหลดความรู้/คู่มือเฉพาะทางเข้า context | domain knowledge ที่ต้องใช้เป็นครั้งคราว |

---

### 🛠️ ขั้นตอนที่ 7: สร้าง skill `stock-report` สำหรับ StockApp

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
สร้างโฟลเดอร์ .claude/skills/stock-report/ และไฟล์ SKILL.md ข้างใน
ให้เป็น skill สำหรับสร้างรายงานสถานะสต็อกและสรุปสินค้าใกล้หมดในรูปแบบมาตรฐาน

frontmatter ต้องมี:
- name: stock-report
- description: อธิบายชัดเจนว่า skill นี้ใช้เมื่อถูกถามเรื่องสรุปสถานะสต็อก,
  สินค้าใกล้หมด, รายงานคลังสินค้า หรือ stock summary

เนื้อหา instructions ให้ครอบคลุม:
- format รายงาน: หัวข้อวันที่ + ตาราง Markdown (sku, name, quantity, reorderPoint, สถานะ)
- สินค้าที่ quantity <= reorderPoint ให้ mark ว่า "⚠️ ใกล้หมด"
- สินค้าที่ quantity == 0 ให้ mark ว่า "🔴 หมดแล้ว"
- ท้ายรายงานให้มีสรุป: จำนวนสินค้าทั้งหมด, รายการที่ต้องสั่งซื้อ
- กฎ: ไม่มี semicolon ในตัวอย่างโค้ดใดก็ตาม
```

**🤖 Claude Code จะทำอะไร:** สร้างโฟลเดอร์ `.claude/skills/stock-report/` และไฟล์ `SKILL.md` ข้างใน พร้อม frontmatter และ instructions ครบถ้วน (ไม่ต้อง restart Claude Code — skill พร้อมใช้ทันที)

**✅ Checkpoint ตรวจสอบ:**
- `description` อ่านแล้วชัดว่า skill นี้จะถูกเรียกเมื่อถามเรื่อง "สต็อก/รายงาน/สินค้าใกล้หมด"
- frontmatter มีทั้ง `name` และ `description` ถูกต้อง (ไม่มี `tools` หรือ `model` เหมือน sub-agent)
- ทดสอบโดยพิมพ์ว่า `ช่วยสรุปสถานะสต็อกสินค้าในระบบหน่อย` แล้วดูว่า Claude หยิบ skill มาใช้หรือไม่
- ตรวจว่าไม่มี semicolon (;) ในตัวอย่างโค้ดภายใน instructions

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**

~~~markdown
---
name: stock-report
description: ใช้เมื่อถูกถามเรื่องสรุปสถานะสต็อก, รายงานสินค้าใกล้หมด, stock summary หรือภาพรวมคลังสินค้าของ stock-app
---

## วัตถุประสงค์

skill นี้กำหนด format มาตรฐานสำหรับรายงานสถานะคลังสินค้าของ stock-app
ให้ใช้ format นี้ทุกครั้งที่สร้างรายงานสต็อก ไม่ว่าจะดึงข้อมูลจาก MCP หรือจากโค้ด

## Format รายงาน

### หัวรายงาน
```
# รายงานสถานะคลังสินค้า
วันที่: <วันที่ปัจจุบัน>
สร้างโดย: Claude Code (stock-app)
```

### ตารางสินค้า
แสดงเป็น Markdown table ด้วยคอลัมน์:

| SKU | ชื่อสินค้า | คงเหลือ | จุดสั่งซื้อ | สถานะ |
|-----|-----------|---------|------------|-------|
| ...  | ...       | ...     | ...        | ...   |

### กฎการแสดงสถานะ
- quantity > reorderPoint → สถานะ "✅ ปกติ"
- quantity <= reorderPoint และ quantity > 0 → สถานะ "⚠️ ใกล้หมด"
- quantity == 0 → สถานะ "🔴 หมดแล้ว"

### สรุปท้ายรายงาน
```
## สรุป
- สินค้าทั้งหมด: X รายการ
- ปกติ: X รายการ
- ⚠️ ใกล้หมด (ต้องสั่งซื้อ): X รายการ
- 🔴 หมดแล้ว: X รายการ

### รายการที่ต้องสั่งซื้อด่วน
- <sku> — <ชื่อสินค้า> (คงเหลือ: X ชิ้น)
```

## หมายเหตุ
- หากมี MCP postgres เชื่อมต่ออยู่ ให้ query ข้อมูลจาก DB โดยตรงเสมอ
- หากไม่มี MCP ให้อ่านจาก source code หรือขอให้ผู้ใช้ provide ข้อมูล
- ห้ามใช้ semicolon (;) ในตัวอย่างโค้ดใดก็ตาม
~~~

> **Vibe Coding Note:** คุณไม่ต้องพิมพ์ SKILL.md เองทีละบรรทัด — สั่ง Claude Code ให้สร้างให้ แล้วมาตรวจ frontmatter และ instructions ที่ได้ว่า description ชัดเจนพอให้ Claude หยิบมาใช้ถูกเวลา

---

## 🎯 Workshop ท้ายวัน: ตั้งระบบ AI Quality Gate สำหรับ Stock-app

เป้าหมาย: เมื่อ Claude เขียนโค้ดใหม่ จะมีระบบตรวจสอบคุณภาพอัตโนมัติทั้ง sub-agent review, MCP database check และ hooks ทำงานร่วมกัน

---

### 🛠️ Workshop ขั้นตอนที่ 1: สร้างโครงสร้างโฟลเดอร์

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ในโปรเจกต์ stock-app ช่วยสร้างโครงสร้างโฟลเดอร์ต่อไปนี้:
- .claude/agents/
- .claude/hooks/
- .claude/skills/
และตรวจสอบว่าไฟล์ .claude/settings.json มีอยู่แล้วหรือยัง
ถ้ายังไม่มีให้สร้าง template ว่าง ถ้ามีแล้วอย่าเขียนทับ
```

**🤖 Claude Code จะทำอะไร:** รัน `mkdir -p` สร้างโฟลเดอร์ ตรวจสอบไฟล์ settings.json ด้วย Bash tool

**✅ Checkpoint ตรวจสอบ:** โครงสร้างสุดท้ายควรเป็น:

```
stock-app/
├── .claude/
│   ├── agents/
│   │   ├── code-reviewer.md
│   │   ├── test-writer.md
│   │   └── security-auditor.md
│   ├── hooks/
│   │   └── pre-commit-check.sh
│   ├── skills/
│   │   └── stock-report/
│   │       └── SKILL.md
│   └── settings.json
├── .mcp.json
└── ... (โค้ดโปรเจกต์)
```

---

### 🛠️ Workshop ขั้นตอนที่ 2: ยืนยัน Sub-agents โหลดครบ

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยตรวจสอบว่า sub-agents ทั้ง 3 ตัวในโปรเจกต์นี้โหลดถูกต้องหรือไม่
โดยอ่านไฟล์ .claude/agents/*.md ทั้งหมด
แล้วสรุปว่าแต่ละตัวมี frontmatter ครบหรือไม่ (name, description, tools, model)
```

**🤖 Claude Code จะทำอะไร:** อ่านไฟล์ agent ทั้งหมด ตรวจ frontmatter แล้วสรุปรายงาน

**✅ Checkpoint ตรวจสอบ:** พิมพ์ `/agents` ใน Claude Code แล้วต้องเห็น agent ทั้ง 3 ตัว

---

### 🛠️ Workshop ขั้นตอนที่ 3: ทดสอบ MCP Connection

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ตรวจสอบว่า MCP postgres เชื่อมต่อได้ไหม
โดย query ตาราง Product ทั้งหมด แล้วนับว่ามีสินค้ากี่รายการ
```

**🤖 Claude Code จะทำอะไร:** ใช้ MCP postgres tool รัน `SELECT COUNT(*) FROM "Product"` แล้วแสดงผล

**✅ Checkpoint ตรวจสอบ:**
- รัน `/mcp` ก่อน ดูสถานะว่า `✅ postgres — connected`
- ถ้าเห็น `❌ error` ให้ตรวจ connection string และ PostgreSQL service ว่ารันอยู่

---

### 🛠️ Workshop ขั้นตอนที่ 4: ทดสอบ Workflow เต็มรูปแบบ

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
เพิ่ม function calculateStockValue() ใน lib/stock-utils.ts
ที่คำนวณมูลค่าสินค้าคงคลังทั้งหมด (quantity * price ของทุก product)
return เป็น number ที่มีทศนิยม 2 ตำแหน่ง
กฎ: ห้ามใช้ semicolon (;) ในโค้ด

หลังจากเขียนเสร็จ:
1. code-reviewer: ตรวจสอบโค้ดที่เขียน
2. test-writer: เขียน test สำหรับ function นี้ ครอบคลุม edge case
   (product ไม่มี, quantity เป็น 0, price เป็น 0)
3. ใช้ MCP postgres query ข้อมูล product จริงแล้วเรียกฟังก์ชันตรวจสอบความถูกต้อง
```

**🤖 Claude Code จะทำอะไร:** Main agent เขียน `lib/stock-utils.ts` แล้ว delegate งานให้ sub-agents และ MCP พร้อมกัน

**✅ สิ่งที่จะเกิดขึ้นโดยอัตโนมัติ:**
1. Main agent เขียน `lib/stock-utils.ts`
2. Hook PostToolUse รัน Prettier format ทันที
3. `code-reviewer` sub-agent ตรวจสอบโค้ด
4. `test-writer` sub-agent เขียนไฟล์ test
5. Hook PostToolUse รัน Vitest สำหรับไฟล์ test ใหม่
6. MCP postgres query ข้อมูลจริงมาตรวจสอบ
7. เมื่อ Claude หยุด Hook Stop รัน TypeScript check ทั้งโปรเจกต์

---

### 🛠️ Workshop ขั้นตอนที่ 5: สร้าง Skill และทดสอบว่า Claude หยิบมาใช้อัตโนมัติ

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ตรวจสอบว่ามีโฟลเดอร์ .claude/skills/stock-report/ อยู่แล้วหรือไม่
ถ้าไม่มีให้สร้าง skill stock-report ตามที่เรียนในขั้นตอนที่ 7
จากนั้นทดสอบ skill โดยถามว่า:
"ช่วยสรุปสถานะสต็อกสินค้าในระบบหน่อย แสดงสินค้าที่ใกล้หมดด้วย"
```

**🤖 Claude Code จะทำอะไร:** ตรวจสอบ skill ที่มีอยู่ จากนั้นอ่าน description ของ `stock-report` แล้วตัดสินใจหยิบ skill มาใช้ และสร้างรายงานตาม format ที่กำหนดใน SKILL.md

**✅ Checkpoint ตรวจสอบ:**
- รายงานที่ได้ตรงกับ format ที่ระบุใน SKILL.md (มีตาราง, มีสรุป, มี status icon)
- ถ้า Claude ไม่หยิบ skill มาใช้โดยอัตโนมัติ ให้ตรวจ `description` ว่าครอบคลุม keyword ที่ใช้ถามหรือไม่ แล้วแก้ให้ชัดขึ้น
- ลองถามใหม่ด้วยคำที่ต่างกัน เช่น "stock summary" หรือ "รายงานคลัง" — skill ที่ดีควร trigger ได้หลายรูปแบบ

---

### 🛠️ Workshop ขั้นตอนที่ 6: Security Audit เต็มรูปแบบ

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
security-auditor: ทำการ security scan โปรเจกต์ stock-app ทั้งหมด
เน้นที่:
1. app/api/ — ตรวจ auth check และ input validation
2. app/products/actions.ts — ตรวจ SQL injection และ error handling
3. ไฟล์ .env และ config — ตรวจ secrets exposure
รายงานพร้อม severity level และ Security Score
```

**🤖 Claude Code จะทำอะไร:** เรียก `security-auditor` sub-agent (model: claude-opus-4-5) ให้สแกนโปรเจกต์และออก report พร้อม Security Score

**✅ Checkpoint ตรวจสอบ:**
- ผลลัพธ์มี format ครบ: 🔴 Critical / 🟡 Medium / 🟢 Low / 📋 Security Score
- ถ้า agent ไม่ถูกเรียกอัตโนมัติ ให้ระบุชื่อ `security-auditor:` ตรง ๆ

---

## สรุปวันที่ 3

วันนี้เราดำน้ำลึกสู่ระบบที่ทำให้ Claude Code ทรงพลังที่สุด โดยใช้แนวทาง Vibe Coding — สั่งด้วย prompt แล้วตรวจสอบผลลัพธ์:

- ✅ เข้าใจ Sub-agents และ Context Isolation — ทำไมถึงเปลี่ยนเกมการพัฒนา
- ✅ สั่ง Claude สร้าง `code-reviewer`, `test-writer`, `security-auditor` agent เฉพาะทางสำหรับ stock-app
- ✅ เข้าใจโครงสร้างไฟล์ agent (YAML frontmatter + system prompt) และเลือก model ตามบทบาท
- ✅ ตรวจสอบ agents ผ่าน `/agents` command
- ✅ Orchestration — สั่งงานหลาย agent พร้อมกันแบบ parallel และ sequential
- ✅ เข้าใจสถาปัตยกรรม MCP (client/server, JSON-RPC over stdio)
- ✅ สั่ง Claude สร้าง `.mcp.json` เชื่อม PostgreSQL และ GitHub
- ✅ ใช้ `claude mcp add` และ `/mcp` ตรวจสอบ
- ✅ query ข้อมูลสต็อกจริงจาก DB ผ่าน MCP และสร้าง GitHub Issue อัตโนมัติ
- ✅ สั่ง Claude สร้าง Hooks ใน `.claude/settings.json` รัน formatter/linter/test อัตโนมัติ
- ✅ เข้าใจ Agent Skills — ความต่างจาก Sub-agent, Slash Command และ Hook
- ✅ เข้าใจโครงสร้าง `.claude/skills/<name>/SKILL.md` และความสำคัญของ `description`
- ✅ สั่ง Claude สร้าง skill `stock-report` พร้อม format รายงานมาตรฐาน
- ✅ ทดสอบว่า Claude หยิบ skill มาใช้อัตโนมัติเมื่อ task ตรงกับ description
- ✅ ทำ Workshop ตั้ง AI Quality Gate เต็มรูปแบบให้ stock-app (รวม Skills)

**วันที่ 4 (หัวข้อ: Team Workflow, Docker และ CI/CD):** เราจะนำทุกอย่างที่เรียนมาผสมเข้าด้วยกัน — ตั้งค่า Claude Code สำหรับทีม, สร้าง Dockerfile และ docker-compose สำหรับ stock-app, เชื่อมกับ GitHub Actions pipeline และออกแบบ git workflow ที่ใช้ Claude ช่วย review PR อัตโนมัติด้วย sub-agent

---

## แหล่งอ้างอิงเพิ่มเติม

- [Claude Code Sub-agents Documentation](https://docs.anthropic.com/claude-code/sub-agents) — เอกสารทางการ sub-agents
- [Model Context Protocol (MCP) Spec](https://modelcontextprotocol.io) — MCP specification และ server directory
- [MCP Server Postgres](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres) — PostgreSQL MCP server
- [MCP Server GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/github) — GitHub MCP server
- [Claude Code Settings & Hooks](https://docs.anthropic.com/claude-code/settings) — เอกสาร hooks และ settings
- [Agent Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills) — เอกสารทางการ Agent Skills
- [Vitest Documentation](https://vitest.dev) — Testing framework สำหรับ stock-app
- [Prisma ORM Docs](https://www.prisma.io/docs) — Prisma documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — มาตรฐาน web security
