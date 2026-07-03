# หลักสูตร Claude Code มือโปร: ดำน้ำลึกสู่ Production — วันที่ 4

## ทำงานเป็นทีมด้วย Claude Code, Docker Container และ CI Pipeline

**วันที่อบรม:** วันอาทิตย์ที่ 12 กรกฎาคม 2569 | เวลา 20:30–23:30 น.
**รูปแบบ:** อบรมออนไลน์ (สอนสด) ผ่าน Zoom Meeting
**วิทยากร:** อาจารย์สามิตร โกยม | IT Genius Engineering Co., Ltd.

---

## บทนำ

วันที่ 4 ของหลักสูตรนี้คือจุดเปลี่ยนสำคัญ — เราก้าวออกจากโลกของ "นักพัฒนาคนเดียว" ไปสู่การทำงานแบบ **ทีม** และการเตรียมแอปให้พร้อมสำหรับ **Production จริง**

ในวันที่ 1–3 เราได้สร้าง StockApp ระบบคลังสินค้าเบิกจ่ายที่ครบสมบูรณ์ ตั้งแต่ Next.js App Router, Prisma ORM, PostgreSQL, TypeScript ไปจนถึง Sub-agents, MCP, และ Hooks ของ Claude Code วันนี้เราจะ:

1. วางมาตรฐานการใช้ Claude Code ร่วมกันในทีมผ่าน `.claude/` บน Git
2. ใช้ Claude Code ช่วย Git Workflow — เขียน commit message, สร้าง PR, ทำ Code Review
3. บรรจุ StockApp ลงใน Docker Container ด้วย Multi-stage build
4. เชื่อม Next.js + PostgreSQL ด้วย Docker Compose
5. สร้าง CI Pipeline ด้วย GitHub Actions ให้ build + test + push image ขึ้น GitHub Container Registry (ghcr.io) โดยอัตโนมัติ

สไตล์ของวันนี้ยังคงเป็น **Vibe Coding** — คุณไม่ได้พิมพ์ Dockerfile, docker-compose.yml หรือ CI yaml เอง แต่ **สั่ง Claude Code ด้วย prompt** แล้วทำหน้าที่ตรวจสอบ (review) ผลลัพธ์ที่ได้

> **Key Concept:** DevOps ยุคใหม่ไม่ใช่แค่ "Ops" — นักพัฒนาต้องเขียน Dockerfile, CI yaml ได้เอง และ Claude Code ช่วยให้เขียนได้เร็วขึ้นมาก

---

## ทบทวน Spec ก่อนเริ่ม: วันนี้คือ Phase 4 — Team & Containerization

ก่อนลงมือ เราเปิด `docs/spec.md` ที่สร้างไว้วันที่ 1 ขึ้นมาทบทวนว่าวันนี้อยู่ Phase ไหน แล้วใช้มันเป็นฐานสั่งงาน Claude Code เสมอ

### 🛠️ ขั้นตอนเปิดวัน: โหลด spec แล้วล็อกขอบเขต Phase 4

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
/clear
อ่าน @docs/spec.md แล้วสรุปสั้น ๆ ว่า Phase 4 (Team & Containerization) มีงานย่อยอะไรบ้าง
ยืนยันว่า Phase 1-3 เสร็จครบแล้ว จากนั้นรอให้ฉันสั่งทำทีละงาน อย่าเพิ่งลงมือ
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่าน `docs/spec.md` ดึงเฉพาะหัวข้อ Phase 4 มาสรุปเป็น checklist และยังไม่แตะไฟล์จนกว่าเราจะสั่ง

**✅ Checkpoint ตรวจสอบ:**

- งานที่ Claude สรุปตรงกับ Phase 4 ใน spec ไหม (แชร์ `.claude/` ผ่าน Git, Git workflow, Dockerfile multi-stage, Docker Compose, CI ขึ้น ghcr.io)
- ถ้าอยากปรับขอบเขต ให้สั่ง Claude อัปเดต `docs/spec.md` ก่อนลงมือ

> **Key Concept:** การเปิด spec ต้นวันแล้ว `/clear` ทำให้ context ของ Claude สะอาดและโฟกัสเฉพาะ Phase ที่กำลังทำ — สำคัญมากเมื่อโปรเจกต์เริ่มใหญ่ขึ้นและมีไฟล์ config จำนวนมาก

---

## Module 4.1: มาตรฐานการใช้ AI ร่วมกันในทีม

### 4.1.1 โฟลเดอร์ `.claude/` คืออะไร?

เมื่อเราเรียกใช้ Claude Code ใน project ใดก็ตาม Claude จะอ่านไฟล์ config จากโฟลเดอร์ `.claude/` ซึ่งอยู่ที่ root ของ project นั้น โฟลเดอร์นี้เป็นศูนย์กลางของ "ความเข้าใจ project" ทั้งหมด

```
stock-app/
├── .claude/
│   ├── CLAUDE.md              ← คำอธิบาย project, กฎการเขียนโค้ด, context
│   ├── settings.json          ← config ส่วนกลางของทีม (commit ขึ้น Git)
│   ├── settings.local.json    ← config ส่วนตัว (ห้าม commit — อยู่ใน .gitignore)
│   ├── commands/              ← Custom slash commands (/deploy, /review ฯลฯ)
│   │   ├── review.md
│   │   ├── deploy-check.md
│   │   └── db-migrate.md
│   └── agents/                ← Sub-agent definitions
│       ├── code-reviewer.md
│       └── test-writer.md
├── src/
├── prisma/
└── ...
```

### 4.1.2 อะไร Commit / อะไรไม่ Commit

| ไฟล์ / โฟลเดอร์ | Commit ขึ้น Git? | เหตุผล |
|---|---|---|
| `.claude/CLAUDE.md` | ✅ ควร commit | ทีมทุกคนต้องเห็น context เดียวกัน |
| `.claude/settings.json` | ✅ ควร commit | config ส่วนกลาง เช่น allowed tools, model |
| `.claude/commands/` | ✅ ควร commit | Custom commands ที่ทีมใช้ร่วมกัน |
| `.claude/agents/` | ✅ ควร commit | Sub-agent definitions สำหรับทีม |
| `.claude/settings.local.json` | ❌ ห้าม commit | config ส่วนตัว เช่น API key, path ในเครื่อง |
| `.claude/todos.json` | ❌ ห้าม commit | TodoList ชั่วคราว ไม่ใช่ของทีม |

