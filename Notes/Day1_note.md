# หลักสูตร Claude Code มือโปร: ดำน้ำลึกสู่ Production — วันที่ 1

## ปูพื้น Claude Code ระดับมือโปร และตั้งต้นระบบคลังสินค้าด้วย Next.js

**วันที่อบรม:** วันเสาร์ที่ 4 กรกฎาคม 2569 | เวลา 20:30–23:30 น.
**รูปแบบ:** อบรมออนไลน์ (สอนสด) ผ่าน Zoom Meeting
**วิทยากร:** อาจารย์สามิตร โกยม | IT Genius Engineering Co., Ltd.

---

## บทนำ

วันแรกของหลักสูตรมุ่งเน้นการวางรากฐานที่แน่นทั้งแนวคิดและเครื่องมือ ก่อนที่เราจะดำน้ำลึกสู่การพัฒนาจริงในวันถัดไป ผู้เรียนจะเข้าใจว่า Claude Code ทำงานอย่างไรในระดับ Agentic Loop ตั้งค่าและใช้งาน Claude Code CLI ได้อย่างมั่นใจ รู้จักเทคนิคการเขียน Prompt ที่ดี และลงมือสร้างโปรเจกต์ **StockApp** — ระบบคลังสินค้าเบิกจ่าย ที่จะใช้เป็นโปรเจกต์หลักตลอดทั้งหลักสูตร

---

## ปรัชญาของหลักสูตร: เราไม่ได้พิมพ์โค้ด เรากำกับ AI

> **หลักสำคัญที่ต้องเข้าใจก่อนเริ่มทุกอย่าง**

ตลอดหลักสูตรนี้ **เราจะไม่พิมพ์โค้ดเอง** — เราจะ "สั่ง" Claude Code ด้วย prompt ภาษาธรรมดา แล้วให้ AI เป็นคนเขียนโค้ดให้ทั้งหมด บทบาทของเราคือ:

| บทบาทของเรา | รายละเอียด |
|---|---|
| **ออกแบบ Prompt** | บอก Claude ว่าต้องการอะไร อย่างไร จากไฟล์ไหน |
| **ตรวจสอบ (Review)** | ดูว่า Claude สร้างสิ่งที่ถูกต้องไหม ตรงกับที่ต้องการไหม |
| **ตัดสินใจ** | อนุมัติให้ Claude ดำเนินการต่อ หรือแก้ไข prompt แล้วลองใหม่ |

**โค้ดอ้างอิงในโน้ตนี้มีไว้เพื่ออะไร?**

โค้ดในส่วน "📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้" ทุกบล็อก **ไม่ใช่สิ่งที่ต้องพิมพ์ตาม** แต่มีไว้เพื่อ:
- **เทียบ** กับสิ่งที่ Claude สร้างขึ้นมาว่าถูกต้องหรือไม่
- **ช่วย review** จุดที่ AI มักพลาด เช่น ลืมใส่ return type, ใส่ semicolon โดยไม่ตั้งใจ
- **อ้างอิง** เมื่อต้องการ debug หรือเปรียบเทียบ logic

> Claude Code generate โค้ดต่างกันเล็กน้อยในแต่ละครั้ง — โค้ดอ้างอิงคือ "ทิศทาง" ไม่ใช่ "คำตอบตายตัว"

---

## Module 0: เตรียมเครื่องมือก่อนเริ่มเรียน

### 0.1 สิ่งที่ต้องติดตั้งก่อนอบรม

| เครื่องมือ | เวอร์ชันแนะนำ | ดาวน์โหลด / วิธีติดตั้ง |
|---|---|---|
| **Node.js** | 20.19+ หรือแนะนำ 22.x | https://nodejs.org |
| **pnpm** | 9.x ขึ้นไป | `npm install -g pnpm` |
| **Git** | ล่าสุด | https://git-scm.com |
| **Visual Studio Code** | ล่าสุด | https://code.visualstudio.com |
| **Docker Desktop** | ล่าสุด | https://www.docker.com/products/docker-desktop |
| **บัญชี Anthropic** | Claude Pro / Max หรือ API Key | https://claude.ai หรือ https://console.anthropic.com |

> **หมายเหตุ:** Docker ใช้สำหรับรัน PostgreSQL ผ่าน container หากมี PostgreSQL ติดตั้งอยู่แล้วในเครื่องก็ไม่จำเป็น

### 0.2 ตรวจสอบ Environment ก่อนเริ่ม

เปิด Terminal แล้วรันคำสั่งต่อไปนี้เพื่อยืนยันว่าพร้อมแล้ว:

```bash
node --version
# ควรแสดง v20.19.x หรือสูงกว่า (แนะนำ v22.x)

pnpm --version
# ควรแสดง 9.x.x หรือสูงกว่า

git --version
# ควรแสดง git version 2.x.x

docker --version
# ควรแสดง Docker version 26.x.x หรือสูงกว่า

claude --version
# ถ้าติดตั้งแล้วจะแสดงเวอร์ชัน Claude Code CLI
```

### 0.3 VS Code Extensions ที่แนะนำสำหรับหลักสูตรนี้

| Extension | ประโยชน์ |
|---|---|
| **Prisma** | Syntax highlight และ auto-format สำหรับไฟล์ .prisma |
| **Tailwind CSS IntelliSense** | Auto-complete class names ของ Tailwind |
| **ESLint** | ตรวจสอบคุณภาพโค้ด TypeScript |
| **Prettier - Code formatter** | จัดรูปแบบโค้ดอัตโนมัติ (ตั้งค่า no-semicolon) |
| **Error Lens** | แสดง Error inline ทันทีที่เกิดขึ้น |
| **Thunder Client** | ทดสอบ API ใน VS Code (แทน Postman) |

---

## Module 1.1: ทำความรู้จัก Claude Code เชิงลึก

### Claude Code คืออะไร?

**Claude Code** คือ CLI Tool (Command Line Interface) ที่ Anthropic พัฒนาขึ้น ให้นักพัฒนาสามารถทำงานร่วมกับ AI โมเดล Claude ได้โดยตรงใน Terminal สิ่งที่ทำให้มันแตกต่างจาก Chatbot ทั่วไปคือมันมี **สิทธิ์เข้าถึง Filesystem** ของคุณ สามารถอ่าน-เขียน-แก้ไขไฟล์ รันคำสั่ง Terminal และทำงานหลายขั้นตอนต่อเนื่องได้โดยอัตโนมัติ

### Agentic Coding คืออะไร? — ต่างจาก AI เติมโค้ดอย่างไร?

**Agentic Coding** คือแนวคิดที่ให้ AI ไม่ได้แค่ "เติมโค้ด" ให้คุณทีละบรรทัดแบบ word prediction แต่ทำงานเหมือน **นักพัฒนาในทีม** ที่:

- อ่านและเข้าใจโปรเจกต์ทั้งหมดก่อนลงมือ
- วางแผนว่าจะต้องแก้ไขอะไรบ้าง กี่ขั้นตอน
- รันคำสั่งในเครื่องได้ เช่น `pnpm install`, `prisma migrate`
- แก้ไขหลายไฟล์พร้อมกัน
- ตรวจสอบผลลัพธ์แล้วแก้ไขซ้ำจนสำเร็จ

### เปรียบเทียบ: Autocomplete vs Agentic Coding

| มิติ | GitHub Copilot / Cursor Autocomplete | Claude Code (Agentic) |
|---|---|---|
| **วิธีทำงาน** | เติมโค้ดตาม cursor ที่อยู่ปัจจุบัน | วางแผนและดำเนินงานหลายขั้นตอนเอง |
| **การมองเห็น Context** | เห็นเฉพาะไฟล์ที่เปิดอยู่ | เห็นทั้ง Codebase (grep, find, read ได้) |
| **สิ่งที่ทำได้** | เสนอโค้ด — คุณต้อง Accept เอง | เขียนโค้ด + รันคำสั่ง + แก้ไขหลายไฟล์ |
| **การ Iteration** | คุณต้อง refine เอง | รัน → ดู error → แก้ไข → รันซ้ำ อัตโนมัติ |
| **Input** | ส่วนใหญ่เป็น code context | ภาษาธรรมชาติ + code context |
| **เหมาะกับ** | งานเขียนโค้ดซ้ำ ๆ, boilerplate | สร้าง Feature ใหม่ทั้งชิ้น, refactor ใหญ่ |

### Agentic Loop — หัวใจของการทำงาน Claude Code

Claude Code ทำงานในรูปแบบ **Loop** ต่อเนื่อง ไม่ใช่แค่ตอบครั้งเดียวแล้วจบ:

```
┌──────────────────────────────────────────────────────────┐
│                    AGENTIC LOOP                          │
│                                                          │
│   คุณส่ง Prompt                                          │
│   "สร้าง API สำหรับดูสินค้าทั้งหมด"                    │
│          │                                               │
│          ▼                                               │
│   READ — อ่านไฟล์ที่เกี่ยวข้อง                          │
│          schema.prisma, lib/prisma.ts, app/api/          │
│          │                                               │
│          ▼                                               │
│   PLAN — วางแผนว่าจะทำอะไรบ้าง กี่ขั้นตอน              │
│          สร้าง route.ts, ใช้ prisma.product.findMany()  │
│          │                                               │
│          ▼                                               │
│   ACT — แก้ไขโค้ด / เขียนไฟล์ใหม่                      │
│          สร้าง app/api/products/route.ts                │
│          │                                               │
│          ▼                                               │
│   RUN — รัน typecheck / build เพื่อตรวจสอบ              │
│          pnpm tsc --noEmit                              │
│          │                                               │
│          ▼                                               │
│   VERIFY — ตรวจสอบผลลัพธ์ มี error ไหม?                │
│          │                                               │
│    มี error ──────────────────► กลับไป READ/PLAN        │
│          │                                               │
│    ไม่มี error                                           │
│          ▼                                               │
│   DONE — รายงานผลให้คุณ                                 │
└──────────────────────────────────────────────────────────┘
```

> **Key Concept:** Claude Code ไม่ได้แค่ "ให้คำตอบ" — มันวนซ้ำ Loop หลายรอบจนกว่างานจะสำเร็จ คล้ายกับที่นักพัฒนาจริง ๆ ทำ

---

## Module 1.2: ติดตั้งและตั้งค่า Claude Code

Claude Code เป็น CLI tool ที่ติดตั้งผ่าน npm ทำได้ง่ายมาก:

```bash
npm install -g @anthropic-ai/claude-code
```

ตรวจสอบว่าติดตั้งสำเร็จ:

```bash
claude --version
```

### Login และเริ่มใช้งาน

```bash
claude
```

ครั้งแรกจะให้เลือกวิธี authenticate:

```
Welcome to Claude Code!

? How would you like to log in?
  ❯ Claude.ai account (claude.ai subscription)
    Anthropic API key (console.anthropic.com)
```

- **Claude.ai account** — สำหรับผู้ใช้ Claude Pro / Max (แนะนำสำหรับหลักสูตรนี้)
- **Anthropic API key** — สำหรับนักพัฒนาที่ต้องการควบคุม cost เอง

### คำสั่งพื้นฐานใน Interactive Session

เมื่อเปิด Claude Code แล้วจะเข้าสู่ Interactive Mode:

```
╭─────────────────────────────────────╮
│ ✻ Welcome to Claude Code!           │
│   /help สำหรับดูคำสั่งทั้งหมด      │
╰─────────────────────────────────────╯
>
```