เพิ่มใน `.gitignore`:

```
# Claude Code - personal settings only
.claude/settings.local.json
.claude/todos.json
```

### 4.1.3 ASCII Diagram — ทีมใช้ Config เดียวกัน

```
GitHub Repository
└── stock-app/
    └── .claude/
        ├── CLAUDE.md          ← "ข้อตกลงของทีม"
        ├── settings.json      ← "เครื่องมือที่อนุญาต"
        ├── commands/          ← "คำสั่งลัดที่ใช้ร่วมกัน"
        └── agents/            ← "ผู้ช่วย AI ของทีม"
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
 Dev A       Dev B      Dev C
(ท้องถิ่น)  (ท้องถิ่น)  (ท้องถิ่น)
git clone   git clone   git clone
    │          │          │
    └──────────┴──────────┘
         Claude Code อ่าน .claude/
         ทุกคนมี context เดียวกัน
         คำสั่ง /review ทำงานเหมือนกัน
```

### 4.1.4 CLAUDE.md มาตรฐานสำหรับ Stock App — ผลลัพธ์อ้างอิง

ไฟล์ `.claude/CLAUDE.md` ของทีมควรมีโครงสร้างแบบนี้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):

```markdown
# Stock App — Claude Code Context

## โปรเจกต์
ระบบคลังสินค้าเบิกจ่าย (StockApp) สำหรับองค์กร
- Next.js 16 (App Router, standalone output)
- TypeScript + Prisma ORM + PostgreSQL + Tailwind CSS
- Package manager: pnpm

## กฎการเขียนโค้ด (บังคับ)
- TypeScript/JavaScript: ห้ามใส่ semicolon (;) ท้ายบรรทัดเด็ดขาด
- ใช้ single quote สำหรับ string ใน JS/TS
- Component ต้องมี TypeScript types ครบ
- ไม่ใช้ `any` type
- ใช้ Tailwind สำหรับ styling ทั้งหมด

## Prisma Models หลัก
- Product: id, name, sku, quantity, unit, minStock, createdAt, updatedAt
- StockTransaction: id, productId, type (TransactionType), quantity,
  note, createdAt
- TransactionType enum: IN | OUT

## API Routes (App Router)
- GET/POST /api/products
- GET/PUT/DELETE /api/products/[id]
- GET/POST /api/transactions
- GET /api/dashboard/stats

## Production Domain
- https://stock.itgenius.app
- Container Registry: ghcr.io/[org]/stock-app

## คำสั่งที่ใช้บ่อย
- pnpm dev — รัน development server
- pnpm build — build production
- pnpm db:migrate — รัน Prisma migrate dev
- pnpm db:seed — seed ข้อมูลตัวอย่าง
```

### 4.1.5 settings.json ส่วนกลาง — ผลลัพธ์อ้างอิง

ไฟล์ `.claude/settings.json` ควบคุม behavior ของ Claude Code สำหรับทั้งทีม (ไว้เทียบ ไม่ใช่พิมพ์เอง):

```json
{
  "model": "claude-opus-4-5",
  "permissions": {
    "allow": [
      "Bash(pnpm *)",
      "Bash(git *)",
      "Bash(docker *)",
      "Bash(prisma *)",
      "Read(**)",
      "Write(src/**)",
      "Write(prisma/**)",
      "Write(.claude/**)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm exec tsc --noEmit --skipLibCheck"
          }
        ]
      }
    ]
  }
}
```

---

## Module 4.2: Git Workflow ร่วมกับ Claude Code

### 4.2.1 Conventional Commits คืออะไร?

Conventional Commits เป็นมาตรฐาน commit message ที่ทีมส่วนใหญ่ใช้ใน 2026 รูปแบบคือ:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

| Type | ความหมาย | ตัวอย่าง |
|---|---|---|
| `feat` | เพิ่มฟีเจอร์ใหม่ | `feat(products): add low stock alert` |
| `fix` | แก้บัก | `fix(api): handle null product id` |
| `refactor` | refactor โค้ด ไม่เปลี่ยน behavior | `refactor(db): extract query helpers` |
| `test` | เพิ่ม/แก้ test | `test(products): add unit tests for create` |
| `chore` | งาน config, build | `chore: update pnpm lockfile` |
| `docs` | เอกสาร | `docs: update API README` |
| `ci` | CI/CD pipeline | `ci: add docker build workflow` |
| `perf` | ปรับ performance | `perf(query): add index on sku` |

### 4.2.2 ให้ Claude เขียน Commit Message

หลังจากเขียนโค้ดเสร็จและ `git add` ไฟล์ที่ต้องการแล้ว สั่ง Claude Code ให้ช่วยเขียน commit message:

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ดูการเปลี่ยนแปลงทั้งหมดที่ staged แล้วเขียน commit message
แบบ Conventional Commits ภาษาอังกฤษให้หน่อย
```

Claude จะรัน `git diff --staged` แล้วเขียน message ที่เหมาะสม เช่น:

```
feat(transactions): add stock OUT validation

- Validate that quantity does not exceed current stock level
- Return 400 with descriptive error message when stock is insufficient
- Add StockInsufficientError type for consistent error handling

Closes #42
```

### 4.2.3 Custom Command `/commit`

สร้างไฟล์ `.claude/commands/commit.md` — ผลลัพธ์อ้างอิง (ไว้เทียบ ไม่ใช่พิมพ์เอง):

```markdown
# Smart Commit

รัน `git diff --staged` เพื่อดูการเปลี่ยนแปลงทั้งหมด
แล้วเขียน commit message แบบ Conventional Commits ที่เหมาะสม

กฎ:
- subject line ไม่เกิน 72 ตัวอักษร
- ใช้ imperative mood ("add" ไม่ใช่ "added")
- ถ้ามีหลาย scope ให้แยกเป็น commit ย่อย
- ระบุ issue number ถ้าหาได้จาก branch name

จากนั้นถามว่าต้องการ commit เลยหรือไม่
```

ใช้งานด้วย:

```
> /commit
```

### 4.2.4 ให้ Claude ช่วยสร้าง Pull Request

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ฉันอยู่บน branch feat/low-stock-alert ต้องการ merge เข้า main
ช่วยดู commits ทั้งหมดใน branch นี้แล้วเขียน PR title, description,
และ checklist สำหรับ reviewer ให้หน่อย
```

Claude จะอ่าน git log, diff สรุปสิ่งที่เปลี่ยน และเขียน PR description เช่น:

```markdown
## feat: add low stock alert system

### Summary
เพิ่มระบบแจ้งเตือนเมื่อสต็อกสินค้าต่ำกว่า minStock
ที่กำหนด ครอบคลุม UI badge, API endpoint, และ background check

### Changes
- `src/app/api/products/low-stock/route.ts` — API ดึงรายการสินค้าสต็อกต่ำ
- `src/components/LowStockBadge.tsx` — Badge แสดงจำนวนสินค้าต้องเติม
- `src/app/dashboard/page.tsx` — เพิ่ม badge ที่ header

### Test Plan
- [ ] เพิ่มสินค้าที่มี quantity < minStock แล้วดู badge แสดง
- [ ] ตรวจสอบ API GET /api/products/low-stock ว่า return ถูก
- [ ] ทดสอบ edge case: quantity = 0, minStock = 0
```

### 4.2.5 Custom Command `/review`

สร้างไฟล์ `.claude/commands/review.md` — ผลลัพธ์อ้างอิง (ไว้เทียบ ไม่ใช่พิมพ์เอง):

```markdown
# Code Review

อ่านไฟล์ที่ระบุ (หรือ git diff ถ้าไม่ระบุ) แล้วทำ Code Review โดยตรวจสอบ:

1. **Security** — SQL injection, XSS, exposed secrets, improper auth
2. **TypeScript** — ไม่มี `any`, types ครบ, ไม่ใช้ semicolon
3. **Performance** — N+1 query, missing index, unnecessary re-render
4. **Error Handling** — ครอบคลุม edge case, error message ชัดเจน
5. **Prisma** — ใช้ transaction ถูกต้อง, select เฉพาะ field ที่ต้องการ
6. **Next.js** — Server vs Client component ถูกที่, ไม่ leak server data

สรุปเป็น: ✅ ผ่าน / ⚠️ แนะนำปรับ / ❌ ต้องแก้ก่อน merge
```

ตัวอย่างการใช้งาน:

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
/review src/app/api/transactions/route.ts
```

---

## Module 4.3: พื้นฐาน Docker

### 4.3.1 Image, Container, Registry คืออะไร?

```
┌─────────────────────────────────────────────────────┐
│               GitHub Container Registry              │
│          ghcr.io/org/stock-app:latest                │
│  (เก็บ Image ไว้บน Cloud — ทุกคนดึงได้)             │
└───────────────────────┬─────────────────────────────┘
                        │  docker pull / docker push
          ┌─────────────▼──────────────┐
          │         Docker Image        │
          │  (Blueprint — อ่านอย่างเดียว│
          │   เหมือน class ใน OOP)      │
          └─────────────┬──────────────┘
                        │  docker run (สร้าง instance)
          ┌─────────────▼──────────────┐
          │       Docker Container      │
          │  (Instance ที่รันจริง —     │
          │   เหมือน object ที่ new()   │
          │   จาก class)                │
          └────────────────────────────┘
```

| คำศัพท์ | อุปมา | ตัวอย่าง |
|---|---|---|
| **Dockerfile** | สูตรอาหาร | รายการขั้นตอนสร้าง Image |
| **Image** | แม่พิมพ์ / Class | `ghcr.io/org/stock-app:1.0.0` |
| **Container** | Object / Instance ที่รันจริง | `docker run stock-app` |
| **Registry** | คลังเก็บ Image | GitHub Container Registry (ghcr.io) |
| **Volume** | Persistent storage | `/var/lib/postgresql/data` |
| **Network** | LAN ส่วนตัวของ containers | `stock-network` |

### 4.3.2 ทำไมต้อง Multi-stage Build?

```
Single-stage Build (ห้ามใช้):          Multi-stage Build (แนะนำ):
┌──────────────────────────┐           ┌─────────────────┐
│  Node.js + dev tools     │           │  Stage 1: deps  │ ← ติดตั้ง packages
│  + source code           │           │  node_modules/  │
│  + node_modules          │           └────────┬────────┘
│  + build artifacts       │                    │ copy artifacts เท่านั้น
│  ~1.2 GB                 │           ┌────────▼────────┐
│  มี dev dependencies     │           │ Stage 2: builder│ ← build Next.js
│  มี source map           │           │  .next/         │
│  Security risk สูง       │           └────────┬────────┘
└──────────────────────────┘                    │ copy .next/standalone เท่านั้น
                                       ┌────────▼────────┐
                                       │ Stage 3: runner │ ← Image ที่รันจริง
                                       │  ~200 MB        │
                                       │  non-root user  │
                                       │  ไม่มี src code │
                                       └─────────────────┘
```

### 4.3.3 ตั้งค่า Next.js Standalone Output

ก่อนเขียน Dockerfile ต้องตั้งค่า `next.config.ts` ก่อน:

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // standalone output จะ bundle ทุกอย่างที่จำเป็นไว้ใน .next/standalone/
  // ทำให้ Deploy ใน Docker ได้โดยไม่ต้องมี node_modules เต็ม
}

export default nextConfig
```

> **Key Concept:** `output: 'standalone'` ทำให้ Next.js สร้าง `server.js` ที่ไม่ต้องการ `node_modules` เต็ม สามารถรันได้ด้วย `node server.js` เพียงอย่างเดียว ทำให้ Image เล็กลงมาก

### 4.3.4 Dockerfile แบบ Multi-stage Build สำหรับ Next.js — ผลลัพธ์อ้างอิง