| คำสั่ง | ความหมาย |
|---|---|
| `/help` | แสดงคำสั่งทั้งหมดที่ใช้ได้ |
| `/clear` | ล้าง context ทั้งหมด (เริ่มบทสนทนาใหม่) |
| `/compact` | บีบอัด context ให้สั้นลง ประหยัด token |
| `/init` | สร้างไฟล์ CLAUDE.md สำหรับโปรเจกต์ปัจจุบัน |
| `/model` | เปลี่ยน AI model ที่ใช้งาน |
| `Shift+Tab` | สลับเข้า/ออก Plan Mode |
| `Ctrl+C` | หยุดการทำงานหรือออกจาก Claude Code |

### เลือก Model ให้เหมาะกับงาน

```bash
# ดูและเปลี่ยน model ปัจจุบัน
/model
```

| Model | จุดเด่น | เหมาะกับงาน |
|---|---|---|
| **claude-opus-4** | ฉลาดที่สุด, reasoning ลึก | ออกแบบ Architecture, แก้ปัญหาซับซ้อน |
| **claude-sonnet-4** | สมดุลความเร็วและความแม่นยำ | งานทั่วไป, สร้าง Feature, แก้ Bug (ใช้บ่อยที่สุด) |
| **claude-haiku-4** | เร็วที่สุด, ประหยัด token | งานง่าย, แก้ typo, ถามคำถามสั้น |

> **Key Concept:** ใช้ **Sonnet** เป็นค่าเริ่มต้นสำหรับงานทั่วไป สลับไป **Opus** เมื่อต้องการคิดเชิงลึกหรือออกแบบระบบ และ **Haiku** เมื่อรีบหรืองานง่าย

### Permission Modes — ควบคุมระดับอิสรภาพของ Claude

Claude Code มี 4 Permission Mode สำหรับควบคุมว่า AI มีสิทธิ์ทำอะไรได้บ้างโดยไม่ต้องถาม:

| Mode | คำอธิบาย | เหมาะกับ |
|---|---|---|
| **default** | ถามก่อนทำทุกอย่างที่มีผลกระทบ | โปรเจกต์ใหม่, งานที่ไม่มั่นใจ |
| **acceptEdits** | ยอมรับการแก้ไขไฟล์อัตโนมัติ แต่ถามก่อนรันคำสั่ง | งานพัฒนาปกติ (แนะนำ) |
| **plan** | วางแผนเท่านั้น ไม่แตะไฟล์จริง | ก่อนเริ่มงานใหญ่ที่ต้องการตรวจสอบก่อน |
| **bypassPermissions** | ทำทุกอย่างโดยไม่ถาม (อันตราย!) | CI/CD หรือ automation ที่ควบคุมได้ 100% |

ตั้งค่าผ่านไฟล์ `.claude/settings.json`:

```json
{
  "permissions": {
    "mode": "acceptEdits"
  }
}
```

> **คำเตือน:** อย่าใช้ `bypassPermissions` ในโปรเจกต์ production โดยไม่มีการ review เพราะ Claude อาจลบหรือแก้ไขไฟล์สำคัญได้โดยไม่ตั้งใจ

---

## Module 1.3: Vibe Coding อย่างมีวินัย

### Vibe Coding คืออะไร — และทำไมต้องมีวินัย?

**Vibe Coding** คือการ "คุย" กับ AI ให้เขียนโค้ดให้เราผ่านภาษาธรรมดา แต่ถ้าใช้อย่างไม่มีวินัย จะเจอปัญหาเหล่านี้:

- AI เขียนโค้ดออกมา แต่ไม่ตรงกับสิ่งที่เราต้องการจริง ๆ
- Context หาย ทำให้ AI ทำงานซ้ำหรือขัดแย้งกับสิ่งที่ทำไปแล้ว
- ได้โค้ดที่ทำงานได้ แต่ไม่สอดคล้องกับ architecture ของโปรเจกต์

### เทคนิคเขียน Prompt ที่ดี — ตัวอย่างเปรียบเทียบ

**Prompt ที่ไม่ดี:**

```
ทำหน้าแสดงสินค้าให้หน่อย
```

ปัญหา: ไม่รู้ว่าดึงข้อมูลจากไหน ใช้ component อะไร มี filter ไหม style แบบไหน

---

**Prompt ที่ดี:**

```
สร้างหน้า /products ใน Next.js App Router (app/products/page.tsx)
- ดึงข้อมูลสินค้าทั้งหมดจาก Prisma (model Product ใน @prisma/schema.prisma)
- แสดงเป็น table ด้วย Tailwind CSS
- แต่ละแถวแสดง: SKU, ชื่อสินค้า, หมวดหมู่, จำนวน, หน่วย, ราคา, สถานะ
- สถานะ: quantity === 0 → "หมดสต็อก" (badge แดง)
         quantity <= reorderPoint → "ใกล้หมด" (badge เหลือง)
         ไม่งั้น → "ปกติ" (badge เขียว)
- ใช้ Server Component ดึงข้อมูลโดยตรง (ไม่ต้องใช้ useEffect)
- ห้ามใส่ semicolon ใน TypeScript ทุกกรณี
```

### หลักการ 5C ของ Prompt ที่ดี

| หลักการ | ความหมาย | ตัวอย่าง |
|---|---|---|
| **Context** | บอกบริบทของงานให้ชัด | "ในโปรเจกต์ Next.js 16 App Router ที่ใช้ Prisma..." |
| **Constraint** | ระบุข้อจำกัดหรือกฎที่ต้องปฏิบัติ | "ห้ามใช้ semicolon, ใช้ pnpm ไม่ใช่ npm" |
| **Concrete** | ระบุ output ที่ต้องการอย่างชัดเจน | "สร้างไฟล์ app/products/page.tsx" |
| **Context File** | อ้างอิงไฟล์ที่มีอยู่เพื่อให้ Claude อ่าน | "ดูโครงสร้างจาก @prisma/schema.prisma และ @CLAUDE.md" |
| **Check** | ขอให้วางแผนหรือยืนยันก่อนลงมือ | "วางแผนให้ดูก่อน แล้วค่อยลงมือ" |

### Plan Mode — คิดก่อนทำ

**Plan Mode** คือโหมดที่ให้ Claude Code **วางแผนก่อนโดยไม่แตะไฟล์จริง** เหมาะสำหรับงานใหญ่ที่อยากตรวจสอบแนวทางก่อน

วิธีเปิด: กด **Shift+Tab** ขณะอยู่ใน Claude Code session

```
ตัวอย่างบทสนทนา — Plan Mode

ผู้ใช้: [กด Shift+Tab เพื่อเข้า Plan Mode]
        สร้าง API Routes สำหรับ stock-app:
        - GET /api/products → ดึงสินค้าทั้งหมด
        - POST /api/transactions → บันทึกการรับ/เบิกสินค้า
        พร้อม error handling และ TypeScript types

Claude: แผนการทำงาน (Plan Mode — ยังไม่แตะไฟล์):

        1. อ่านไฟล์เพื่อทำความเข้าใจโครงสร้าง
           → prisma/schema.prisma
           → lib/db.ts (ถ้ามี)

        2. สร้าง app/api/products/route.ts
           → GET handler: prisma.product.findMany()
           → return JSON { data: Product[], total: number }

        3. สร้าง app/api/transactions/route.ts
           → POST handler: รับ body { productId, type, quantity, note }
           → validate ด้วย TypeScript types
           → prisma.stockTransaction.create()
           → อัปเดต product.quantity ด้วย transaction

        รวม 2 ไฟล์ใหม่ที่จะสร้าง
        ยืนยันดำเนินการต่อหรือไม่?

ผู้ใช้: ดีมาก ไปต่อได้เลย

Claude: [ออกจาก Plan Mode — เริ่มทำงานจริง]
        กำลังสร้าง app/api/products/route.ts...
```

> **Key Concept:** Plan Mode มีประโยชน์มากก่อนเริ่มงานใหญ่ที่ไม่แน่ใจ ช่วยให้คุณเห็นภาพรวมและตรวจสอบทิศทางก่อนที่ Claude จะแก้ไข Codebase

---

## Module 1.4: CLAUDE.md — สมองของโปรเจกต์

### CLAUDE.md คืออะไร?

**CLAUDE.md** คือไฟล์ที่ Claude Code อ่านโดยอัตโนมัติทุกครั้งที่เริ่ม session ใหม่ในโปรเจกต์นั้น ๆ ทำหน้าที่เหมือน **คู่มือทีม** ที่บอก Claude ว่า:

- โปรเจกต์นี้คืออะไร และใช้ Tech Stack อะไร
- กฎการเขียนโค้ดของทีม (naming convention, no-semicolon ฯลฯ)
- โครงสร้างโฟลเดอร์ที่ถูกต้อง
- คำสั่ง dev/test/build ที่ใช้บ่อย
- ข้อมูลเฉพาะโปรเจกต์ที่ Claude ต้องรู้

**ประโยชน์หลัก:** ไม่ต้องอธิบาย context ซ้ำทุกครั้ง เพียงเปิด session ใหม่ Claude Code ก็รู้ว่าต้องทำอะไรแบบไหนทันที

### โครงสร้างไฟล์และโฟลเดอร์ที่ Claude Code ใช้

```
stock-app/
├── CLAUDE.md              ← สมองของโปรเจกต์ (อ่านทุกครั้ง)
├── prisma.config.ts       ← Prisma 7 CLI config (schema path, migration, seed, datasource URL)
├── .claude/               ← โฟลเดอร์ config ของ Claude Code
│   ├── settings.json      ← ตั้งค่าทีม (commit ขึ้น Git ได้)
│   ├── settings.local.json← ตั้งค่าส่วนตัว (.gitignore)
│   └── skills/            ← Agent Skills (วันที่ 3)
├── app/                   ← Next.js App Router
├── prisma/
│   ├── schema.prisma      ← Database schema
│   ├── migrations/        ← Migration files
│   └── seed.ts            ← Seed data
└── src/
    ├── generated/
    │   └── prisma/        ← Generated Prisma Client (gitignored, รัน prisma generate เอง)
    └── lib/
        └── prisma.ts      ← Prisma Client singleton + driver adapter
```

### สร้าง CLAUDE.md ด้วย /init

```bash
# เข้าโฟลเดอร์โปรเจกต์
cd stock-app

# เปิด Claude Code
claude

# ใน session ใช้คำสั่ง
> /init
```

Claude จะ scan โปรเจกต์ทั้งหมดแล้วสร้าง CLAUDE.md ร่างแรก จากนั้นเราแก้ไขเพิ่มรายละเอียดที่ Claude อาจไม่รู้

### ตัวอย่าง CLAUDE.md เต็ม ๆ ของ stock-app (โค้ดอ้างอิง)