ไฟล์ `Dockerfile` ที่ Claude Code จะสร้างให้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):

```dockerfile
# ============================================================
# Stage 1: deps — ติดตั้ง production dependencies เท่านั้น
# ============================================================
FROM node:22-alpine AS deps

# ติดตั้ง libc6-compat สำหรับ Alpine (จำเป็นสำหรับ native modules บางตัว)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy เฉพาะไฟล์ที่ใช้ติดตั้ง packages ก่อน
# ประโยชน์: Docker cache layer — ถ้า package.json ไม่เปลี่ยน ไม่ต้อง install ใหม่
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# ติดตั้ง pnpm และ dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile && \
    pnpm exec prisma generate

# ============================================================
# Stage 2: builder — build Next.js application
# ============================================================
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

WORKDIR /app

# Copy node_modules จาก stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code ทั้งหมด
COPY . .

# ตั้ง environment variable สำหรับ build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js — จะสร้าง .next/standalone/
RUN pnpm build

# ============================================================
# Stage 3: runner — Image ที่ใช้รันจริงใน Production
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# สร้าง non-root user เพื่อความปลอดภัย
# อย่ารัน application ด้วย root user เด็ดขาด
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy ไฟล์ static assets
COPY --from=builder /app/public ./public

# Copy standalone output (Next.js bundle ทุกอย่างไว้แล้ว)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma client สำหรับ runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Switch ไปใช้ non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# รัน Next.js standalone server
CMD ["node", "server.js"]
```

### 4.3.5 คำสั่ง Docker พื้นฐาน

```bash
# Build image จาก Dockerfile ใน current directory
docker build -t stock-app:local .

# รัน container จาก image
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/stockdb" \
  stock-app:local

# ดู containers ที่รันอยู่
docker ps

# ดู logs ของ container
docker logs <container_id>

# เข้าไปใน container (debug)
docker exec -it <container_id> sh

# หยุด container
docker stop <container_id>

# ดู images ทั้งหมด
docker images
```

---

## Module 4.4: Docker Compose หลาย Service

### 4.4.1 ทำไมต้อง Docker Compose?

```
ปัญหาถ้ารันเอง:                    Docker Compose แก้:
docker run postgresql ...           ┌─────────────────────────┐
docker run stock-app ...            │   docker-compose.yml    │
ต้องจำ flags, ports, env ทั้งหมด   │                         │
ต้องจัดการ network เอง             │  services:              │
ถ้าปิดเครื่องข้อมูลหาย            │    db:        ──────┐   │
                                    │      postgres       │   │
                                    │    app:       ──────┤   │
                                    │      stock-app     │   │
                                    │                    │   │
                                    │  networks: ────────┘   │
                                    │  volumes:  (persistent) │
                                    └─────────────────────────┘
                                    docker compose up -d
                                    (คำสั่งเดียว ทุกอย่างขึ้น)
```

### 4.4.2 docker-compose.yml เต็ม — ผลลัพธ์อ้างอิง

ไฟล์ `docker-compose.yml` ที่ Claude Code จะสร้างให้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):

```yaml
# docker-compose.yml
version: '3.9'

services:
  # --- PostgreSQL Database -------------------------------------------
  db:
    image: postgres:16-alpine
    container_name: stock-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-stockuser}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-stockpass}
      POSTGRES_DB: ${POSTGRES_DB:-stockdb}
    volumes:
      # Persistent volume — ข้อมูลไม่หายแม้ container หยุด
      - postgres_data:/var/lib/postgresql/data
    ports:
      # expose port สำหรับ debug เท่านั้น ใน production อาจลบบรรทัดนี้
      - "5432:5432"
    networks:
      - stock-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-stockuser} -d ${POSTGRES_DB:-stockdb}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  # --- Database Migration (รันครั้งเดียว แล้วจบ) --------------------
  migrate:
    build:
      context: .
      target: builder
    container_name: stock-migrate
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-stockuser}:${POSTGRES_PASSWORD:-stockpass}@db:5432/${POSTGRES_DB:-stockdb}
    command: >
      sh -c "npx prisma migrate deploy && npx prisma db seed"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - stock-network
    restart: "no"

  # --- Next.js Application ------------------------------------------
  app:
    build:
      context: .
      target: runner
    container_name: stock-app
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-stockuser}:${POSTGRES_PASSWORD:-stockpass}@db:5432/${POSTGRES_DB:-stockdb}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL:-http://localhost:3000}
      NEXT_PUBLIC_APP_URL: ${BETTER_AUTH_URL:-http://localhost:3000}
      NODE_ENV: production
    ports:
      - "${APP_PORT:-3000}:3000"
    depends_on:
      db:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully
    networks:
      - stock-network
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

# --- Volumes ----------------------------------------------------------
volumes:
  postgres_data:
    driver: local

# --- Networks ---------------------------------------------------------
networks:
  stock-network:
    driver: bridge
```

### 4.4.3 ไฟล์ `.env.example` — ผลลัพธ์อ้างอิง

เก็บไว้ใน repo เพื่อให้ทีมรู้ว่าต้องตั้งค่าอะไรบ้าง (ไม่ใส่ค่าจริง):

```bash
# .env.example
# Copy ไฟล์นี้เป็น .env แล้วเติมค่าจริง
# cp .env.example .env

# --- PostgreSQL -------------------------------------------------------
POSTGRES_USER=stockuser
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=stockdb

# --- Prisma / Application --------------------------------------------
DATABASE_URL=postgresql://stockuser:your_secure_password_here@localhost:5432/stockdb

# --- Better Auth -----------------------------------------------------
# สร้าง secret ด้วย: openssl rand -base64 32  (อย่างน้อย 32 ตัวอักษร)
BETTER_AUTH_SECRET=your_better_auth_secret_here
BETTER_AUTH_URL=https://stock.itgenius.app
NEXT_PUBLIC_APP_URL=https://stock.itgenius.app

# --- Port ------------------------------------------------------------
APP_PORT=3000
```