```markdown
# StockApp — ระบบคลังสินค้าเบิกจ่าย

## ภาพรวมโปรเจกต์
ระบบจัดการคลังสินค้าสำหรับองค์กรขนาดกลาง
รองรับการรับเข้า-เบิกจ่ายสินค้า ติดตามปริมาณสต็อก
และแจ้งเตือนสินค้าใกล้หมด

**Production Domain:** stock.itgenius.app

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **ORM:** Prisma 7 + PostgreSQL
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Package Manager:** pnpm (ห้ามใช้ npm หรือ yarn)

## กฎการเขียนโค้ด — ห้ามละเมิด

### 1. ห้ามใส่ Semicolon
TypeScript/JavaScript ทุกไฟล์ ห้ามใส่ semicolon (;) ท้ายบรรทัด

ถูก:
const name = 'StockApp'
export default function Page() { return <div /> }

ผิด:
const name = 'StockApp';   ← ห้าม!

### 2. Naming Convention
- Component files: PascalCase เช่น ProductTable.tsx, StockBadge.tsx
- Utility/lib files: camelCase เช่น stockStatus.ts, formatPrice.ts
- API routes: ตาม Next.js convention เช่น app/api/products/route.ts

### 3. TypeScript
- ใช้ interface สำหรับ Object shapes
- ใช้ type สำหรับ Union types และ Aliases
- ห้ามใช้ any ทุกกรณี
- ทุก function ควรมี return type ที่ชัดเจน

## โครงสร้างโฟลเดอร์

stock-app/
├── prisma.config.ts
├── app/
│   ├── api/
│   │   ├── products/route.ts
│   │   └── transactions/route.ts
│   ├── products/page.tsx
│   ├── transactions/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   └── stock/
├── src/
│   ├── generated/
│   │   └── prisma/       ← gitignored, รัน pnpm prisma generate เอง
│   └── lib/
│       ├── prisma.ts     ← Prisma Client singleton + driver adapter
│       └── utils.ts
├── types/
│   └── index.ts
└── prisma/
    ├── schema.prisma
    └── seed.ts

## Prisma Models
### Product
id, sku (unique เช่น "SKU-1001"), name, category, unit,
quantity Int, reorderPoint Int, price Int,
createdAt, updatedAt, transactions StockTransaction[]

### StockTransaction
id, productId, type (enum TransactionType { IN, OUT }),
quantity Int, note String?, createdAt, product Product

## ตรรกะสถานะสต็อก — ใช้ logic นี้เสมอ
function getStockStatus(quantity, reorderPoint) {
  if (quantity === 0) return 'หมดสต็อก'        // badge แดง
  if (quantity <= reorderPoint) return 'ใกล้หมด'  // badge เหลือง
  return 'ปกติ'                                 // badge เขียว
}

## คำสั่งที่ใช้บ่อย
pnpm dev
pnpm build
pnpm prisma migrate dev --name <ชื่อ>   # สร้างตาราง (ไม่ generate/seed อัตโนมัติใน Prisma 7)
pnpm prisma generate                     # generate client เข้า src/generated/prisma (รันแยกเสมอ)
pnpm prisma studio
pnpm prisma db seed                      # หรือ pnpm db:seed (= tsx prisma/seed.ts)

## Environment Variables (ใน .env)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/stockdb"

## ข้อห้าม
- ห้ามแก้ไข prisma/migrations/ โดยตรง
- ห้าม commit ไฟล์ .env
- ห้ามใช้ src/lib/prisma.ts (Prisma Client) ใน Client Component
- ห้าม import จาก @prisma/client — ใช้ import จาก src/generated/prisma/client เท่านั้น
- ห้าม commit โฟลเดอร์ src/generated/prisma/ (อยู่ใน .gitignore แล้ว รัน pnpm prisma generate เอง)
```

> **Key Concept:** CLAUDE.md ที่ดีคือ CLAUDE.md ที่ทำให้ AI ใหม่ที่ไม่รู้จักโปรเจกต์เลย อ่านแล้วทำงานได้ถูกต้องทันที

### CLAUDE.md คือ memory ของโปรเจกต์ (ไม่มี memory.md)

ระบบ memory ของ Claude Code มี **2 ส่วนหลัก** ที่ทำงานต่างกัน:

| ส่วน | ลักษณะ | ใครสร้าง |
|---|---|---|
| **CLAUDE.md** | Instructions ถาวร โหลดอัตโนมัติทุก session, อยู่รอดหลัง `/compact` เพราะ Claude re-read จากดิสก์ | เราเขียนเอง |
| **Auto memory** | บันทึกที่ Claude จดเองจากการแก้ไขและ preference ของเรา เช่น build commands, debugging insights, code style ต่าง ๆ | Claude บันทึกอัตโนมัติ (ต้องใช้ Claude Code v2.1.59 ขึ้นไป) |

> **สำคัญ:** ไม่มีไฟล์ชื่อ `memory.md` ใน Claude Code — "ตัว memory หลักคือ CLAUDE.md" ที่เราเขียนและดูแลเอง

**ลำดับชั้น CLAUDE.md (hierarchy) — อ่านจากสูงสุดไปต่ำสุด:**

```
managed policy         ← ระดับองค์กร, ยกเว้นไม่ได้ (Enterprise)
    ↓
project CLAUDE.md      ← ที่ root ของโปรเจกต์ (เริ่มต้นที่นี่เสมอ)
    ↓
~/.claude/CLAUDE.md    ← ระดับ User (ใช้กับทุกโปรเจกต์ในเครื่อง)
    ↓
nested CLAUDE.md       ← ในโฟลเดอร์ย่อย (ใช้เมื่อต้องการกฎเฉพาะของ module)
```

**การ import ไฟล์ย่อยด้วย @:** CLAUDE.md รองรับการ import ไฟล์อื่นโดยตรง ใช้สำหรับแยกเนื้อหาเป็นส่วน ๆ เช่น:

```markdown
# StockApp

@docs/spec.md
@docs/api-conventions.md
```

Claude จะอ่านไฟล์ที่ import ให้อัตโนมัติ ทำให้ CLAUDE.md หลักไม่ยาวเกินไป

**โครงสร้างโปรเจกต์มือโปร — มากกว่าแค่ CLAUDE.md**

นอกจาก CLAUDE.md แล้ว โปรเจกต์ระดับโปรควรวางโครงไฟล์ `.claude/` ตั้งแต่เริ่มต้น:

- **`.claude/settings.json`** — ตั้งค่าระดับโปรเจกต์ (commit ขึ้น Git ได้ ใช้ร่วมทั้งทีม) เก็บ permissions, hooks, env, model ฯลฯ
- **`.claude/settings.local.json`** — ตั้งค่าส่วนตัวของแต่ละคน (ควรอยู่ใน `.gitignore`)
- **`.claude/skills/`** — Agent Skills สำหรับสั่งให้ Claude ทำงานซับซ้อนเป็นขั้นตอน **(จะสอนละเอียดวันที่ 3 คู่กับ sub-agents, MCP, และ hooks)**

ในขั้นตอน Workshop ด้านล่าง เราจะให้ Claude สร้าง `.claude/settings.json` ตั้งต้นให้เราก่อน แทนที่จะพิมพ์ JSON เอง

---

## Module 1.5: Workshop — สร้าง StockApp ตั้งแต่ต้นด้วย Claude Code

ส่วนนี้คือ Workshop หลักของวันที่ 1 เราจะลงมือสร้างโปรเจกต์ **stock-app** ด้วยวิธี Vibe Coding — สั่ง Claude Code ผ่าน prompt แล้วให้ AI ทำงานให้ เราทำหน้าที่ review เท่านั้น

> **Workflow มือโปร: Spec-Driven Development**
>
> นักพัฒนาที่ใช้ Claude Code อย่างมืออาชีพ **ไม่เริ่มจากการพิมพ์ `create-next-app` ทันที** แต่เริ่มจากการให้ Claude ทำหน้าที่ Product Manager/Architect — สัมภาษณ์ requirements ก่อน แล้วสรุปเป็น spec ที่แบ่งการพัฒนาออกเป็น Phase อย่างชัดเจน จากนั้นค่อย implement ทีละ Phase โดยอ้างอิง spec เป็นฐาน วิธีนี้ช่วยให้ทุกบรรทัดโค้ดที่ Claude สร้างมีทิศทางที่ชัดเจน ลดการ backtrack และทำให้ทีมทั้งหมด (รวมถึง Claude ในทุก session) เข้าใจภาพรวมโปรเจกต์ตรงกัน

---

### 🛠️ ขั้นตอนที่ 0: สร้างโฟลเดอร์โปรเจกต์แล้วเปิด Claude Code ในนั้น

เนื่องจากขั้นตอนที่ 1–3 (สัมภาษณ์ requirements และสร้าง `docs/spec.md`) เกิดขึ้น **ก่อน** ที่โปรเจกต์ Next.js จะมีอยู่จริง เราต้องกำหนดให้ชัดก่อนว่า Claude Code จะทำงานอยู่ในโฟลเดอร์ไหน — มิฉะนั้นไฟล์ `docs/spec.md` จะไปตกอยู่ผิดที่ และคำสั่ง `create-next-app` ในขั้นตอนที่ 4 อาจสร้างโฟลเดอร์ซ้อนกัน

**สร้างโฟลเดอร์ `stock-app` ให้ว่างก่อน แล้ว `cd` เข้าไปเปิด `claude` ในโฟลเดอร์นั้น:**

```bash
mkdir stock-app
cd stock-app
claude
```

ตั้งแต่จุดนี้เป็นต้นไป **ทุกขั้นตอนของ Workshop จะรันโดยที่ Claude Code อยู่ภายใน `stock-app/`** ดังนั้น:
- `docs/spec.md` ที่สร้างในขั้นตอนที่ 2 จะอยู่ที่ `stock-app/docs/spec.md` อย่างถูกต้อง
- ขั้นตอนที่ 4 จะ scaffold Next.js **ลงในโฟลเดอร์ปัจจุบัน** (ใช้ `.` ไม่ใช่ `stock-app`) จึงไม่เกิดโฟลเดอร์ `stock-app/stock-app/` ซ้อนกัน

> **หมายเหตุ:** `create-next-app` ยอมให้ scaffold ลงในโฟลเดอร์ที่มีไฟล์อยู่แล้วได้ ตราบใดที่ไฟล์เดิมอยู่ใน allowlist ของมัน และโฟลเดอร์ `docs/` **อยู่ใน allowlist** อยู่แล้ว — ไฟล์ `docs/spec.md` ที่เราสร้างไว้จึงไม่ขัดขวางการสร้างโปรเจกต์ในขั้นตอนที่ 4

**✅ Checkpoint ตรวจสอบ:**
- อยู่ในโฟลเดอร์ `stock-app/` ที่ว่าง (ยังไม่มีไฟล์โปรเจกต์)
- เปิด Claude Code session ได้สำเร็จภายในโฟลเดอร์นี้

---

### 🛠️ ขั้นตอนที่ 1: เข้า Plan Mode สัมภาษณ์ Requirements

ก่อนสร้างโค้ดใด ๆ เลย ให้เข้า Plan Mode แล้วให้ Claude ทำหน้าที่สัมภาษณ์ requirements ของระบบก่อน

กด **Shift+Tab** เพื่อเข้า Plan Mode (สังเกตว่า Claude จะแจ้งว่าอยู่ใน Plan Mode — ไม่แตะไฟล์จริง)

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
[Plan Mode] ทำตัวเป็น Product Manager และ Software Architect
สัมภาษณ์ฉันเพื่อเก็บ requirements ของระบบคลังสินค้าเบิกจ่ายที่ชื่อว่า "StockApp"

ข้อมูลเบื้องต้นที่มีอยู่แล้ว:
- Tech Stack: Next.js 16 (App Router) + TypeScript + Prisma + PostgreSQL + Tailwind CSS v4 + shadcn/ui
- Package Manager: pnpm
- ฟีเจอร์หลักที่ต้องการ:
  1. จัดการสินค้า (CRUD) พร้อม SKU
  2. รับสินค้าเข้าคลัง (Stock In)
  3. เบิกจ่ายสินค้า (Stock Out) พร้อมกันเบิกเกินจำนวนที่มี
  4. Dashboard แสดงสรุปสต็อก + แจ้งเตือนสินค้าใกล้หมด

ถามทีละคำถามเพื่อให้ฉันตอบได้ชัดเจน
เมื่อได้ข้อมูลครบแล้วให้สรุป requirements กลับมา
```

**🤖 Claude Code จะทำอะไร:** ใน Plan Mode Claude จะไม่แตะไฟล์ใด ๆ เลย — แต่จะถามคำถามทีละข้อเพื่อเก็บ requirements เช่น ขนาดทีมที่ใช้งาน, การ authentication, รูปแบบ SKU, หน่วยนับ, เงื่อนไขสินค้าใกล้หมด ฯลฯ เมื่อได้ข้อมูลครบจะสรุป requirements ทั้งหมดกลับมาให้ยืนยัน

**✅ Checkpoint ตรวจสอบ:**
- Claude อยู่ใน Plan Mode ตลอด (ไม่มีการสร้างหรือแก้ไขไฟล์ใด ๆ)
- ตอบคำถาม Claude จนครบ ตรวจสอบว่า requirements ที่สรุปครอบคลุมครบ 4 ฟีเจอร์หลัก
- ยืนยัน requirements ก่อนไปขั้นต่อไป — ขั้นนี้สำคัญมาก เพราะ spec ที่ได้จะเป็นฐานของทั้งหลักสูตร

---

### 🛠️ ขั้นตอนที่ 2: ให้ Claude สร้าง docs/spec.md แบ่ง Phase 1-5

หลังยืนยัน requirements แล้ว ให้สั่ง Claude สรุปทุกอย่างลงในไฟล์ spec ที่มีแผนการพัฒนาแบ่งเป็น Phase ชัดเจน (ยังอยู่ใน Plan Mode หรือออกมาก็ได้ — Claude จะสร้างไฟล์ `docs/spec.md`)

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สรุป requirements ทั้งหมดที่เราคุยกัน แล้วสร้างไฟล์ docs/spec.md
ที่มีเนื้อหาครบดังนี้:

1. ภาพรวมระบบ (System Overview)
2. Data Model:
   - Product (id, sku unique, name, category, unit, quantity, reorderPoint, price, createdAt, updatedAt)
   - StockTransaction (id, productId, type: enum TransactionType{IN,OUT}, quantity, note?, createdAt)
3. ฟีเจอร์ทั้งหมดพร้อม acceptance criteria
4. แผนการพัฒนาแบ่งเป็น 5 Phase ตามนี้เป๊ะ:

   Phase 1 — Foundation (วันที่ 1):
   - ตั้งโปรเจกต์ Next.js 16 (App Router) + TypeScript
   - Prisma schema (Product, StockTransaction, enum TransactionType{IN,OUT})
   - เชื่อมต่อ PostgreSQL + รัน migration ครั้งแรก
   - Seed ข้อมูลตัวอย่าง SKU-1001 ถึง SKU-1007
   - วาง CLAUDE.md สมองของโปรเจกต์

   Phase 2 — Core Features (วันที่ 2):
   - CRUD สินค้าครบวงจร (Create/Read/Update/Delete)
   - Stock In / Stock Out พร้อมกันเบิกเกินด้วย prisma.$transaction
   - Dashboard + แจ้งเตือนสินค้าใกล้หมด
   - Custom Slash Commands สำหรับงานที่ทำบ่อย

   Phase 3 — Agentic Quality (วันที่ 3):
   - Sub-agents: code-reviewer, test-writer, security-auditor
   - MCP integration: PostgreSQL MCP + GitHub MCP
   - Hooks: lint/format/test อัตโนมัติหลังแก้ไขโค้ด

   Phase 4 — Team & Containerization (วันที่ 4):
   - แชร์ .claude/ config ผ่าน Git ให้ทีมใช้ร่วมกัน
   - Git workflow: commit message convention, PR template, code review
   - Dockerfile multi-stage build (standalone output)
   - Docker Compose (app + postgres)
   - CI ด้วย GitHub Actions: build + push image ไป ghcr.io

   Phase 5 — Production (วันที่ 5):
   - Deploy บน VPS Ubuntu: SSH hardening, UFW firewall
   - Nginx reverse proxy + HTTPS ด้วย Let's Encrypt
   - CD อัตโนมัติ: pull image ใหม่ + zero-downtime restart
   - Backup/Rollback strategy
   - Monitoring: health check + alert

ในแต่ละ Phase ให้มี checklist งานย่อย (checkbox markdown) ด้วย
```

**🤖 Claude Code จะทำอะไร:** Claude จะสร้างโฟลเดอร์ `docs/` และไฟล์ `docs/spec.md` ที่มีโครงสร้างครบตาม prompt — ภาพรวมระบบ, Data Model, ฟีเจอร์, และแผน Phase 1-5 พร้อม checklist งานย่อยในแต่ละ Phase

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์ `docs/spec.md` ถูกสร้างขึ้นจริง
- มี Phase 1-5 ครบ ชื่อ Phase ตรงตาม spec ด้านบน
- Data Model มี `enum TransactionType { IN OUT }` และ model ทั้งสองถูกต้อง
- แต่ละ Phase มี checklist งานย่อยที่สมเหตุสมผล
- Phase แบ่งได้สอดคล้องกับวันอบรม 5 วัน

**📄 ไฟล์อ้างอิง — ตัวอย่างโครงสร้าง docs/spec.md ที่ควรได้:**

```markdown
# StockApp — System Specification

## ภาพรวมระบบ
ระบบคลังสินค้าเบิกจ่ายสำหรับองค์กรขนาดกลาง รองรับการรับเข้า-เบิกจ่ายสินค้า
ติดตามปริมาณสต็อกแบบ real-time และแจ้งเตือนสินค้าใกล้หมด

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Prisma 7 + PostgreSQL + Tailwind CSS v4 + shadcn/ui
**Package Manager:** pnpm

## Data Model

### enum TransactionType
enum TransactionType {
  IN   // รับสินค้าเข้า
  OUT  // เบิกจ่ายสินค้า
}

### Product
| Field | Type | หมายเหตุ |
|---|---|---|
| id | Int @id @default(autoincrement()) | Primary Key |
| sku | String @unique | รหัสสินค้า เช่น SKU-1001 |
| name | String | ชื่อสินค้า |
| category | String | หมวดหมู่ |
| unit | String | หน่วยนับ เช่น ชิ้น, กล่อง |
| quantity | Int @default(0) | จำนวนคงเหลือ |
| reorderPoint | Int @default(10) | เกณฑ์แจ้งเตือนใกล้หมด |
| price | Int @default(0) | ราคาต่อหน่วย (บาท) |
| createdAt | DateTime | |
| updatedAt | DateTime @updatedAt | |

### StockTransaction
| Field | Type | หมายเหตุ |
|---|---|---|
| id | Int @id @default(autoincrement()) | Primary Key |
| productId | Int | FK → Product |
| type | TransactionType | IN หรือ OUT |
| quantity | Int | จำนวน |
| note | String? | หมายเหตุ (optional) |
| createdAt | DateTime | |

## ฟีเจอร์และ Acceptance Criteria

### F1: จัดการสินค้า (Product CRUD)
- [ ] แสดงรายการสินค้าทั้งหมดพร้อมสถานะสต็อก
- [ ] เพิ่มสินค้าใหม่พร้อม SKU ที่ไม่ซ้ำกัน
- [ ] แก้ไขข้อมูลสินค้า (ยกเว้น SKU)
- [ ] ลบสินค้าพร้อม cascade transaction

### F2: Stock In / Stock Out
- [ ] บันทึกรับสินค้าเข้า → quantity เพิ่มขึ้น
- [ ] บันทึกเบิกสินค้า → quantity ลดลง
- [ ] กันเบิกเกินด้วย prisma.$transaction (atomic check)
- [ ] แสดงประวัติ transaction ย้อนหลัง

### F3: Dashboard
- [ ] Summary cards: ทั้งหมด / หมดสต็อก / ใกล้หมด
- [ ] ตารางสินค้า 5 รายการที่อัปเดตล่าสุด
- [ ] แจ้งเตือนสินค้าที่ quantity <= reorderPoint

## แผนการพัฒนา

### Phase 1 — Foundation (วันที่ 1)
- [ ] ตั้งโปรเจกต์ Next.js 16 App Router + TypeScript + Tailwind CSS
- [ ] ติดตั้ง shadcn/ui + Tailwind v4 (components.json, src/lib/utils.ts, globals.css, src/components/ui/)
- [ ] ติดตั้ง Prisma + เชื่อมต่อ PostgreSQL (Docker)
- [ ] เขียน Prisma schema: Product, StockTransaction, enum TransactionType
- [ ] รัน migration ครั้งแรก (prisma migrate dev --name init)
- [ ] สร้าง Seed data: สินค้า 7 รายการ (SKU-1001 ถึง SKU-1007) + transaction ตัวอย่าง
- [ ] สร้าง lib/db.ts (Prisma Client singleton)
- [ ] สร้างและปรับปรุง CLAUDE.md ด้วย /init
- [ ] ทดสอบ CLAUDE.md ผ่าน lib/utils.ts (getStockStatus, formatPrice, formatDate)

### Phase 2 — Core Features (วันที่ 2)
- [ ] API Route: GET/POST/PUT/DELETE /api/products
- [ ] API Route: POST /api/transactions (Stock In/Out + กันเบิกเกิน)
- [ ] หน้า /products: ตารางสินค้าพร้อม badge สถานะ
- [ ] หน้า /transactions: Form รับ/เบิก + ประวัติ
- [ ] หน้า Dashboard (app/page.tsx): Summary cards + ตาราง
- [ ] Custom Slash Commands: /stock-in, /stock-out, /check-stock

### Phase 3 — Agentic Quality (วันที่ 3)
- [ ] Sub-agent: code-reviewer (ตรวจ TypeScript + no-semicolon)
- [ ] Sub-agent: test-writer (เขียน unit test สำหรับ utils และ API)
- [ ] Sub-agent: security-auditor (ตรวจ injection + input validation)
- [ ] MCP: เชื่อมต่อ PostgreSQL MCP สำหรับ query โดยตรง
- [ ] MCP: เชื่อมต่อ GitHub MCP สำหรับ PR workflow
- [ ] Hooks: pre-save lint + format, post-edit typecheck

### Phase 4 — Team & Containerization (วันที่ 4)
- [ ] แชร์ .claude/ ผ่าน Git (settings.json + commands/)
- [ ] Git commit convention + PR template
- [ ] Dockerfile multi-stage (builder → runner, standalone output)
- [ ] Docker Compose: stock-app + postgres services
- [ ] GitHub Actions CI: build → test → push image ไป ghcr.io

### Phase 5 — Production (วันที่ 5)
- [ ] VPS Ubuntu: SSH key auth, disable root, UFW rules
- [ ] Nginx: reverse proxy config สำหรับ Next.js standalone
- [ ] HTTPS: Certbot Let's Encrypt + auto-renewal
- [ ] CD: GitHub Actions deploy → SSH pull + docker compose up
- [ ] Backup: pg_dump cron + ส่งไป object storage
- [ ] Monitoring: /api/health endpoint + uptime alert
```

---

### 🛠️ ขั้นตอนที่ 3: /clear แล้วเริ่ม Implement Phase 1