> **Key Concept:** ไม่เคย commit ไฟล์ `.env` ที่มีค่าจริงขึ้น Git เพิ่ม `.env` ใน `.gitignore` เสมอ แต่ `.env.example` ควร commit เพื่อเป็น template

### 4.4.4 Health Check Endpoint — ผลลัพธ์อ้างอิง

ไฟล์ `src/app/api/health/route.ts` ที่ Claude Code จะสร้างให้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // ทดสอบ database connection
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      },
      { status: 503 }
    )
  }
}
```

### 4.4.5 คำสั่ง Docker Compose

```bash
# รัน services ทั้งหมด (background)
docker compose up -d

# ดู logs แบบ real-time
docker compose logs -f

# ดู logs เฉพาะ service
docker compose logs -f app

# ดูสถานะ services
docker compose ps

# หยุด services (container ยังอยู่)
docker compose stop

# หยุดและลบ containers (volume ยังอยู่)
docker compose down

# หยุดและลบทุกอย่างรวมถึง volumes (ข้อมูลหาย!)
docker compose down -v

# Build images ใหม่แล้วรัน
docker compose up -d --build
```

---

## Module 4.5: CI Pipeline ด้วย GitHub Actions

### 4.5.1 CI/CD คืออะไร?

```
Developer push code → GitHub
           │
           ▼
   GitHub Actions รับ trigger
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
 CI Pipeline    (ถ้าผ่านทุก job)
 ─────────────
 1. Checkout code          CD Pipeline (วันที่ 5)
 2. Install dependencies   ─────────────────────
 3. Type check             1. Pull image ใหม่
 4. Run tests              2. Stop container เก่า
 5. Build Docker image     3. Start container ใหม่
 6. Push to ghcr.io        4. Health check
           │
           ▼
   ghcr.io/org/stock-app:sha-abc123
   (Image พร้อม deploy แล้ว)
```

**CI (Continuous Integration)** — อัตโนมัติ: build, test, push image ทุกครั้งที่ push
**CD (Continuous Deployment)** — อัตโนมัติ: deploy image ใหม่ไปยัง server (วันที่ 5)

### 4.5.2 GitHub Secrets ที่ต้องตั้งค่า

ไปที่ GitHub Repository → Settings → Secrets and variables → Actions:

| Secret Name | ค่า | ใช้ทำอะไร |
|---|---|---|
| `POSTGRES_PASSWORD` | รหัสผ่าน PostgreSQL | ใช้ตอน test |
| `BETTER_AUTH_SECRET` | random string ≥ 32 chars | secret ของ Better Auth (ใช้ตอน build/run) |
| `GITHUB_TOKEN` | (อัตโนมัติ — ไม่ต้องตั้ง) | push image ขึ้น ghcr.io |

> **Key Concept:** `GITHUB_TOKEN` ถูกสร้างโดย GitHub Actions อัตโนมัติทุก workflow run ไม่ต้องสร้างเอง แต่ต้องให้ permission `packages: write` ใน workflow

### 4.5.3 ไฟล์ `.github/workflows/ci.yml` เต็ม — ผลลัพธ์อ้างอิง

ไฟล์ `.github/workflows/ci.yml` ที่ Claude Code จะสร้างให้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):

```yaml
# .github/workflows/ci.yml
name: CI — Build, Test, Push Image

# --- Trigger ----------------------------------------------------------
on:
  push:
    branches:
      - main
      - 'feat/**'
      - 'fix/**'
  pull_request:
    branches:
      - main

# --- Permissions ------------------------------------------------------
permissions:
  contents: read
  packages: write     # จำเป็นสำหรับ push image ขึ้น ghcr.io

# --- Environment Variables --------------------------------------------
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}    # org/stock-app

# --- Jobs -------------------------------------------------------------
jobs:
  # ------------------------------------------------------------------
  # Job 1: Type Check + Test
  # ------------------------------------------------------------------
  test:
    name: Type Check & Test
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm exec prisma generate
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb

      - name: Run database migrations
        run: pnpm exec prisma migrate deploy
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb

      - name: TypeScript type check
        run: pnpm exec tsc --noEmit

      - name: Run tests
        run: pnpm test --passWithNoTests
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb

  # ------------------------------------------------------------------
  # Job 2: Build and Push Docker Image
  # ------------------------------------------------------------------
  build-and-push:
    name: Build & Push Image
    runs-on: ubuntu-latest
    needs: test           # รอ job test ผ่านก่อน
    # Push image เฉพาะเมื่อ push เข้า main เท่านั้น
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=sha-
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NEXT_TELEMETRY_DISABLED=1

      - name: Image digest
        run: echo "Image pushed - ${{ steps.meta.outputs.tags }}"