เมื่อ `docs/spec.md` พร้อมแล้ว ให้ล้าง context การสัมภาษณ์ออกก่อน แล้วเริ่ม session ใหม่ที่สะอาดโดยอ้างอิง spec เป็นฐาน

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
/clear
```

จากนั้นพิมพ์ต่อในทันที:

```
ใช้ @docs/spec.md เป็นฐานในการพัฒนา
เริ่ม implement Phase 1 — Foundation ทีละขั้นตาม checklist ใน spec
หลังทำแต่ละขั้นเสร็จให้หยุดและรายงานให้ฉัน review ก่อนไปขั้นต่อไป
ห้ามใส่ semicolon ใน TypeScript/JavaScript ทุกไฟล์
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่านไฟล์ `docs/spec.md` ก่อนทุกอย่าง จากนั้นเริ่ม implement Phase 1 ตาม checklist โดยหยุดให้ review หลังแต่ละขั้น ไม่วิ่งไปเองจนจบ

**ทำไมต้อง `/clear` ก่อน?**

context ของการสัมภาษณ์ requirements ยาวมาก และไม่จำเป็นต่อการ implement อีกต่อไป การ `/clear` ช่วยลด token ที่ Claude ต้องประมวลผลในแต่ละ turn ทำให้ตอบเร็วขึ้นและแม่นยำขึ้น เมื่อ Claude อ่าน `docs/spec.md` ผ่าน `@docs/spec.md` มันจะได้ข้อมูล requirements ครบอีกครั้งในรูปแบบที่กระชับ

**✅ Checkpoint ตรวจสอบ:**
- Claude อ่าน `docs/spec.md` และยืนยันว่าเข้าใจ Phase 1
- Claude เริ่มจาก checklist ข้อแรกของ Phase 1 ไม่ข้ามขั้น
- เกริ่นถัดไป: ขั้นตอนที่ 4-16 ด้านล่างคือรายละเอียดของการ implement Phase 1 ทีละขั้น

---

### 🛠️ ขั้นตอนที่ 4: สร้างโปรเจกต์ Next.js 16

*ขั้นตอนนี้คือการ implement Phase 1 — ขั้นแรกตาม `docs/spec.md`*

> **หมายเหตุ Next.js 16:** Next.js 16 ใช้ **Turbopack เป็น default ทั้ง `next dev` และ `next build`** ไม่ต้องใส่ flag `--turbopack` แล้ว และต้องใช้ **Node.js 20.9+ (แนะนำ 22.x)** พร้อม **React 19.2** นอกจากนั้น Next.js 16 **ลบคำสั่ง `next lint` ออกแล้ว** — `next build` ไม่รัน lint ให้อีกต่อไป ให้ใช้ ESLint หรือ Biome ตรงๆ แทน

> **สำคัญ — เราอยู่ใน `stock-app/` อยู่แล้ว:** จากขั้นตอนที่ 0 เราเปิด Claude Code ภายในโฟลเดอร์ `stock-app/` และมี `docs/spec.md` อยู่แล้ว ดังนั้นให้ scaffold **ลงในโฟลเดอร์ปัจจุบัน** ด้วยเป้าหมาย `.` (จุด) — **ห้าม** ใช้ `stock-app` เป็นชื่อเป้าหมาย มิฉะนั้นจะได้โฟลเดอร์ `stock-app/stock-app/` ซ้อนกัน

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างโปรเจกต์ Next.js 16 ลงในโฟลเดอร์ปัจจุบัน (เราอยู่ใน stock-app แล้ว)
โดยใช้คำสั่ง (สังเกตว่าเป้าหมายคือ "." ไม่ใช่ชื่อโฟลเดอร์):
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*"

โฟลเดอร์นี้มี docs/spec.md อยู่แล้ว ซึ่ง create-next-app อนุญาต (docs อยู่ใน allowlist)
หลังสร้างเสร็จให้รายงานโครงสร้างโฟลเดอร์ที่ได้ (ไม่ต้อง cd ที่ไหนเพิ่ม เพราะอยู่ใน stock-app แล้ว)
ถ้า package.json มี script "lint": "next lint" ให้ลบออก เพราะ Next.js 16 ลบคำสั่งนี้แล้ว
```

**🤖 Claude Code จะทำอะไร:** Claude จะรันคำสั่ง `pnpm create next-app@latest .` พร้อม flags ที่ระบุ จะขอ permission ก่อนรันคำสั่งใน Terminal โปรเจกต์จะถูก scaffold ลงในโฟลเดอร์ `stock-app/` ปัจจุบัน (โดยที่ `docs/spec.md` เดิมยังอยู่ครบ) แล้วแสดงโครงสร้างไฟล์ให้ดู ไม่มีการสร้างโค้ดเพิ่มเติมในขั้นนี้

**✅ Checkpoint ตรวจสอบ (เราต้อง review อะไร):**
- ไฟล์ Next.js ถูก scaffold ลงใน `stock-app/` ปัจจุบัน — **ไม่มี** โฟลเดอร์ `stock-app/stock-app/` ซ้อนกัน
- โฟลเดอร์ `docs/` เดิม (พร้อม `docs/spec.md`) ยังอยู่ครบ ไม่ถูกลบหรือเขียนทับ
- มีไฟล์ `app/` อยู่ที่ root ของโปรเจกต์ (ไม่ใช่ `src/app/`)
- มีไฟล์ `tailwind.config.ts` และ `tsconfig.json`
- ใน `package.json` ไม่มี script `"lint": "next lint"` (Next.js 16 ลบออกแล้ว)
- รัน `pnpm dev` ได้โดยไม่มี error — Next.js 16 จะใช้ Turbopack อัตโนมัติ ไม่ต้องใส่ flag เพิ่ม
- เปิด http://localhost:3000 แล้วเห็นหน้า Next.js default

**📄 โค้ดอ้างอิง — โครงสร้างที่ควรได้ (สังเกตว่า `docs/` อยู่ร่วมกับไฟล์ Next.js ในโฟลเดอร์เดียว):**
```
stock-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── docs/
│   └── spec.md            ← ไฟล์เดิมจากขั้นตอนที่ 2 ยังอยู่ครบ
├── public/
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

### 🛠️ ขั้นตอนที่ 5: ติดตั้งและตั้งค่า shadcn/ui (Tailwind CSS v4)

*ขั้นตอนนี้วางรากฐาน UI ของโปรเจกต์ก่อนเริ่มสร้าง features — เพราะทุกหน้าจะใช้ component จาก shadcn/ui*

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ใน stock-app ให้ตั้งค่า shadcn/ui สำหรับ Tailwind CSS v4 ดังนี้:

1. รัน shadcn init:
   pnpm dlx shadcn@latest init
   เลือก style: new-york, base color: neutral, ใช้ CSS variables: yes
   (ถ้า CLI ถามก็ตอบตามนี้ ถ้า non-interactive ให้ใช้ flag --style new-york --base-color neutral)

2. หลัง init เสร็จให้เพิ่ม components ที่ใช้บ่อยใน stock-app:
   pnpm dlx shadcn@latest add button card input label badge table select

3. ตรวจสอบและแก้ไขไฟล์ให้ครบ:
   - postcss.config.mjs ต้องใช้ '@tailwindcss/postcss'
   - src/app/globals.css ต้องมี @import "tailwindcss"; และ @import "tw-animate-css"; พร้อม CSS variables
   - src/lib/utils.ts ต้องมีฟังก์ชัน cn ที่ใช้ clsx + tailwind-merge
   - components.json ต้องมี aliases: { "utils": "@/lib/utils", "components": "@/components/ui" }

4. ห้ามใส่ semicolon ใน TypeScript ทุกไฟล์
```

อ้างอิง: https://ui.shadcn.com/docs/installation/next

**🤖 Claude Code จะทำอะไร:** Claude จะรัน `shadcn init` ซึ่งติดตั้ง dependencies เพิ่มเติม ได้แก่ `tailwindcss v4`, `@tailwindcss/postcss`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css` จากนั้นสร้างไฟล์ `components.json` ที่ root, สร้าง `src/lib/utils.ts` พร้อมฟังก์ชัน `cn`, แก้ไข `src/app/globals.css` ให้มี `@import "tailwindcss"` และ CSS variables สำหรับ theme, แก้ไข `postcss.config.mjs` ให้ใช้ `@tailwindcss/postcss` และสร้าง components ทั้ง 7 รายการใน `src/components/ui/`

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์ `components.json` อยู่ที่ root ของโปรเจกต์ มี `style: "new-york"` และ `aliases.utils: "@/lib/utils"`
- ไฟล์ `src/lib/utils.ts` มีฟังก์ชัน `cn` ที่ใช้ `clsx` + `tailwind-merge` และไม่มี semicolon
- `src/app/globals.css` บรรทัดแรกคือ `@import "tailwindcss";` และมี `@import "tw-animate-css";` พร้อม `:root { --background: ... }` CSS variables
- `postcss.config.mjs` ใช้ `'@tailwindcss/postcss'` (ไม่ใช่ `tailwindcss` แบบเดิม)
- มีโฟลเดอร์ `src/components/ui/` พร้อมไฟล์ `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `badge.tsx`, `table.tsx`, `select.tsx`
- import alias ทุก component ใน `src/components/ui/` ใช้ `@/lib/utils` (ตรวจด้วย grep)
- รัน `pnpm build` ไม่มี error เกี่ยวกับ Tailwind หรือ PostCSS

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้:**

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

```css
/* src/app/globals.css (ส่วนหัว) */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  /* ... CSS variables ที่เหลือ */
}
```

---

### 🛠️ ขั้นตอนที่ 6: ติดตั้ง Prisma และเชื่อมต่อ PostgreSQL

*ขั้นตอนนี้คือการ implement Phase 1 ต่อจาก `docs/spec.md`*

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ใน stock-app ให้ทำตามนี้ (Prisma 7):
1. ติดตั้ง dev dependencies:
   pnpm add -D prisma @types/pg tsx
2. ติดตั้ง runtime dependencies (driver adapter + dotenv):
   pnpm add @prisma/client @prisma/adapter-pg pg dotenv
3. Initialize Prisma พร้อมระบุ output สำหรับ generated client:
   pnpm prisma init --datasource-provider postgresql --output ../src/generated/prisma
แล้วรายงานไฟล์ที่ถูกสร้างขึ้นทั้งหมด
```

**🤖 Claude Code จะทำอะไร:** Claude จะรันคำสั่ง pnpm add (2 รอบ) และ prisma init ตามลำดับ จะขอ permission ก่อนรันแต่ละคำสั่ง แล้วรายงานไฟล์ใหม่ที่ถูกสร้าง ได้แก่ `prisma/schema.prisma`, `.env`, และ `prisma.config.ts` (ไฟล์ใหม่ใน Prisma 7)

**✅ Checkpoint ตรวจสอบ (เราต้อง review อะไร):**
- โฟลเดอร์ `prisma/` ถูกสร้างพร้อมไฟล์ `schema.prisma`
- ไฟล์ `.env` ถูกสร้างที่ root ของโปรเจกต์
- ไฟล์ `prisma.config.ts` ถูกสร้างที่ root (ใหม่ใน Prisma 7 — ใช้กำหนด schema path, migration, seed, datasource URL สำหรับ CLI)
- ใน `schema.prisma` ต้องมี `provider = "postgresql"` ไม่ใช่ mysql หรืออื่น
- generator block ใช้ `provider = "prisma-client"` (Prisma 7 เปลี่ยน provider ใหม่แล้ว) และมี `output = "../src/generated/prisma"`

---

### 🛠️ ขั้นตอนที่ 7: ตั้งค่า PostgreSQL ด้วย Docker

ขั้นนี้รัน Docker เองใน Terminal แยก (ไม่ต้องใช้ Claude Code):

```bash
docker run --name stockapp-postgres \
  -e POSTGRES_USER=stockuser \
  -e POSTGRES_PASSWORD=stockpass \
  -e POSTGRES_DB=stockdb \
  -p 5432:5432 \
  -d postgres:16
```

ตรวจสอบว่า container รันอยู่:

```bash
docker ps
# ควรเห็น stockapp-postgres STATUS: Up
```

จากนั้นสั่ง Claude Code ให้ตั้งค่า `.env`:

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
แก้ไขไฟล์ .env ให้ตั้งค่า DATABASE_URL สำหรับ PostgreSQL ที่รันด้วย Docker:
- user: stockuser
- password: stockpass
- host: localhost
- port: 5432
- database: stockdb

และสร้างไฟล์ .env.example สำหรับทีม (ไม่ใส่ข้อมูลจริง)
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่านไฟล์ `.env` ปัจจุบัน แล้วแก้ไข `DATABASE_URL` ให้ถูกต้อง จากนั้นสร้างไฟล์ `.env.example` ที่มีเฉพาะ template โดยไม่ใส่ค่าจริง

**✅ Checkpoint ตรวจสอบ (เราต้อง review อะไร):**
- `.env` มีค่า `DATABASE_URL` ถูกต้องครบ `postgresql://stockuser:stockpass@localhost:5432/stockdb?schema=public`
- `.env.example` มีแค่ template ไม่มีข้อมูลจริง
- รันคำสั่ง `cat .gitignore | grep .env` แล้วเห็น `.env` อยู่ใน gitignore แล้ว (Next.js เพิ่มให้อัตโนมัติ)

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้:**
```bash
# .env
DATABASE_URL="postgresql://stockuser:stockpass@localhost:5432/stockdb?schema=public"

# .env.example
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/stockdb?schema=public"
```

---

### 🛠️ ขั้นตอนที่ 8: เขียน Prisma Schema

*ขั้นตอนนี้คือการ implement Phase 1 ต่อจาก `docs/spec.md` — Data Model ตรงกับที่ระบุใน spec*

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
แก้ไขไฟล์ @prisma/schema.prisma ให้มี 2 model สำหรับระบบคลังสินค้า
ตาม Data Model ใน @docs/spec.md และใช้ Prisma 7 generator ที่ถูกต้อง:

0. generator block (Prisma 7):
   - provider = "prisma-client" (Prisma 7 เปลี่ยน provider ใหม่)
   - output = "../src/generated/prisma"
   - runtime = "nodejs"
   - moduleFormat = "esm"
   - importFileExtension = "ts"

   datasource block:
   - provider = "postgresql"
   - ลบ url ออก (Prisma 7 ย้าย connection string ไป prisma.config.ts แล้ว)

1. enum TransactionType { IN, OUT }

2. model Product:
   - id (autoincrement, PK)
   - sku String unique (เช่น "SKU-1001")
   - name String
   - category String
   - unit String
   - quantity Int default 0
   - reorderPoint Int default 10
   - price Int default 0
   - createdAt DateTime default now()
   - updatedAt DateTime @updatedAt
   - transactions StockTransaction[] (relation)
   - @@map("products")

3. model StockTransaction:
   - id (autoincrement, PK)
   - productId Int
   - type TransactionType
   - quantity Int
   - note String? (optional)
   - createdAt DateTime default now()
   - product Product @relation (onDelete: Cascade)
   - @@map("stock_transactions")
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่านไฟล์ `prisma/schema.prisma` ที่มีอยู่ แล้วเขียนทับด้วย schema ใหม่ที่ใช้ generator `prisma-client` (Prisma 7) พร้อม output path และ model ทั้งสองตาม spec จะไม่รัน migration ในขั้นนี้

**✅ Checkpoint ตรวจสอบ (เราต้อง review อะไร):**
- generator block ใช้ `provider = "prisma-client"` (Prisma 7 เปลี่ยน provider ใหม่)
- มี `output = "../src/generated/prisma"` ในบล็อก generator
- มี `enum TransactionType { IN OUT }` (ไม่มี comma ระหว่าง value ใน Prisma)
- `sku` มี `@unique`
- `updatedAt` มี `@updatedAt`
- Relation ใน StockTransaction มี `onDelete: Cascade`
- `@@map(...)` สะกดถูก — `"products"` และ `"stock_transactions"`
- รัน `pnpm prisma validate` เพื่อตรวจสอบ schema ไม่มี error

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้:**
```prisma
// prisma/schema.prisma

generator client {
  provider            = "prisma-client"
  output              = "../src/generated/prisma"
  runtime             = "nodejs"
  moduleFormat        = "esm"
  importFileExtension = "ts"
}

datasource db {
  provider = "postgresql"
  // Prisma 7: connection string ย้ายไป prisma.config.ts (CLI) และส่งผ่าน driver adapter ใน src/lib/prisma.ts (runtime)
}

enum TransactionType {
  IN
  OUT
}

model Product {
  id           Int                @id @default(autoincrement())
  sku          String             @unique
  name         String
  category     String
  unit         String
  quantity     Int                @default(0)
  reorderPoint Int                @default(10)
  price        Int                @default(0)
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  transactions StockTransaction[]

  @@map("products")
}

model StockTransaction {
  id        Int             @id @default(autoincrement())
  productId Int
  type      TransactionType
  quantity  Int
  note      String?
  createdAt DateTime        @default(now())

  product   Product         @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("stock_transactions")
}
```

---

### 🛠️ ขั้นตอนที่ 9: รัน Migration + Generate Client + ตรวจสอบ prisma.config.ts

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ทำ 3 ขั้นตอนตามลำดับสำหรับ Prisma 7:

1. ตรวจสอบและแก้ไข prisma.config.ts ให้ถูกต้อง:
   - import 'dotenv/config' ที่บรรทัดแรก
   - ใช้ defineConfig จาก 'prisma/config'
   - schema: 'prisma/schema.prisma'
   - migrations.path: 'prisma/migrations'
   - migrations.seed: 'tsx prisma/seed.ts'
   - datasource.url: env('DATABASE_URL')

2. รัน migration ครั้งแรก:
   pnpm prisma migrate dev --name init

3. Generate Prisma Client (Prisma 7 ไม่ generate อัตโนมัติหลัง migrate):
   pnpm prisma generate

รายงาน output ของแต่ละขั้นและบอกว่าไฟล์ถูกสร้างที่ไหนบ้าง
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่านและแก้ไข `prisma.config.ts` ก่อน จากนั้นรัน migration (สร้าง SQL ใน `prisma/migrations/`) แล้วรัน `prisma generate` แยกต่างหาก เพื่อสร้าง Prisma Client เข้า `src/generated/prisma/`

> **สำคัญ (Prisma 7):** `prisma migrate dev` ใน Prisma 7 **ไม่ generate Prisma Client และไม่รัน seed อัตโนมัติแล้ว** ต้องรัน `pnpm prisma generate` และ `pnpm prisma db seed` (หรือ `pnpm db:seed`) แยกเอง

**✅ Checkpoint ตรวจสอบ (เราต้อง review อะไร):**
- `prisma.config.ts` มี `import 'dotenv/config'` บรรทัดแรก
- Output ของ migrate แสดง `Your database is now in sync with your schema`
- โฟลเดอร์ `prisma/migrations/` มีโฟลเดอร์ใหม่ชื่อ `..._init/` พร้อม `migration.sql`
- ภายใน `migration.sql` มี CREATE TABLE สำหรับทั้ง `products` และ `stock_transactions`
- โฟลเดอร์ `src/generated/prisma/` ถูกสร้างหลัง `prisma generate` (ไม่ใช่หลัง migrate)
- ถ้า error เรื่อง connection ให้ตรวจสอบว่า Docker container รันอยู่และ `.env` ถูกต้อง

**📄 โค้ดอ้างอิง — prisma.config.ts ที่ควรได้:**
```ts
// prisma.config.ts (ที่ root ของโปรเจกต์)
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts'
  },
  datasource: {
    url: env('DATABASE_URL')
  }
})
```

---