```

### 4.5.4 อธิบาย Job และ Step สำคัญ

```
workflow: CI — Build, Test, Push Image
│
├── on: push (main, feat/**, fix/**), pull_request (main)
│
├── job: test ─────────────────────────────────────────────
│   ├── service: postgres (สร้าง PostgreSQL สำหรับ test)
│   ├── Checkout → Setup pnpm → Setup Node → Install
│   ├── prisma generate + migrate deploy (สร้าง schema)
│   ├── tsc --noEmit (ตรวจ TypeScript)
│   └── pnpm test (รัน tests)
│
└── job: build-and-push (รันเฉพาะ push main, ต้องผ่าน test)
    ├── Checkout
    ├── Setup Buildx (รองรับ multi-platform)
    ├── Login to ghcr.io (ด้วย GITHUB_TOKEN อัตโนมัติ)
    ├── Extract metadata (สร้าง tags: latest, sha-abc123, main)
    └── Build & Push (พร้อม GitHub Actions cache)
```

---

## 🎯 Workshop ท้ายวัน: Containerize stock-app ตั้งแต่ต้นจนถึง CI Pipeline

ทำตามขั้นตอนด้านล่างเพื่อ:
1. เพิ่ม `Dockerfile` และ `docker-compose.yml` ให้ stock-app
2. ทดสอบ build และรันด้วย Docker Compose บนเครื่อง
3. Push โค้ดขึ้น GitHub ให้ CI build image อัตโนมัติ

---

### 🛠️ ขั้นตอนที่ 1: เตรียม next.config.ts สำหรับ standalone output

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยตรวจสอบ next.config.ts ของ stock-app ว่ามีการตั้งค่า output: 'standalone' แล้วหรือยัง
ถ้ายังไม่มีช่วยเพิ่มให้ด้วย อธิบายด้วยว่า standalone output คืออะไรและทำไมต้องใช้กับ Docker
```

**🤖 Claude Code จะทำอะไร:** Claude อ่าน `next.config.ts` ตรวจสอบ config ปัจจุบัน แล้วเพิ่ม `output: 'standalone'` ถ้ายังไม่มี

**✅ Checkpoint ตรวจสอบ:**
- เปิด `next.config.ts` ดูว่ามี `output: 'standalone'` จริง
- ไม่มี semicolon (;) ท้าย statement ใน TypeScript
- ไม่มี `any` type หรือ TypeScript error

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้:**
```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

---

### 🛠️ ขั้นตอนที่ 2: สร้าง Dockerfile แบบ Multi-stage Build

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยเขียน Dockerfile แบบ multi-stage สำหรับ Next.js standalone ของ stock-app
ใช้ node:22-alpine, pnpm, และต้องมี non-root user ใน stage runner
รวม Prisma client ด้วย เพราะ app ต้องเชื่อม PostgreSQL
```

**🤖 Claude Code จะทำอะไร:** Claude สร้างไฟล์ `Dockerfile` ที่ root ของ project ประกอบด้วย 3 stages (deps, builder, runner) ขอ permission `Write(Dockerfile)`

**✅ Checkpoint ตรวจสอบ:**
- มี 3 stage: `AS deps`, `AS builder`, `AS runner`
- stage runner มีคำสั่ง `addgroup` และ `adduser` สร้าง non-root user
- มี `USER nextjs` ก่อน `CMD`
- `CMD ["node", "server.js"]` ใช้ standalone server
- มี `COPY --chown=nextjs:nodejs` สำหรับ `.next/standalone`
- จุดที่ AI มักพลาด: ลืม copy `node_modules/@prisma` และ `node_modules/prisma` ทำให้ Prisma runtime ไม่ทำงาน

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้:** ดู Module 4.3.4 ด้านบน

---

### 🛠️ ขั้นตอนที่ 3: ทดสอบ Build Image บนเครื่อง

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วย build Docker image ของ stock-app แล้วตรวจสอบขนาด image
ถ้ามี error ช่วย debug และแก้ไขด้วย
```

**🤖 Claude Code จะทำอะไร:** รันคำสั่ง `docker build -t stock-app:local .` แล้วรัน `docker images stock-app` แสดงขนาด ขอ permission `Bash(docker *)`

**✅ Checkpoint ตรวจสอบ:**
- Build ผ่านไม่มี error
- ขนาด image ไม่เกิน 300MB (ปกติประมาณ 200–250MB)
- เห็น output: `[+] Building ... FINISHED`
- จุดที่ AI มักพลาด: ถ้า pnpm-lock.yaml ไม่ตรงกับ package.json `--frozen-lockfile` จะ fail ต้องรัน `pnpm install` บนเครื่องก่อน

```bash
# ผลลัพธ์ตัวอย่าง
docker images stock-app
# REPOSITORY   TAG     IMAGE ID       CREATED          SIZE
# stock-app    local   abc123def456   2 minutes ago    218MB
```

---

### 🛠️ ขั้นตอนที่ 4: สร้าง docker-compose.yml และ .env.example

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยสร้าง docker-compose.yml สำหรับ stock-app ที่มี 3 services:
1. db: postgres:16-alpine พร้อม healthcheck
2. migrate: รัน prisma migrate deploy และ prisma db seed แล้วจบ (restart: no)
3. app: stock-app ที่รอ db healthy และ migrate เสร็จก่อน

ใช้ network ชื่อ stock-network และ volume ชื่อ postgres_data
สร้าง .env.example ด้วย
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ `docker-compose.yml` และ `.env.example` ที่ root ของ project ขอ permission `Write(docker-compose.yml)` และ `Write(.env.example)`

**✅ Checkpoint ตรวจสอบ:**
- service `db` มี `healthcheck` ใช้ `pg_isready`
- service `migrate` มี `depends_on: db: condition: service_healthy`
- service `app` มี `depends_on: migrate: condition: service_completed_successfully`
- ใช้ `${POSTGRES_USER:-stockuser}` pattern (มี default value)
- มี `volumes: postgres_data:` และ `networks: stock-network:`
- `.env.example` ไม่มีค่าจริง — มีแต่ placeholder
- จุดที่ AI มักพลาด: ลืมใส่ `restart: "no"` ให้ service migrate ทำให้ Compose พยายาม restart migrate loop ไม่หยุด

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้:** ดู Module 4.4.2 และ 4.4.3 ด้านบน

---

### 🛠️ ขั้นตอนที่ 5: สร้าง Health Check Endpoint

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยสร้าง API route สำหรับ health check ที่ path /api/health
ต้องตรวจสอบ database connection ด้วย prisma.$queryRaw SELECT 1
ถ้า database ไม่ตอบสนองให้ return status 503
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ `src/app/api/health/route.ts` ขอ permission `Write(src/**)`

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์อยู่ที่ `src/app/api/health/route.ts`
- ไม่มี semicolon (;) ใน TypeScript
- มี try/catch ครอบ Prisma query
- return status 503 เมื่อ database error
- ไม่ใช้ `any` type

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้:** ดู Module 4.4.4 ด้านบน

---

### 🛠️ ขั้นตอนที่ 6: ตั้งค่า .env และรัน Docker Compose บนเครื่อง

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วย copy .env.example เป็น .env แล้วตรวจสอบว่าต้องเพิ่ม .env ใน .gitignore ด้วย
จากนั้นรัน docker compose up -d --build แล้วรอจนทุก service พร้อม
ทดสอบ health check endpoint ด้วย curl
```

**🤖 Claude Code จะทำอะไร:** รัน `cp .env.example .env`, ตรวจ `.gitignore`, รัน `docker compose up -d --build`, รอ healthcheck, รัน `curl http://localhost:3000/api/health` ขอ permission `Bash(docker *)`, `Bash(cp *)`, `Write(.gitignore)`

**✅ Checkpoint ตรวจสอบ:**
- ไม่มี `.env` ใน Git (`git status` ไม่แสดง `.env`)
- `docker compose ps` แสดงทุก service เป็น `running (healthy)`
- `curl http://localhost:3000/api/health` ตอบกลับ `{"status":"ok",...}`
- เปิด browser `http://localhost:3000` เห็น stock-app
- จุดที่ AI มักพลาด: ถ้า service `migrate` รันก่อน `db` พร้อม จะเกิด connection error — ต้องมี `depends_on: condition: service_healthy`

```bash
# ผลลัพธ์ที่ต้องเห็น
docker compose logs migrate
# stock-migrate | Running migration: 20260101000000_init
# stock-migrate | The seed command has been executed.
# stock-migrate exited with code 0

docker compose logs app
# stock-app | Ready on http://0.0.0.0:3000
```

---

### 🛠️ ขั้นตอนที่ 7: ให้ Claude Code เขียน Commit Message และ Commit

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วย git add ไฟล์ที่เกี่ยวกับ Docker ทั้งหมด ได้แก่
Dockerfile, docker-compose.yml, .env.example, next.config.ts
และ src/app/api/health/route.ts
แล้วเขียน commit message แบบ Conventional Commits ที่เหมาะสม
```

**🤖 Claude Code จะทำอะไร:** รัน `git add` ตามที่ระบุ, รัน `git diff --staged` วิเคราะห์ changes, เขียน commit message เหมาะสม, ขอ permission `Bash(git *)`

**✅ Checkpoint ตรวจสอบ:**
- `git status` แสดงไฟล์ที่ staged ถูกต้อง ไม่รวม `.env`
- commit message ขึ้นต้นด้วย `ci:` หรือ `feat:` เหมาะกับ changes
- subject line ไม่เกิน 72 ตัวอักษร
- มี body อธิบาย changes

```bash
# ตัวอย่าง commit message ที่ดี
ci: add Docker containerization and compose setup

- Add multi-stage Dockerfile with standalone Next.js build
- Add docker-compose.yml with PostgreSQL, migration, and app services
- Add .env.example as configuration template
- Add health check endpoint at /api/health
- Configure next.config.ts with standalone output
```

---

### 🛠️ ขั้นตอนที่ 8: สร้าง GitHub Actions CI Workflow

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยสร้าง GitHub Actions CI workflow สำหรับ stock-app
ที่ .github/workflows/ci.yml
ต้องการ 2 jobs:
1. test: รัน TypeScript type check และ pnpm test โดยใช้ postgres service
2. build-and-push: build และ push Docker image ขึ้น ghcr.io
   เฉพาะเมื่อ push เข้า branch main เท่านั้น และต้องรอ job test ผ่านก่อน

ใช้ pnpm v9, node:22, docker/build-push-action@v5 พร้อม GitHub Actions cache
```

**🤖 Claude Code จะทำอะไร:** สร้างโฟลเดอร์ `.github/workflows/` แล้วสร้างไฟล์ `ci.yml` ขอ permission `Bash(mkdir *)`, `Write(.github/**)`

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์อยู่ที่ `.github/workflows/ci.yml`
- มี `permissions: packages: write` สำหรับ push image
- job `build-and-push` มี `needs: test` และ `if: github.ref == 'refs/heads/main'`
- มี `cache-from: type=gha` และ `cache-to: type=gha,mode=max`
- ใช้ `${{ secrets.GITHUB_TOKEN }}` (ไม่ใช่ secret ที่สร้างเอง)
- มี tags แบบ `sha-` prefix สำหรับ traceability
- จุดที่ AI มักพลาด: ลืมใส่ `--passWithNoTests` ทำให้ workflow fail เมื่อยังไม่มี test file

**📄 ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้:** ดู Module 4.5.3 ด้านบน

---

### 🛠️ ขั้นตอนที่ 9: ตั้งค่า GitHub Repository Secrets

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยแนะนำขั้นตอนการตั้งค่า GitHub Repository Secrets ที่จำเป็น
สำหรับ CI workflow ของ stock-app และอธิบายว่า GITHUB_TOKEN ทำงานอย่างไร
```

**🤖 Claude Code จะทำอะไร:** อธิบายขั้นตอน Settings → Secrets and variables → Actions พร้อมแสดง secret ที่ต้องตั้ง และอธิบายกลไก GITHUB_TOKEN

**✅ Checkpoint ตรวจสอบ:**
- ตั้งค่า `POSTGRES_PASSWORD` ใน GitHub Secrets แล้ว
- ตั้งค่า `BETTER_AUTH_SECRET` ใน GitHub Secrets แล้ว (รันสร้างด้วย `openssl rand -base64 32`)
- Package visibility ใน GitHub Packages เป็น Public หรือตรงกับ repo

---

### 🛠️ ขั้นตอนที่ 10: Push โค้ดและดู CI Pipeline รัน

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วย commit ไฟล์ .github/workflows/ci.yml ด้วย message ที่เหมาะสม
แล้ว push ขึ้น GitHub และบอกฉันว่าจะไปดู CI pipeline ได้ที่ไหน
```

**🤖 Claude Code จะทำอะไร:** รัน `git add .github/`, เขียน commit message `ci: add GitHub Actions CI workflow`, รัน `git push origin main`, แสดง URL ให้ดู workflow ขอ permission `Bash(git *)`

**✅ Checkpoint ตรวจสอบ:**
- ไปที่ GitHub → repository → แท็บ **Actions** เห็น workflow กำลังรัน
- job `test` ผ่านทุก step (Checkout, Install, prisma generate, type check, test)
- job `build-and-push` รอ `test` ผ่านก่อนแล้วเริ่ม build
- เมื่อสำเร็จ เห็น image ที่ `https://github.com/[org]/stock-app/pkgs/container/stock-app`
- image มี tags: `latest`, `main`, `sha-xxxxxxx`

```
CI — Build, Test, Push Image                   ✅ passed
├── test                                        ✅ passed
│   ├── Checkout code                           ✅
│   ├── Setup pnpm                              ✅
│   ├── Install dependencies                    ✅
│   ├── Generate Prisma Client                  ✅
│   ├── Run database migrations                 ✅
│   ├── TypeScript type check                   ✅
│   └── Run tests                               ✅
└── build-and-push                              ✅ passed
    ├── Login to ghcr.io                        ✅
    ├── Extract metadata                        ✅
    └── Build and push Docker image             ✅
```

---

### 🛠️ ขั้นตอนที่ 11: ตั้งค่า `.claude/` สำหรับทีม

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยสร้าง team configuration สำหรับ Claude Code ใน .claude/
ประกอบด้วย:
1. CLAUDE.md — context ของ project stock-app พร้อมกฎ no semicolon
2. settings.json — permissions อนุญาต pnpm, git, docker, prisma แต่ deny rm -rf และ sudo
3. commands/commit.md — custom command /commit สำหรับเขียน Conventional Commit
4. commands/review.md — custom command /review สำหรับ code review

เพิ่ม .claude/settings.local.json และ .claude/todos.json ใน .gitignore ด้วย
```

**🤖 Claude Code จะทำอะไร:** สร้างโครงสร้าง `.claude/` ทั้งหมด สร้างแต่ละไฟล์ตามที่ระบุ แก้ไข `.gitignore` ขอ permission `Write(.claude/**)`, `Write(.gitignore)`

**✅ Checkpoint ตรวจสอบ:**
- `.claude/CLAUDE.md` มีกฎ "ห้ามใช้ semicolon"
- `.claude/settings.json` มี `"deny": ["Bash(rm -rf *)", "Bash(sudo *)"]`
- `.claude/commands/commit.md` มีคำสั่งอธิบายการเขียน Conventional Commits
- `.claude/commands/review.md` มี checklist ครอบคลุม Security, TypeScript, Performance
- `.gitignore` มีบรรทัด `.claude/settings.local.json` และ `.claude/todos.json`
- รันคำสั่ง `/commit` ใน Claude Code ได้ทันที

**💬 Prompt ต่อเนื่อง — Commit .claude/ ขึ้น Git:**
```
ช่วย commit .claude/ folder ทั้งหมดด้วย message ที่เหมาะสม แล้ว push ขึ้น GitHub
```

---

### Checklist ยืนยันผลลัพธ์ Workshop

หลัง Workshop เสร็จ ตรวจสอบ:

```
[ ] docker build -t stock-app:local . ผ่าน ไม่มี error
[ ] docker images แสดง size ไม่เกิน 300MB
[ ] docker compose up -d --build ทำให้ app รันที่ http://localhost:3000 ได้
[ ] curl http://localhost:3000/api/health ตอบกลับ {"status":"ok",...}
[ ] ข้อมูลใน PostgreSQL ยังอยู่แม้ docker compose stop แล้ว up ใหม่
[ ] GitHub Actions workflow ผ่านทั้ง test และ build-and-push
[ ] เห็น image ที่ ghcr.io/[org]/stock-app:latest
[ ] .claude/ committed และ .claude/settings.local.json อยู่ใน .gitignore
[ ] /commit และ /review custom commands ใช้งานได้ใน Claude Code
```

---

## สรุปวันที่ 4

วันนี้เราได้เรียนรู้และลงมือทำในรูปแบบ Vibe Coding:

- ✅ วางมาตรฐาน `.claude/` ให้ทีมใช้ Claude Code ร่วมกันได้ผ่าน Git — CLAUDE.md, settings.json, custom commands `/commit` และ `/review`
- ✅ แยกแยะไฟล์ที่ควร commit กับไม่ควร commit (settings.local.json ต้องอยู่ใน .gitignore เสมอ)
- ✅ ใช้ Claude Code ช่วยเขียน Conventional Commit message, สร้าง PR description, และทำ Code Review แทนการพิมพ์เอง
- ✅ เข้าใจ Image / Container / Registry และ Multi-stage build ที่ทำให้ image เล็กและปลอดภัย (Single-stage ~1.2GB → Multi-stage ~200MB)
- ✅ สั่ง Claude Code เขียน Dockerfile สำหรับ Next.js standalone output แบบ 3 stage (deps → builder → runner) พร้อม non-root user
- ✅ สั่ง Claude Code สร้าง docker-compose.yml เชื่อม Next.js + PostgreSQL — จัดการ environment, volume, network, healthcheck ครบ
- ✅ สั่ง Claude Code สร้าง CI Pipeline ด้วย GitHub Actions ที่ build + test + push image ขึ้น ghcr.io อัตโนมัติทุกครั้งที่ push main

**พรุ่งนี้ (วันที่ 5):** เราจะนำ Docker image ที่ build ได้วันนี้ไป **Deploy จริงบน VPS** ผ่าน Nginx reverse proxy พร้อม HTTPS (Let's Encrypt) และตั้งค่า CD Pipeline ให้ pull image ใหม่และ restart container อัตโนมัติเมื่อ CI ผ่าน — จบด้วยระบบที่รันบน `stock.itgenius.app` จริง!

---

## แหล่งอ้างอิงเพิ่มเติม

- [Claude Code Documentation — Shared Configuration](https://docs.anthropic.com/claude-code/shared-configuration) — เอกสารทางการเรื่อง `.claude/` folder
- [Conventional Commits Specification](https://www.conventionalcommits.org/) — มาตรฐาน commit message
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/) — เอกสาร Docker อย่างเป็นทางการ
- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) — เอกสาร Next.js standalone mode
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/) — Reference ไฟล์ docker-compose.yml
- [GitHub Actions Documentation](https://docs.github.com/en/actions) — เอกสาร GitHub Actions
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) — วิธีใช้ ghcr.io
- [docker/build-push-action](https://github.com/docker/build-push-action) — GitHub Action สำหรับ build และ push Docker image