### 🛠️ ขั้นตอนที่ 10: สร้าง Prisma Client Singleton

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ src/lib/prisma.ts สำหรับ Prisma Client Singleton ที่ปลอดภัยสำหรับ Next.js Dev Server (Prisma 7)
- import PrismaClient จาก '@/generated/prisma/client' (ไม่ใช่ @prisma/client)
- ใช้ driver adapter: import PrismaPg จาก '@prisma/adapter-pg'
- สร้าง adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
- ใช้ globalThis เพื่อป้องกัน connection pool leak จาก Hot Reload
- สร้าง client ด้วย new PrismaClient({ adapter })
- ห้ามใส่ semicolon
```

**🤖 Claude Code จะทำอะไร:** Claude จะสร้างโฟลเดอร์ `src/lib/` (ถ้ายังไม่มี) แล้วสร้างไฟล์ `src/lib/prisma.ts` ที่ใช้ pattern globalThis singleton มาตรฐานสำหรับ Next.js + Prisma 7 พร้อม driver adapter

**✅ Checkpoint ตรวจสอบ (เราต้อง review อะไร):**
- ไฟล์ `src/lib/prisma.ts` ถูกสร้างในตำแหน่งที่ถูกต้อง (ไม่ใช่ `lib/db.ts`)
- import จาก alias `'@/generated/prisma/client'` (ใช้ alias ได้เพราะ tsconfig มี `@/*` → `./src/*` ; ใน `seed.ts` ใช้ relative path เพราะ tsx ไม่ resolve alias) ไม่ใช่ `'@prisma/client'`
- มี `import { PrismaPg } from '@prisma/adapter-pg'`
- ไม่มี semicolon ในไฟล์เลย
- มี `globalThis as unknown as { prisma?: PrismaClient }` ไม่ใช่ `global` แบบเก่า
- มีเงื่อนไข `process.env.NODE_ENV !== 'production'` ก่อนเซ็ต globalForPrisma.prisma

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้:**
```ts
// src/lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

> **Key Concept:** Prisma 7 ต้องใช้ driver adapter แทนการเชื่อมต่อฐานข้อมูลโดยตรง — `PrismaPg` รับ `connectionString` จาก environment variable แล้วส่งเข้า `PrismaClient({ adapter })` Next.js Dev Server รัน Hot Reload บ่อยมาก การใช้ `globalThis` เป็น singleton pattern ช่วยป้องกัน connection pool leak

---

### 🛠️ ขั้นตอนที่ 11: สร้าง Seed Data

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ prisma/seed.ts สำหรับ seed ข้อมูลตัวอย่างลง stock-app database (Prisma 7) โดย:

0. ส่วนหัวของไฟล์ต้องเป็น:
   import 'dotenv/config'
   import { PrismaPg } from '@prisma/adapter-pg'
   import { PrismaClient } from '../src/generated/prisma/client'
   import { TransactionType } from '../src/generated/prisma/enums'
   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
   const prisma = new PrismaClient({ adapter })

1. ลบข้อมูลเดิมก่อน (StockTransaction ก่อน Product เพราะมี relation)
2. สร้างสินค้า 7 รายการ ได้แก่:
   - SKU-1001: น้ำดื่มขวดใหญ่ 1.5L, เครื่องดื่ม, แพ็ค, quantity:120, reorder:20, price:89
   - SKU-1002: กาแฟดำกระป๋อง 180ml, เครื่องดื่ม, กระป๋อง, quantity:8, reorder:24, price:15
   - SKU-1003: ปากกาลูกลื่น Pilot 0.5mm, เครื่องเขียน, ด้าม, quantity:0, reorder:20, price:25
   - SKU-1004: กระดาษ A4 70g/m² (รีม), เครื่องเขียน, รีม, quantity:35, reorder:10, price:120
   - SKU-1005: เมาส์ไร้สาย Logitech M185, อุปกรณ์ IT, ชิ้น, quantity:5, reorder:5, price:590
   - SKU-1006: ถุงขยะดำ 30L (แพ็ค 50 ใบ), ของใช้, แพ็ค, quantity:12, reorder:5, price:45
   - SKU-1007: กล่องกระดาษลูกฟูก เบอร์ 5, บรรจุภัณฑ์, ใบ, quantity:3, reorder:20, price:18
3. สร้าง StockTransaction ตัวอย่างที่สมเหตุสมผล 9 รายการ
4. ห้ามใส่ semicolon

หลังสร้างไฟล์แล้วให้เพิ่ม script ใน package.json:
- "db:seed": "tsx prisma/seed.ts" ใน scripts
หมายเหตุ (Prisma 7): คำสั่ง `prisma db seed` อ่าน seed script จาก migrations.seed ใน prisma.config.ts (ตั้งไว้แล้วในขั้นตอนที่ 8) ไม่ต้องใส่ key "prisma" ใน package.json แบบ v6
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่าน `prisma/schema.prisma` และ `src/generated/prisma/` เพื่อเข้าใจ model แล้วสร้างไฟล์ `prisma/seed.ts` พร้อม seed ข้อมูลครบ จากนั้นอ่านและแก้ไข `package.json` เพื่อเพิ่ม `db:seed` script (ส่วน seed config สำหรับ `prisma db seed` อยู่ที่ `migrations.seed` ใน `prisma.config.ts` แล้ว)

**✅ Checkpoint ตรวจสอบ (เราต้อง review อะไร):**
- ไฟล์ `prisma/seed.ts` ไม่มี semicolon
- บรรทัดแรกคือ `import 'dotenv/config'`
- import `PrismaClient` จาก `'../src/generated/prisma/client'` ไม่ใช่ `'@prisma/client'`
- import `TransactionType` จาก `'../src/generated/prisma/enums'`
- สร้าง `adapter` และส่งเข้า `new PrismaClient({ adapter })`
- ลำดับการลบข้อมูลถูกต้อง — `deleteMany()` StockTransaction ก่อน Product
- ใน `package.json` มี `"db:seed": "tsx prisma/seed.ts"` ใน scripts และ seed config อยู่ที่ `migrations.seed` ใน `prisma.config.ts` (ไม่ใช่ key `"prisma"` แบบ v6)
- จำนวนสินค้าถูกต้อง 7 รายการ และ transaction สมเหตุสมผล (IN ก่อน OUT)

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (บางส่วน):**
```ts
// prisma/seed.ts
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { TransactionType } from '../src/generated/prisma/enums'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('เริ่ม Seed ข้อมูลตัวอย่าง...')

  await prisma.stockTransaction.deleteMany()
  await prisma.product.deleteMany()

  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'SKU-1001',
        name: 'น้ำดื่มขวดใหญ่ 1.5L',
        category: 'เครื่องดื่ม',
        unit: 'แพ็ค',
        quantity: 120,
        reorderPoint: 20,
        price: 89,
      },
    }),
    // ... สินค้าที่เหลือ
  ])

  // Transaction ตัวอย่าง
  const transactions = [
    { productId: products[0].id, type: TransactionType.IN, quantity: 120, note: 'รับสินค้าจาก Supplier ครั้งแรก' },
    { productId: products[1].id, type: TransactionType.IN, quantity: 24, note: 'รับสต็อกประจำเดือน' },
    { productId: products[1].id, type: TransactionType.OUT, quantity: 16, note: 'เบิกใช้ห้องประชุม' },
    // ... transaction ที่เหลือ
  ]

  for (const tx of transactions) {
    await prisma.stockTransaction.create({ data: tx })
  }

  console.log('Seed เสร็จสมบูรณ์!')
}

main()
  .catch((e) => {
    console.error('Seed ล้มเหลว:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

### 🛠️ ขั้นตอนที่ 12: รัน Seed (tsx ติดตั้งแล้วจากขั้นตอนที่ 6)

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
รัน seed ข้อมูลตัวอย่างลง database:
pnpm db:seed

ถ้า script db:seed ยังไม่มีให้รัน: pnpm prisma db seed
รายงาน output ที่ได้
```

**🤖 Claude Code จะทำอะไร:** Claude จะรันคำสั่ง seed ผ่าน tsx (ติดตั้งไว้แล้วตั้งแต่ขั้นตอนที่ 5) รายงาน output ที่ได้ รวมถึงจำนวนสินค้าและ transaction ที่ถูกสร้าง

> **หมายเหตุ:** Prisma 7 ใช้ `tsx` แทน `ts-node` สำหรับรัน TypeScript — `tsx` รองรับ ESM natively โดยไม่ต้องตั้งค่า `--compiler-options` พิเศษ

**✅ Checkpoint ตรวจสอบ (เราต้อง review อะไร):**
- Output แสดงข้อความ `Seed เสร็จสมบูรณ์!`
- ถ้ามี error เรื่อง import path ให้ตรวจสอบว่า `src/generated/prisma/` ถูกสร้างแล้ว (รัน `pnpm prisma generate` ก่อน)
- ถ้ามี error เรื่อง DATABASE_URL ให้ตรวจสอบว่า `.env` มีค่าถูกต้องและ seed.ts มี `import 'dotenv/config'` บรรทัดแรก

---

### 🛠️ ขั้นตอนที่ 13: ตรวจสอบข้อมูลด้วย Prisma Studio

ขั้นนี้รันเองใน Terminal:

```bash
pnpm prisma studio
```

เปิด Browser ไปที่ **http://localhost:5555** ตรวจสอบ:
- ตาราง `products` มี 7 แถว
- ตาราง `stock_transactions` มี 9 แถว
- ปิด Prisma Studio ด้วย `Ctrl+C` หลังตรวจสอบเสร็จ

---

### 🛠️ ขั้นตอนที่ 14: สร้าง CLAUDE.md ด้วย /init

เปิด Claude Code ในโปรเจกต์ (ถ้ายังอยู่ใน `stock-app/` จากขั้นตอนก่อนหน้า ก็พิมพ์ `claude` ได้เลย — บรรทัด `cd stock-app` ใช้เฉพาะกรณีเปิด terminal ใหม่จากโฟลเดอร์แม่):

```bash
cd stock-app   # ข้ามได้ถ้าอยู่ในโฟลเดอร์นี้อยู่แล้ว
claude
```

**💬 Prompt ที่ใช้สั่ง Claude Code (ใน Claude Code session):**
```
/init
```

รอให้ Claude scan โปรเจกต์และสร้าง CLAUDE.md ร่างแรก แล้วสั่งต่อ:

**💬 Prompt ที่ใช้ต่อ:**
```
อ่าน @CLAUDE.md ที่สร้างขึ้น แล้วปรับปรุงให้ครอบคลุมข้อมูลต่อไปนี้:
1. Tech Stack ครบ: Next.js 16 App Router, TypeScript strict, Prisma 7, PostgreSQL, Tailwind CSS v4, shadcn/ui, pnpm
2. กฎสำคัญ: ห้ามใส่ semicolon ใน TypeScript/JavaScript ทุกไฟล์
3. Naming convention: Component=PascalCase, utility/lib=camelCase
4. โครงสร้างโฟลเดอร์ตามที่มีอยู่จริง
5. Logic สถานะสต็อก: quantity===0 → หมดสต็อก, <=reorderPoint → ใกล้หมด, อื่น → ปกติ
6. Prisma model names: Product, StockTransaction, enum TransactionType {IN, OUT}
7. คำสั่งที่ใช้บ่อย: pnpm dev, pnpm build, pnpm prisma migrate dev, pnpm prisma studio, pnpm prisma db seed
8. ข้อห้าม: ห้ามแก้ migrations โดยตรง, ห้าม commit .env, ห้ามใช้ Prisma Client ใน Client Component
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่านไฟล์ CLAUDE.md ที่ /init สร้างไว้ แล้วแก้ไขและเพิ่มเนื้อหาตาม spec ที่กำหนด จะอ่านไฟล์จริงในโปรเจกต์เพื่อตรวจสอบความถูกต้องของ Tech Stack

**✅ Checkpoint ตรวจสอบ (เราต้อง review อะไร):**
- CLAUDE.md มีหัวข้อครบ: Tech Stack, กฎการเขียนโค้ด, โครงสร้างโฟลเดอร์, Prisma models, Logic สถานะสต็อก, คำสั่ง, ข้อห้าม
- กฎ no-semicolon ระบุชัดเจนพร้อมตัวอย่างถูก/ผิด
- ชื่อ model ถูกต้อง: `Product` และ `StockTransaction` (ไม่ใช่ Products หรือ stock_transaction)
- Tech Stack ระบุ Prisma 7 (ไม่ใช่ 5 หรือ 6)
- generator ระบุว่าใช้ `prisma-client` และ import จาก `src/generated/prisma`
- คำสั่งระบุว่าต้องรัน `pnpm prisma generate` แยกหลัง migrate

---

### 🛠️ ขั้นตอนที่ 15: วางโครง .claude/ — ให้ Claude ร่าง settings.json ตั้งต้น

*เราไม่พิมพ์ JSON เอง — สั่ง Claude ให้สร้างให้ แล้วค่อย review*

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ .claude/settings.json ตั้งต้นสำหรับ stock-app โดย:
1. กำหนด permissions ที่ปลอดภัย:
   - allow: อ่านและแก้ไขไฟล์ในโปรเจกต์, รัน pnpm (dev/build/test/prisma), รันคำสั่ง git read-only (status/log/diff)
   - ask ก่อนรัน: คำสั่งที่มีผลต่อ database (migrate, db push, db seed), docker, rm, และคำสั่งที่ส่งออกเน็ต
2. เว้น hooks ไว้เป็น object ว่าง (จะเติมวันที่ 3)
3. ระบุ model ค่าเริ่มต้นเป็น claude-sonnet-4

จากนั้นเพิ่ม .claude/settings.local.json ลงใน .gitignore
(settings.json commit ขึ้น Git ได้ — ทั้งทีมใช้ร่วมกัน แต่ settings.local.json เป็นของส่วนตัว)
```

**🤖 Claude Code จะทำอะไร:** Claude จะสร้างโฟลเดอร์ `.claude/` (ถ้ายังไม่มี) พร้อมไฟล์ `settings.json` ที่มี permissions สมเหตุสมผล จากนั้นอ่านและแก้ไข `.gitignore` เพื่อเพิ่มบรรทัด `.claude/settings.local.json`

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์ `.claude/settings.json` เป็น JSON ที่ถูกต้อง (ไม่มี trailing comma, โครงสร้างถูก)
- permissions ที่ได้ฟังดูสมเหตุสมผล — allow สิ่งที่ทำงานปกติ, ask ก่อนรันสิ่งที่อันตราย
- `.gitignore` มีบรรทัด `.claude/settings.local.json` เพิ่มเข้ามาแล้ว

**📄 ไฟล์อ้างอิง — ตัวอย่าง `.claude/settings.json` ที่ควรได้:**

```json
{
  "model": "claude-sonnet-4",
  "permissions": {
    "allow": [
      "Read(*)",
      "Write(*)",
      "Bash(pnpm *)",
      "Bash(git status)",
      "Bash(git log *)",
      "Bash(git diff *)"
    ],
    "deny": [],
    "ask": [
      "Bash(pnpm prisma migrate *)",
      "Bash(pnpm prisma db *)",
      "Bash(docker *)",
      "Bash(rm *)",
      "Bash(curl *)",
      "Bash(wget *)"
    ]
  },
  "hooks": {}
}
```

**บรรทัดที่ควรมีใน `.gitignore`:**
```
.claude/settings.local.json
```

> **Key Concept:** ไฟล์เหล่านี้เราให้ Claude สร้างให้ทั้งหมด (Vibe Coding) ไม่ต้องพิมพ์ JSON เอง เราทำหน้าที่ review ว่า permissions สมเหตุสมผลและไม่ลืม add settings.local.json ลง .gitignore

---

### 🛠️ ขั้นตอนที่ 16: ทดสอบว่า CLAUDE.md ทำงานจริง

*ขั้นสุดท้ายของ Phase 1 — ทดสอบว่า CLAUDE.md เป็น "สมอง" ที่ Claude อ่านและใช้งานได้จริง*

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
อ่านไฟล์ @src/lib/utils.ts (shadcn สร้างไว้แล้ว — มีฟังก์ชัน cn อยู่)
แล้วเพิ่ม utility functions สำหรับ stock-app โดยอ้างอิง logic จาก @CLAUDE.md
ต่อท้ายฟังก์ชัน cn ที่มีอยู่ (ห้ามลบ cn ออก):
1. getStockStatus(quantity, reorderPoint) → StockStatus
2. getStockStatusColor(status) → Tailwind class string สำหรับ badge
3. formatPrice(price: number) → string แบบไทย (เช่น "1,200 บาท")
4. formatDate(date: Date | string) → string แบบไทย (เช่น "4 ก.ค. 2569")
ห้ามใส่ semicolon
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่านไฟล์ `src/lib/utils.ts` ที่ shadcn สร้างไว้ (มีฟังก์ชัน `cn` อยู่แล้ว) จากนั้นอ่าน CLAUDE.md เพื่อดู logic สถานะสต็อก แล้วเพิ่ม functions ทั้ง 4 ต่อท้าย โดยคง `cn` ไว้ ไม่เขียนทับ

**✅ Checkpoint ตรวจสอบ (เราต้อง review อะไร):**
- ไฟล์ `src/lib/utils.ts` ยังมีฟังก์ชัน `cn` จาก shadcn อยู่ (ไม่หายไป)
- มี functions ใหม่ 4 ตัวต่อท้าย ไม่มี semicolon เลย
- `getStockStatus` ใช้ logic ตรงกับ CLAUDE.md: `=== 0` → หมดสต็อก, `<= reorderPoint` → ใกล้หมด
- `StockStatus` type ถูก export เพื่อนำไปใช้ที่อื่นได้
- `formatDate` ใช้ locale `th-TH`

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้:**
```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Stock App utilities ---

export type StockStatus = 'ปกติ' | 'ใกล้หมด' | 'หมดสต็อก'

export function getStockStatus(quantity: number, reorderPoint: number): StockStatus {
  if (quantity === 0) return 'หมดสต็อก'
  if (quantity <= reorderPoint) return 'ใกล้หมด'
  return 'ปกติ'
}

export function getStockStatusColor(status: StockStatus): string {
  const colorMap: Record<StockStatus, string> = {
    'ปกติ': 'bg-green-100 text-green-800',
    'ใกล้หมด': 'bg-yellow-100 text-yellow-800',
    'หมดสต็อก': 'bg-red-100 text-red-800',
  }
  return colorMap[status]
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString('th-TH')} บาท`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
```

---

## 🎯 Workshop ท้ายวัน: สำรวจ StockApp ด้วย Claude Code

ลองทำภารกิจเหล่านี้เองโดยใช้ Claude Code — ฝึกออกแบบ prompt และ review ผลลัพธ์

### ภารกิจที่ 1 — API Route แรก

**💬 Prompt ที่แนะนำ:**
```
สร้าง API Route: GET /api/products
ไฟล์: app/api/products/route.ts
- ดึงสินค้าทั้งหมดจาก database ด้วย Prisma ผ่าน @src/lib/prisma.ts
- return JSON { data: Product[], total: number }
- จัดการ error ด้วย try/catch และ return 500 ถ้าเกิด error
- ห้ามใส่ semicolon
```

ทดสอบหลัง Claude สร้างเสร็จ:

```bash
pnpm dev
curl http://localhost:3000/api/products
```

ควรได้ JSON response:
```json
{
  "data": [
    { "id": 1, "sku": "SKU-1001", "name": "น้ำดื่มขวดใหญ่ 1.5L", "quantity": 120 },
    ...
  ],
  "total": 7
}
```

### ภารกิจที่ 2 — ใช้ Plan Mode วางแผน Dashboard

กด `Shift+Tab` เพื่อเข้า Plan Mode แล้วถาม:
```
วางแผนการสร้าง Dashboard หน้าหลักของ StockApp
ที่แสดง:
- จำนวนสินค้าทั้งหมด, หมดสต็อก, ใกล้หมด (summary cards)
- ตารางสินค้า 5 รายการที่เพิ่งอัปเดตล่าสุด
ใช้ Next.js Server Component ดึงข้อมูลโดยตรงจาก Prisma
```

ดูว่า Claude Code วางแผนอย่างไร พิจารณาว่าจะอนุมัติหรือแก้ไขแผนก่อน

---

### สรุปโครงสร้างโปรเจกต์สิ้นวันที่ 1

```
stock-app/
├── CLAUDE.md                          ← สร้างและปรับปรุงแล้ว
├── prisma.config.ts                   ← Prisma 7 CLI config
├── components.json                    ← shadcn/ui config (style, aliases, Tailwind v4)
├── docs/
│   └── spec.md                        ← Spec-Driven Plan Mode แบ่ง Phase 1-5
├── .claude/
│   └── settings.json                  ← permissions + model ตั้งต้น (commit ขึ้น Git ได้)
├── .env                               ← DATABASE_URL ตั้งค่าแล้ว
├── .env.example                       ← template สำหรับทีม
├── .gitignore                         ← .env + src/generated/prisma อยู่ใน gitignore
├── app/
│   ├── api/products/route.ts          ← API Route แรก (Workshop)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css                    ← @import "tailwindcss" + CSS variables (shadcn theme)
├── src/
│   ├── components/
│   │   └── ui/                        ← shadcn/ui components (button, card, input, label, badge, table, select)
│   ├── generated/
│   │   └── prisma/                    ← Generated Prisma Client (gitignored)
│   └── lib/
│       ├── prisma.ts                  ← Prisma Client singleton + driver adapter
│       └── utils.ts                   ← cn() สำหรับ shadcn + getStockStatus, formatPrice, formatDate
├── prisma/
│   ├── schema.prisma                  ← Product + StockTransaction (generator: prisma-client)
│   ├── migrations/
│   │   └── 20260704000000_init/       ← Migration รันแล้ว
│   └── seed.ts                        ← ข้อมูล 7 สินค้า + 9 transactions
├── package.json                       ← prisma.seed + db:seed script
└── next.config.ts
```

---

## สรุปวันที่ 1

วันนี้เราได้เรียนรู้และลงมือทำ:

- ✅ เตรียม Environment ครบ — Node.js LTS, pnpm, Git, Docker, บัญชี Anthropic
- ✅ เข้าใจปรัชญา Vibe Coding — เราสั่ง AI เขียนโค้ด ไม่ได้พิมพ์เอง
- ✅ เข้าใจ Agentic Coding และความแตกต่างจาก AI Autocomplete ทั่วไป
- ✅ เข้าใจ Agentic Loop: อ่าน → วางแผน → แก้ไข → รัน → ตรวจสอบ
- ✅ ติดตั้ง Claude Code CLI และ Login สำเร็จ
- ✅ รู้จักคำสั่งพื้นฐาน: /help, /clear, /compact, /init, /model
- ✅ เลือก Permission Mode ได้อย่างเหมาะสมและปลอดภัย
- ✅ เลือก Model ให้เหมาะกับงาน (Opus / Sonnet / Haiku)
- ✅ เขียน Prompt ที่ดีด้วยหลักการ 5C
- ✅ ใช้ Plan Mode (Shift+Tab) วางแผนก่อนลงมือ
- ✅ สร้าง docs/spec.md แบ่ง Phase 1-5 ด้วย Plan Mode (Spec-Driven Workflow)
- ✅ สร้างและปรับปรุง CLAUDE.md — สมองของโปรเจกต์
- ✅ เข้าใจระบบ memory ของ Claude Code: CLAUDE.md (เราเขียนเอง, โหลดอัตโนมัติ) + Auto memory (Claude บันทึกเอง) — ไม่มี memory.md
- ✅ ให้ Claude วางโครง .claude/ — CLAUDE.md + settings.json ตั้งแต่ต้นโปรเจกต์ (Vibe Coding เราแค่ review)
- ✅ implement Phase 1 — Foundation สำเร็จครบทุก checklist:
  - สร้างโปรเจกต์ StockApp ด้วย Next.js 16 App Router + TypeScript + Tailwind CSS
  - ติดตั้ง shadcn/ui (Tailwind CSS v4) — components.json, src/components/ui/, src/lib/utils.ts (cn)
  - ออกแบบ Prisma Schema สำหรับ Product และ StockTransaction
  - ตั้งค่า PostgreSQL ด้วย Docker
  - รัน Migration และ Seed ข้อมูล 7 สินค้า + 9 Transaction สำเร็จ
  - สร้าง Prisma Client Singleton ที่ปลอดภัยสำหรับ Next.js
  - ทดสอบว่า CLAUDE.md ทำงานจริงผ่าน utility functions

**พรุ่งนี้ (วันที่ 2):** เราจะเริ่ม **Phase 2 — Core Features** ต่อจาก `docs/spec.md` — สร้าง UI จริง: หน้า Dashboard, รายการสินค้า, Server Component vs Client Component ใน Next.js App Router พร้อมสร้าง Form รับ/เบิกสินค้า, API Routes สำหรับ StockTransaction พร้อมกันเบิกเกิน และ Custom Slash Commands ทั้งหมดนี้ผ่าน Vibe Coding โดยอ้างอิง spec ที่เราวางไว้วันนี้

---

## แหล่งอ้างอิงเพิ่มเติม

- [Claude Code Official Docs](https://docs.anthropic.com/en/docs/claude-code) — เอกสารทางการของ Claude Code
- [Claude Code CLI Reference](https://docs.anthropic.com/en/docs/claude-code/cli-reference) — คำสั่งทั้งหมดของ CLI
- [Next.js 16 App Router Docs](https://nextjs.org/docs/app) — เอกสาร Next.js App Router
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started) — เริ่มต้นใช้งาน Prisma
- [Prisma Schema Reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference) — Reference ครบสำหรับ schema.prisma
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs) — เอกสาร Tailwind CSS
- [shadcn/ui Docs — Next.js Installation](https://ui.shadcn.com/docs/installation/next) — ติดตั้ง shadcn/ui กับ Next.js + Tailwind v4
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) — คู่มือ TypeScript อย่างเป็นทางการ
- [Docker Hub — postgres image](https://hub.docker.com/_/postgres) — PostgreSQL บน Docker
- [pnpm Docs](https://pnpm.io) — เอกสาร pnpm package manager
