# หลักสูตร Claude Code มือโปร: ดำน้ำลึกสู่ Production — วันที่ 2

## พัฒนาฟีเจอร์คลังสินค้าให้ใช้งานได้จริง พร้อมเทคนิค Context และ Slash Commands

**วันที่อบรม:** วันอาทิตย์ที่ 5 กรกฎาคม 2569 | เวลา 20:30–23:30 น.
**รูปแบบ:** อบรมออนไลน์ (สอนสด) ผ่าน Zoom Meeting
**วิทยากร:** อาจารย์สามิตร โกยม | IT Genius Engineering Co., Ltd.

---

## บทนำ

วันที่ 1 เราวางรากฐาน StockApp เรียบร้อยแล้ว — สร้างโปรเจกต์ Next.js 16 (App Router) + TypeScript ด้วย pnpm, กำหนด Prisma Schema (Product, StockTransaction), เชื่อม PostgreSQL, และตั้งค่า Tailwind CSS จนพร้อมใช้งาน

**วันนี้เราจะก้าวไปอีกขั้น:** แต่ก่อนจะสร้างฟีเจอร์คลังสินค้าได้ เราต้องมี **ระบบ Authentication** ก่อน — วันนี้จึงเริ่มด้วยการวางระบบ login/register/forgot-password และป้องกันทุกหน้าด้วย proxy (Next.js 16) โดยใช้ **Better Auth** จากนั้นจึงสร้างฟีเจอร์จริงๆ ทั้ง CRUD สินค้า, ระบบรับเข้า-เบิกจ่ายสต็อก, และหน้า Dashboard ที่ใช้ได้จริงในองค์กร — **UI ทุกส่วนใช้ component ของ shadcn/ui** ที่ติดตั้งไว้ตั้งแต่วันที่ 1

พร้อมกันนั้นเราจะเรียนรู้เทคนิคชั้นสูง 2 อย่างที่ทำให้การทำงานกับ Claude Code รวดเร็วและแม่นยำขึ้นอย่างมาก ได้แก่ **การบริหาร Context Window** และ **Custom Slash Commands**

**โค้ดอ้างอิงในโน้ตนี้มีไว้เพื่ออะไร?**

ทุกบล็อก "📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้" **ไม่ใช่สิ่งที่ต้องพิมพ์ตาม** แต่มีไว้เพื่อ:
- **เทียบ** กับสิ่งที่ Claude สร้างขึ้นมาว่าถูกต้องหรือไม่
- **ช่วย review** จุดที่ AI มักพลาด เช่น ลืมใส่ return type, ใส่ semicolon โดยไม่ตั้งใจ
- **อ้างอิง** เมื่อต้องการ debug หรือเปรียบเทียบ logic

> Claude Code generate โค้ดต่างกันเล็กน้อยในแต่ละครั้ง — โค้ดอ้างอิงคือ "ทิศทาง" ไม่ใช่ "คำตอบตายตัว"

---

## ทบทวน Spec ก่อนเริ่ม: วันนี้คือ Phase 2 — Core Features

วันที่ 1 เราให้ Claude สร้าง `docs/spec.md` ที่แบ่งงานทั้งโปรเจกต์เป็น Phase 1-5 ไว้แล้ว ก่อนลงมือทุกวันเราจะ "เปิด spec" ขึ้นมาเป็นฐานเสมอ เพื่อให้ Claude Code ทำงานตรงกับแผนรวมและไม่หลุดทิศ

### 🛠️ ขั้นตอนเปิดวัน: โหลด spec แล้วล็อกขอบเขต Phase 2

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
/clear
อ่าน @docs/spec.md แล้วสรุปสั้น ๆ ว่า Phase 2 (Core Features) มีงานย่อยอะไรบ้าง
ยืนยันว่า Phase 1 (Foundation) เสร็จครบแล้ว จากนั้นรอให้ฉันสั่งทำทีละงาน อย่าเพิ่งลงมือ
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่าน `docs/spec.md` ดึงเฉพาะหัวข้อ Phase 2 มาสรุปเป็น checklist สั้น ๆ ตรวจว่า Phase 1 เสร็จแล้ว และยังไม่แก้ไฟล์ใด ๆ จนกว่าเราจะสั่ง

**✅ Checkpoint ตรวจสอบ:**

- รายการงานที่ Claude สรุปตรงกับ Phase 2 ใน spec จริงไหม (ระบบ Auth (Better Auth): login/register/forgot + guard ทุกหน้า, CRUD สินค้า, Stock In/Out กันเบิกเกิน, Dashboard + แจ้งเตือน, Slash Commands)
- ถ้า spec กับงานจริงเริ่มไม่ตรง (เช่นอยากเพิ่มฟีเจอร์) ให้สั่ง Claude อัปเดต `docs/spec.md` ก่อน แล้วค่อยลงมือ

> **Key Concept:** `docs/spec.md` คือ "สัญญา" ของทั้งโปรเจกต์ การเปิด spec ต้นวันแล้ว `/clear` ทำให้ context ของ Claude สะอาดและโฟกัสเฉพาะ Phase ที่กำลังทำ — เป็นหัวใจของการพาโปรเจกต์ใหญ่ให้ไม่หลุดทิศ

---

## สิ่งที่เตรียมไว้จากวันที่ 1

ก่อนเริ่ม ตรวจสอบว่าโปรเจกต์ stock-app พร้อมใช้งาน:

```bash
cd stock-app
pnpm dev
```

โครงสร้างที่ควรมีอยู่แล้ว:

```
stock-app/
├── prisma/
│   ├── schema.prisma       ← generator prisma-client + Product/StockTransaction
│   └── seed.ts             ← ข้อมูลตัวอย่าง SKU-1001..SKU-1007 (ใช้ driver adapter)
├── prisma.config.ts        ← config ของ Prisma 7 (schema/migrations/datasource)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   └── prisma.ts       ← Prisma Client singleton (สร้างด้วย PrismaPg adapter)
│   └── generated/prisma/   ← โค้ด client ที่ generate (gitignored — รัน prisma generate)
├── .env                    ← DATABASE_URL เชื่อม PostgreSQL แล้ว
├── .claude/
│   └── CLAUDE.md           ← Context ของโปรเจกต์
└── package.json
```

> **Key Concept (Prisma 7):** ตั้งแต่วันที่ 1 เราตั้งค่า `src/lib/prisma.ts` ให้สร้าง client ด้วย driver adapter — `new PrismaClient({ adapter })` โดย `adapter = new PrismaPg({ connectionString })` — และ import `PrismaClient` จาก `../generated/prisma/client` (ไม่ใช่ `@prisma/client`) ข่าวดีคือ **โค้ดฝั่งฟีเจอร์วันนี้ไม่เปลี่ยนเลย** ทุกที่ยังเรียกผ่าน `import { prisma } from '@/lib/prisma'` และใช้ `prisma.product.findMany()`, `prisma.$transaction()` เหมือนเดิมทุกประการ — adapter ถูกซ่อนไว้ใน singleton ที่เดียว

---

## Module 2.0: ระบบ Authentication ด้วย Better Auth

### ทำไมต้องมี Auth ก่อนสร้างฟีเจอร์?

ฟีเจอร์คลังสินค้าทั้งหมด (CRUD, Stock In/Out, Dashboard) ควรเข้าถึงได้เฉพาะผู้ใช้ที่ login แล้วเท่านั้น หากสร้างฟีเจอร์โดยไม่มี auth ก่อน จะต้องย้อนกลับมาเพิ่ม guard ภายหลัง — เสียเวลาและเสี่ยงพลาด ดังนั้น **Module นี้ต้องทำก่อนเสมอ**

### Better Auth คืออะไร?

**Better Auth** คือ authentication library สำหรับ TypeScript ที่รองรับ email/password, session management และเชื่อม Prisma ได้ผ่าน adapter — ไม่ต้องเขียน auth logic เองตั้งแต่ต้น อ้างอิง docs: https://www.better-auth.com/docs/installation

```
สิ่งที่ Module 2.0 จะสร้าง:
├── src/lib/auth.ts              ← config Better Auth (email/password + Prisma adapter)
├── src/lib/auth-client.ts       ← client-side hooks (signIn, signUp, useSession)
├── src/app/api/auth/[...all]/   ← API route handler
├── src/proxy.ts                 ← guard ทุกหน้า — redirect → /login ถ้าไม่ได้ login
└── src/app/(auth)/              ← หน้า login, register, forgot-password, reset-password
                                    (UI ใช้ shadcn/ui: Card, Input, Label, Button)
```

> **Key Concept:** เราจะ guard ทุกหน้าด้วย proxy ระดับ Next.js 16 — ไม่ต้องเพิ่ม auth check ใน component ทีละหน้า ทำครั้งเดียวป้องกันได้ทั้งแอป

---

### 🛠️ ขั้นที่ 1: ติดตั้งและตั้งค่า Better Auth

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ติดตั้ง better-auth และตั้งค่าดังนี้:
1. เพิ่ม env ใน .env: BETTER_AUTH_SECRET (random string ≥ 32 ตัว), BETTER_AUTH_URL=http://localhost:3000, NEXT_PUBLIC_APP_URL=http://localhost:3000
2. สร้าง src/lib/auth.ts แบบ email/password + Prisma adapter (import prisma จาก @/lib/prisma)
   - sendResetPassword: dev mode — log reset link ใน console แทนการส่งอีเมลจริง
3. ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** รัน `pnpm add better-auth`, เพิ่ม env, สร้างไฟล์ `src/lib/auth.ts`

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์ `src/lib/auth.ts` มี `prismaAdapter(prisma, { provider: 'postgresql' })`
- `.env` มี `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`
- Prisma 7 ต้องใช้ `prisma` ที่ import จาก `@/lib/prisma` (มี driver adapter) — **ไม่ใช่** `new PrismaClient()` เปล่า

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```ts
// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Dev mode: ไม่ส่งอีเมลจริง แต่ log reset link ใน console
      console.log('[DEV] Reset link สำหรับ ' + user.email + ': ' + url)
    }
  }
})
```

---

### 🛠️ ขั้นที่ 2: เพิ่ม Prisma Models ของ Better Auth + Migrate

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
เพิ่ม model สำหรับ Better Auth ลงใน @prisma/schema.prisma ดังนี้:
- user: id, name, email (unique), emailVerified, image (optional), role, createdAt, updatedAt
- session: id, token (unique), expiresAt, userId (relation → user)
- account: id, accountId, providerId, userId (relation → user), password (optional), createdAt, updatedAt
- verification: id, identifier, value, expiresAt, createdAt, updatedAt
ทุก model ใช้ @@map เป็น snake_case เช่น @@map("user"), @@map("session") ฯลฯ
จากนั้นรัน pnpm prisma migrate dev --name add-auth-models
และรัน pnpm prisma generate
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** เพิ่ม model ใน schema, รัน migrate, รัน generate รอ permission

**✅ Checkpoint ตรวจสอบ:**
- ตาราง `user`, `session`, `account`, `verification` ถูกสร้างใน database
- `pnpm prisma generate` รวม model ใหม่เข้า Prisma Client แล้ว
- ไม่มี semicolon ในไฟล์ที่แก้

---

### 🛠️ ขั้นที่ 3: สร้าง API Route และ Auth Client

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างสองไฟล์พร้อมกัน:
1. src/app/api/auth/[...all]/route.ts — Next.js handler สำหรับ Better Auth
2. src/lib/auth-client.ts — client-side auth hooks
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ทั้งสองพร้อมกัน ขอ permission

**✅ Checkpoint ตรวจสอบ:**
- `route.ts` export `{ POST, GET }` จาก `toNextJsHandler(auth)`
- `auth-client.ts` มี `'use client'` directive
- export `signIn`, `signUp`, `signOut`, `useSession` ออกมาใช้ได้

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```ts
// src/app/api/auth/[...all]/route.ts
import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

export const { POST, GET } = toNextJsHandler(auth)
```
```ts
// src/lib/auth-client.ts
'use client'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
})

export const { signIn, signUp, signOut, useSession } = authClient
```

> **หมายเหตุ:** method reset รหัสผ่านในเวอร์ชันนี้คือ `authClient.requestPasswordReset({ email, redirectTo })` และ `authClient.resetPassword({ newPassword, token })`

---

### 🛠️ ขั้นที่ 4: ป้องกันทุกหน้าด้วย Proxy (Next.js 16)

> **หมายเหตุ Next.js 16:** Next.js 16 เปลี่ยน convention จาก `middleware` เป็น **`proxy`** — ไฟล์เปลี่ยนเป็น `src/proxy.ts` และ function ชื่อ `export function proxy(...)` proxy รันบน **Node.js runtime** (ไม่ใช่ Edge runtime แบบเดิม) ข้อดีคือ `better-auth/cookies` (`getSessionCookie`) ใช้ได้โดยไม่มี warning เรื่อง Edge runtime

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้าง src/proxy.ts สำหรับ Next.js 16 ที่:
- redirect ไป /login ถ้ายังไม่ login (ตรวจด้วย getSessionCookie จาก better-auth/cookies)
- ยกเว้น public paths: /login, /register, /forgot-password, /reset-password
- ถ้า login แล้วพยายามเข้า public path ให้ redirect ไป /
- export function proxy (ไม่ใช่ middleware)
- ใช้ matcher ยกเว้น api, _next/static, _next/image, favicon.ico และไฟล์ที่มีนามสกุล
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้าง `src/proxy.ts` พร้อม config matcher

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์ชื่อ `src/proxy.ts` (ไม่ใช่ `src/middleware.ts`)
- function ชื่อ `export function proxy(request: NextRequest)` (ไม่ใช่ `middleware`)
- เปิดหน้าใดก็ได้โดยไม่ login → ถูก redirect ไป `/login`
- หลัง login แล้วพิมพ์ URL `/login` → ถูก redirect ไป `/`
- route `/api/auth/...` ไม่ถูก intercept (ยกเว้นผ่าน matcher)

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```ts
// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie && !isPublic) return NextResponse.redirect(new URL('/login', request.url))
  if (sessionCookie && isPublic) return NextResponse.redirect(new URL('/', request.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)']
}
```

---

### 🛠️ ขั้นที่ 5: สร้างหน้า Auth ด้วย shadcn/ui

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างหน้า auth ทั้งหมดใน route group src/app/(auth)/ ดังนี้:
1. login/page.tsx — ฟอร์ม email + password เรียก signIn.email() แล้ว redirect ไป /
2. register/page.tsx — ฟอร์ม name + email + password เรียก signUp.email() แล้ว redirect ไป /login
3. forgot-password/page.tsx — ฟอร์ม email เรียก authClient.requestPasswordReset({ email, redirectTo: '/reset-password' })
4. reset-password/page.tsx — รับ token จาก query param เรียก authClient.resetPassword({ newPassword, token })
ทุกหน้าใช้ component ของ shadcn/ui ได้แก่ Card, CardContent, CardHeader, Input, Label, Button
แสดง loading state และ error message ชัดเจน
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้างหน้าทั้ง 4 พร้อม UI shadcn, state management, error handling

**✅ Checkpoint ตรวจสอบ:**
- login สำเร็จ → redirect ไป `/` (dashboard)
- forgot-password ส่งแล้ว → ดู reset link ใน console (dev mode)
- เปิดหน้าใดในแอปโดยไม่ login → ถูก redirect ไป `/login` ทันที
- หน้าทั้งหมดใช้ Card + Input + Button ของ shadcn ไม่มี semicolon

ฟีเจอร์คลังสินค้าที่จะสร้างต่อจากนี้ (CRUD, Stock In/Out, Dashboard) จะใช้ component ของ shadcn/ui ที่ติดตั้งไว้ตั้งแต่วันที่ 1

---

## Module 2.1: บริหาร Context Window อย่างมือโปร

### Context Window คืออะไร?

เมื่อคุณคุยกับ Claude Code สิ่งที่ Claude "มองเห็น" ในการตอบแต่ละครั้งเรียกว่า **Context Window** — มันคือกล่องหน่วยความจำชั่วคราวที่มีขนาดจำกัด (วัดเป็น "tokens")

Context Window ประกอบด้วย:
- บทสนทนาทั้งหมดที่ผ่านมา (คุณถาม + Claude ตอบ)
- ไฟล์ที่คุณ reference ด้วย `@`
- ผลลัพธ์จากคำสั่งที่รัน (เช่น output ของ terminal)
- ข้อมูลจาก CLAUDE.md

```
┌─────────────────────────────────────────────────────────┐
│                   Context Window                        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ CLAUDE.md│  │ @files   │  │ บทสนทนา │  │ output │ │
│  │  (base)  │  │ ที่อ้าง  │  │ history  │  │ cmds   │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
│  ████████████████████████████████████░░░░░░░░░░░  85%  │
│                                         ↑ เหลือน้อย!  │
└─────────────────────────────────────────────────────────┘
```

### ปัญหาเมื่อ Context เต็ม

```
สถานการณ์: คุณคุยกับ Claude Code มา 2 ชั่วโมง
สั่งให้เพิ่มฟีเจอร์ใหม่...

ผลที่เกิดขึ้น:
├── Claude "ลืม" ว่า schema มีโครงสร้างอะไร
├── เขียนโค้ดซ้ำหรือขัดแย้งกับที่มีอยู่
├── response ช้าลงเรื่อยๆ
└── token ล้น → error หรือ Claude ถูก truncate ตอนต้น
```

> **Key Concept:** Context Window ไม่ใช่หน่วยความจำถาวร — เมื่อเต็มแล้ว Claude จะ "ลืม" สิ่งที่พูดคุยไปก่อนหน้า และอาจเขียนโค้ดผิดพลาดโดยไม่รู้ตัว

### เครื่องมือบริหาร Context

#### `/clear` — ล้าง Context ทั้งหมด

ใช้เมื่อ:
- เริ่มงาน feature ใหม่ที่ไม่เกี่ยวกับสิ่งที่คุยมา
- Context เต็มหรือใกล้เต็ม
- Claude ตอบผิดๆ เริ่มสับสน

**ข้อควรระวัง:** หลัง `/clear` Claude จะไม่จำบทสนทนาเดิมเลย ต้อง brief ใหม่ผ่าน CLAUDE.md หรือ `@` files

#### `/compact` — บีบอัด Context อัจฉริยะ

Claude จะสรุปบทสนทนาที่ผ่านมาให้กระชับขึ้น โดยยังคงเก็บ "สิ่งสำคัญ" ไว้ เช่น โครงสร้างโค้ดที่ตกลงกัน, decisions ต่างๆ

ใช้เมื่อ:
- บทสนทนายาว แต่ยังต้องการความต่อเนื่อง
- Context เริ่มหนัก แต่ยังไม่อยากเริ่มใหม่

#### การ Reference ไฟล์ด้วย `@`

แทนที่จะ copy-paste โค้ดมาใน prompt ให้ใช้ `@` ชี้ไปที่ไฟล์โดยตรง Claude จะอ่านเนื้อหาไฟล์นั้นเข้า Context อัตโนมัติ เช่น:

```
@prisma/schema.prisma
@app/products/page.tsx
@lib/prisma.ts
```

### หลักการ "Context Economy"

อย่าโยนทั้ง repo เข้า Context — ให้ Reference เฉพาะสิ่งที่เกี่ยวข้องกับงานนั้นๆ

| สิ่งที่ควรทำ | สิ่งที่ควรเลี่ยง |
|---|---|
| `@prisma/schema.prisma` ตอนถามเรื่อง DB | `@` ทุกไฟล์ใน project |
| `/compact` ก่อน context เต็ม | รอให้ context เต็มแล้วค่อยทำ |
| Brief ใน CLAUDE.md ครั้งเดียว | อธิบายซ้ำในทุก prompt |
| `/clear` เมื่อเปลี่ยน feature ใหม่ | ต่อ session เดียวตลอดวัน |
| ถามทีละงาน ชัดเจน | ถามหลายงานพร้อมกัน |

### ASCII Diagram: วงจรชีวิต Context ที่ดี

```
เริ่ม Session ใหม่
       │
       ▼
Claude อ่าน CLAUDE.md อัตโนมัติ
(รู้ว่านี่คือโปรเจกต์อะไร tech stack อะไร)
       │
       ▼
ถามงาน + @reference ไฟล์ที่เกี่ยวข้อง
       │
       ▼
ทำงานไปเรื่อยๆ... context ค่อยๆ ใหญ่ขึ้น
       │
   ┌───┴───┐
   │       │
context  context
< 70%    > 70%
   │       │
   │    /compact
   │       │
   └───┬───┘
       │
  เปลี่ยน feature?
   ┌───┴───┐
   │       │
  ไม่     ใช่
   │       │
   │     /clear
   │     brief ใหม่
   └───┬───┘
       │
  วนซ้ำ...
```

### 🛠️ ขั้นตอนที่ 1: อัปเดต CLAUDE.md ให้ครอบคลุม StockApp

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยอัปเดต @.claude/CLAUDE.md ให้มีข้อมูลครบถ้วนสำหรับโปรเจกต์ stock-app
โดยระบุ tech stack, กฎสำคัญ (ห้ามมี semicolon, ใช้ Server Actions, ใช้ Zod),
โครงสร้าง Prisma models (Product และ StockTransaction พร้อม enum TransactionType),
ตรรกะสถานะสต็อก (0=หมดสต็อก, <=reorderPoint=ใกล้หมด, อื่นๆ=ปกติ),
และโครงสร้าง folder หลักของโปรเจกต์
```

**🤖 Claude Code จะทำอะไร:** อ่านไฟล์ `.claude/CLAUDE.md` ที่มีอยู่แล้วเขียนทับด้วยเวอร์ชันที่ครบถ้วน

**✅ Checkpoint ตรวจสอบ:**
- มี tech stack ระบุ Next.js 16, TypeScript, Prisma, PostgreSQL, Tailwind, pnpm
- มีกฎ "ห้ามใส่ semicolon (;)" ชัดเจน
- มี model Product และ StockTransaction พร้อม field สำคัญ
- มีตรรกะสถานะสต็อกครบ 3 กรณี
- มีโครงสร้าง folder app/products/, app/transactions/, app/dashboard/

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```markdown
# StockApp — ระบบคลังสินค้าเบิกจ่าย

## Tech Stack
- Next.js 16 (App Router) + TypeScript + Prisma ORM + PostgreSQL + Tailwind CSS
- Package manager: pnpm

## กฎสำคัญ
- ห้ามใส่ semicolon (;) ท้ายบรรทัดในทุกไฟล์ TypeScript/JavaScript
- ใช้ Server Actions สำหรับ mutation (ไม่ใช้ API Routes ถ้าไม่จำเป็น)
- ใช้ Zod validate input ก่อนทุกครั้ง
- Stock Out ต้องเช็คยอดก่อนเสมอ — ห้ามเบิกเกินจำนวน

## Prisma Models หลัก
- Product: id, sku (unique), name, category, unit, quantity, reorderPoint, price
- StockTransaction: id, productId, type (IN/OUT), quantity, note, createdAt

## ตรรกะสถานะสต็อก
- quantity == 0 → "หมดสต็อก"
- quantity <= reorderPoint → "ใกล้หมด"
- อื่นๆ → "ปกติ"

## โครงสร้างหลัก
- app/products/ — จัดการสินค้า
- app/transactions/ — รับเข้า/เบิกออก
- app/dashboard/ — ภาพรวมและรายงาน
- lib/prisma.ts — Prisma Client
- prisma/schema.prisma — Database Schema
```

---

## Module 2.2: Custom Slash Commands

### Custom Slash Commands คืออะไร?

นอกจาก built-in commands อย่าง `/clear`, `/compact` แล้ว Claude Code ยังให้คุณ **สร้างคำสั่งของตัวเองได้** โดยสร้างไฟล์ `.md` ใน `.claude/commands/`

เมื่อสร้างแล้ว คุณเรียกใช้ใน terminal ได้ทันที:

```
/create-crud Product
/add-feature stock-alert
/review-code app/products/actions.ts
```

### โครงสร้างไฟล์ Command

```
stock-app/
└── .claude/
    ├── CLAUDE.md
    └── commands/
        ├── create-crud.md
        ├── add-feature.md
        └── review-code.md
```

รูปแบบไฟล์ `.md`:
- **frontmatter** (`---`) — ระบุ `description` เพื่อแสดงใน autocomplete
- **`$ARGUMENTS`** — ตัวแปรพิเศษที่รับค่าที่ผู้ใช้พิมพ์ตามหลัง command

> **Key Concept:** Custom Slash Commands คือ "สูตรสำเร็จ" ของทีม — เขียนครั้งเดียว ทุกคนในทีมใช้ได้เหมือนกัน ไม่ต้องพิมพ์ prompt ยาวๆ ซ้ำๆ

### ทำไม Custom Commands ถึงสำคัญ?

| ปัญหาเดิม | แก้ด้วย Custom Commands |
|---|---|
| พิมพ์ prompt ยาวซ้ำๆ ทุกครั้ง | พิมพ์ `/create-crud Product` ครั้งเดียว |
| แต่ละคนในทีมมี prompt ต่างกัน | ทุกคนใช้ command เดียวกัน ผลลัพธ์สม่ำเสมอ |
| ลืม convention ของโปรเจกต์ | ฝัง convention ไว้ใน command แล้ว |
| Onboard คนใหม่ยาก | คนใหม่ใช้ command ได้เลย ไม่ต้องจำอะไร |

### 🛠️ ขั้นตอนที่ 2: สร้างโฟลเดอร์ commands และ Command `/create-crud`

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างโฟลเดอร์ .claude/commands/ และสร้างไฟล์ .claude/commands/create-crud.md
เนื้อหาในไฟล์คือ Custom Slash Command สำหรับ /create-crud ที่:
- รับ $ARGUMENTS เป็นชื่อ Prisma model
- อ่าน @prisma/schema.prisma ก่อนสร้างโค้ด
- สร้างไฟล์ app/[model_lower]/page.tsx, new/page.tsx, [id]/edit/page.tsx, actions.ts
- Server Actions ต้องมี getAll, get, create, update, delete พร้อม Zod validation
- กฎ: ห้ามมี semicolon, ใช้ 'use server', ใช้ revalidatePath, return { success, error }
```

**🤖 Claude Code จะทำอะไร:** สร้างโฟลเดอร์และไฟล์ `.claude/commands/create-crud.md` พร้อม frontmatter และ prompt template สำหรับ CRUD

**✅ Checkpoint ตรวจสอบ:**
- โฟลเดอร์ `.claude/commands/` ถูกสร้างขึ้น
- ไฟล์ `create-crud.md` มี `---` frontmatter และ `description:`
- มี `$ARGUMENTS` ปรากฏในเนื้อหา
- มีกฎห้าม semicolon ระบุไว้อย่างชัดเจน

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```markdown
---
description: สร้าง CRUD ครบชุดสำหรับ Prisma model ที่ระบุ (list, create, edit, delete)
---

สร้าง CRUD ครบชุดสำหรับ model ชื่อ "$ARGUMENTS" โดยใช้ Next.js 16 App Router + TypeScript + Prisma + Tailwind CSS

## ข้อกำหนด

1. อ่าน @prisma/schema.prisma เพื่อดู fields ของ model "$ARGUMENTS" ก่อน
2. สร้างไฟล์ตามโครงสร้างนี้:
   - `app/$ARGUMENTS_lower/page.tsx` — หน้า list แสดงรายการทั้งหมด
   - `app/$ARGUMENTS_lower/new/page.tsx` — หน้าฟอร์มสร้างใหม่
   - `app/$ARGUMENTS_lower/[id]/edit/page.tsx` — หน้าฟอร์มแก้ไข
   - `app/$ARGUMENTS_lower/actions.ts` — Server Actions ทั้งหมด

3. Server Actions ต้องมี:
   - `getAll$ARGUMENTS()` — ดึงทั้งหมด
   - `get$ARGUMENTS(id)` — ดึงตัวเดียว
   - `create$ARGUMENTS(data)` — สร้างใหม่ + Zod validation
   - `update$ARGUMENTS(id, data)` — แก้ไข + Zod validation
   - `delete$ARGUMENTS(id)` — ลบ

4. กฎที่ต้องปฏิบัติตาม:
   - ห้ามใส่ semicolon (;) ท้ายบรรทัด
   - ใช้ 'use server' directive ใน actions.ts
   - ใช้ Zod validate input ทุกครั้ง
   - จัดการ error ด้วย try/catch และ return { success, error } object
   - ใช้ revalidatePath หลัง mutation
   - UI ใช้ Tailwind CSS สวยงาม อ่านง่าย รองรับภาษาไทย
```

### 🛠️ ขั้นตอนที่ 3: สร้าง Command `/add-feature` และ `/review-code`

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ .claude/commands/add-feature.md สำหรับ command /add-feature ที่:
- รับ $ARGUMENTS เป็นชื่อฟีเจอร์ที่ต้องการ
- วิเคราะห์ @prisma/schema.prisma และ @CLAUDE.md ก่อนว่ากระทบ model ไหน
- แสดง plan เป็น checklist รอการยืนยันก่อนลงมือ
- กฎ: ห้าม semicolon, ใช้ TypeScript strict, Server Actions, Tailwind CSS

และสร้าง .claude/commands/review-code.md สำหรับ command /review-code ที่:
- รับ $ARGUMENTS เป็น path ของไฟล์ที่ต้องการ review ด้วย @
- ตรวจ Correctness, Convention (no semicolon), Error Handling, Performance, Security
- แสดงผลเป็น ✅ ดีแล้ว / ⚠️ ควรปรับ / ❌ ต้องแก้ด่วน
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ทั้งสองพร้อมกัน

**✅ Checkpoint ตรวจสอบ:**
- `add-feature.md` มีขั้นตอนวิเคราะห์ → plan → ยืนยัน → ลงมือ
- `review-code.md` มี `@$ARGUMENTS` เพื่อรับ path ไฟล์
- ทั้งสองไฟล์มี frontmatter `description:`

### แนวคิด: Commands เป็นสินทรัพย์ของทีม

```
.claude/commands/ ควร commit เข้า Git
         │
         ▼
ทุกคนในทีม clone repo มา
         │
         ▼
ใช้ commands เดียวกันได้ทันที
         │
         ▼
ผลลัพธ์ที่ได้สม่ำเสมอ ตรงตาม convention
         │
         ▼
Onboard คนใหม่เร็วขึ้น — แค่บอกว่ามี /create-crud ใช้นะ
```

---

## Module 2.3: พัฒนา CRUD จัดการสินค้า

> **หมายเหตุ UI:** ทุกหน้าใน Module นี้ใช้ component ของ shadcn/ui (Card, Table, Button, Input, Select) ที่ติดตั้งไว้ตั้งแต่วันที่ 1 — ไม่ต้องติดตั้งเพิ่ม

### เริ่มต้นด้วย Server Actions

Next.js 16 App Router แนะนำให้ใช้ **Server Actions** สำหรับ mutation (create/update/delete) แทน API Routes เพราะ:
- เขียนโค้ดน้อยกว่า — ไม่ต้องสร้าง `/api/` route
- Type-safe ระหว่าง client และ server
- Integrate กับ form ได้ตรงๆ

### 🛠️ ขั้นตอนที่ 4: สร้าง Zod Schema สำหรับ Product

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ lib/validations/product.ts สำหรับ Zod schema ของ Product
โดยดู field จาก @prisma/schema.prisma
กฎ:
- sku: string, ขั้นต่ำ 1 ตัว, format SKU-XXXX เท่านั้น
- name: string, 1-100 ตัวอักษร
- category: string, ไม่ว่าง
- unit: string, ไม่ว่าง
- quantity: number, int, >=0
- reorderPoint: number, int, >=0
- price: number, int, >=0
- export type ProductInput = z.infer<typeof productSchema>
- ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** อ่าน schema.prisma แล้วสร้างไฟล์ `lib/validations/product.ts`

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์อยู่ที่ `lib/validations/product.ts`
- `.regex()` ตรวจ format `SKU-XXXX`
- มี `z.coerce.number()` สำหรับ field ตัวเลข (รับค่าจาก FormData เป็น string ได้)
- ไม่มี semicolon ท้ายบรรทัด

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```ts
// lib/validations/product.ts
import { z } from 'zod'

export const productSchema = z.object({
  sku: z
    .string()
    .min(1, 'กรุณากรอก SKU')
    .regex(/^SKU-\d+$/, 'รูปแบบ SKU ต้องเป็น SKU-XXXX'),
  name: z.string().min(1, 'กรุณากรอกชื่อสินค้า').max(100),
  category: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  unit: z.string().min(1, 'กรุณากรอกหน่วยนับ'),
  quantity: z.coerce.number().int().min(0, 'จำนวนต้องไม่ติดลบ'),
  reorderPoint: z.coerce.number().int().min(0, 'จุดสั่งซื้อต้องไม่ติดลบ'),
  price: z.coerce.number().int().min(0, 'ราคาต้องไม่ติดลบ'),
})

export type ProductInput = z.infer<typeof productSchema>
```

### 🛠️ ขั้นตอนที่ 5: สร้าง Server Actions สำหรับ Product

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ app/products/actions.ts ที่มี Server Actions ครบชุดสำหรับ Product
โดยอ้างอิง @lib/validations/product.ts และ @lib/prisma.ts

ต้องมี:
- getAllProducts() — findMany orderBy createdAt desc
- getProduct(id) — findUnique พร้อม error ถ้าไม่เจอ
- createProduct(formData) — safeParse → เช็ค SKU ซ้ำ → create → revalidatePath('/products')
- updateProduct(id, formData) — safeParse → update → revalidatePath
- deleteProduct(id) — delete → revalidatePath('/products')
- ทุกฟังก์ชัน return { success: boolean, data?, error?: string }
- ห้ามมี semicolon, ใช้ 'use server' ด้านบน
```

**🤖 Claude Code จะทำอะไร:** อ่านไฟล์ที่ reference แล้วสร้าง `app/products/actions.ts` ครบทุกฟังก์ชัน ขอ permission เขียนไฟล์

**✅ Checkpoint ตรวจสอบ:**
- บรรทัดแรกคือ `'use server'`
- `createProduct` มีเช็ค SKU ซ้ำก่อน create
- ทุก action มี try/catch
- `revalidatePath` ถูกเรียกหลัง mutation ทุกครั้ง
- ไม่มี semicolon ท้ายบรรทัดใดเลย (ตรวจด้วย grep)

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```ts
// app/products/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { productSchema } from '@/lib/validations/product'

export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: products }
  } catch (error) {
    return { success: false, error: 'ไม่สามารถดึงข้อมูลสินค้าได้' }
  }
}

export async function createProduct(formData: FormData) {
  const raw = {
    sku: formData.get('sku'),
    name: formData.get('name'),
    category: formData.get('category'),
    unit: formData.get('unit'),
    quantity: formData.get('quantity'),
    reorderPoint: formData.get('reorderPoint'),
    price: formData.get('price'),
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { sku: parsed.data.sku },
    })
    if (existing) {
      return { success: false, error: `SKU "${parsed.data.sku}" มีในระบบแล้ว` }
    }

    const product = await prisma.product.create({ data: parsed.data })
    revalidatePath('/products')
    return { success: true, data: product }
  } catch (error) {
    return { success: false, error: 'ไม่สามารถสร้างสินค้าได้' }
  }
}

export async function deleteProduct(id: number) {
  try {
    await prisma.product.delete({ where: { id } })
    revalidatePath('/products')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'ไม่สามารถลบสินค้าได้' }
  }
}
```

### 🛠️ ขั้นตอนที่ 6: สร้างหน้า List สินค้าและฟอร์ม

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ต่อไปนี้ใน app/products/ โดยอ้างอิง @app/products/actions.ts

1. page.tsx — Server Component แสดงตาราง products ทั้งหมด
   - มีปุ่ม "+ เพิ่มสินค้าใหม่" ลิงก์ไป /products/new
   - แต่ละแถวแสดง: SKU, ชื่อ, หมวดหมู่, คงเหลือ, ราคา, สถานะสต็อก (badge)
   - สถานะสต็อก: quantity==0=หมดสต็อก(แดง), <=reorderPoint=ใกล้หมด(เหลือง), อื่นๆ=ปกติ(เขียว)
   - มีปุ่ม "แก้ไข" (link) และ "ลบ" (ใช้ DeleteProductButton client component แยก)

2. new/page.tsx — Client Component ฟอร์มสร้างสินค้าใหม่
   - field: sku, name, category (select), unit (select), quantity, reorderPoint, price
   - เรียก createProduct แล้ว router.push('/products') เมื่อ success
   - แสดง error ถ้า fail

3. DeleteProductButton.tsx — Client Component ปุ่มลบพร้อม confirm dialog

ห้ามมี semicolon ทั้งหมด
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ทั้ง 3 พร้อมกัน ขอ permission เขียนไฟล์หลายไฟล์

**✅ Checkpoint ตรวจสอบ:**
- `page.tsx` เป็น async Server Component (ไม่มี `'use client'`)
- `new/page.tsx` มี `'use client'` และ `useState` สำหรับ loading/error
- `DeleteProductButton.tsx` มี `confirm()` ก่อนเรียก `deleteProduct`
- badge สีถูกต้องตาม logic 3 กรณี
- ไม่มี semicolon

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```tsx
// app/products/page.tsx (ตัวอย่างส่วน getStockStatus)
function getStockStatus(quantity: number, reorderPoint: number) {
  if (quantity === 0) return { label: 'หมดสต็อก', color: 'bg-red-100 text-red-700' }
  if (quantity <= reorderPoint) return { label: 'ใกล้หมด', color: 'bg-yellow-100 text-yellow-700' }
  return { label: 'ปกติ', color: 'bg-green-100 text-green-700' }
}
```

---

## Module 2.4: ฟังก์ชันรับเข้า (Stock In) และเบิกจ่าย (Stock Out)

> **หมายเหตุ UI:** หน้าฟอร์ม Stock In/Out ใช้ shadcn/ui (Card, Select, Input, Button) เช่นกัน

### ทำความเข้าใจ Business Logic

```
Stock IN (รับเข้า):
  product.quantity += transaction.quantity
  ทำได้เสมอ — ไม่มีข้อจำกัด

Stock OUT (เบิกออก):
  ต้องตรวจสอบก่อน!
  ├── ถ้า product.quantity >= transaction.quantity
  │     → product.quantity -= transaction.quantity ✅
  └── ถ้า product.quantity < transaction.quantity
        → throw Error "สต็อกไม่เพียงพอ" ❌

ทั้งสองอย่างต้องทำใน prisma.$transaction เดียว
(atomic — ถ้าอย่างใดอย่างหนึ่งล้มเหลว ทุกอย่างย้อนกลับ)
```

> **Key Concept:** `prisma.$transaction` คือ Database Transaction — ทำให้แน่ใจว่าการ "บันทึก StockTransaction" และ "อัปเดต quantity" จะสำเร็จหรือล้มเหลวพร้อมกัน ไม่มีทางที่ข้อมูลจะค้างกลางคัน

### อธิบาย `prisma.$transaction` แบบละเอียด

```
prisma.$transaction(async (tx) => {
  // tx คือ Prisma Client พิเศษที่ทำงานภายใน transaction
  // ทุก query ที่ใช้ tx จะอยู่ใน transaction เดียวกัน

  const step1 = await tx.product.findUnique(...)      // query 1
  // ถ้า step1 ล้มเหลว → rollback ทันที

  const step2 = await tx.stockTransaction.create(...) // query 2
  // ถ้า step2 ล้มเหลว → rollback step1 ด้วย

  const step3 = await tx.product.update(...)          // query 3
  // ถ้า step3 ล้มเหลว → rollback step1 และ step2

  return { step1, step2, step3 }
  // ถ้าถึงบรรทัดนี้ได้ → COMMIT (บันทึกทั้งหมด)
})
```

### 🛠️ ขั้นตอนที่ 7: สร้าง Zod Schema และ Server Actions สำหรับ Transaction

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างสองไฟล์พร้อมกัน:

1. lib/validations/transaction.ts — Zod schema สำหรับ StockTransaction
   - productId: number, int, positive
   - quantity: number, int, positive (>0)
   - note: string, max 200, optional
   - export type TransactionInput

2. app/transactions/actions.ts — Server Actions สำหรับ Stock In และ Stock Out
   - 'use server' ด้านบน
   - อ้างอิง @lib/prisma.ts และ @lib/validations/transaction.ts
   - getAllTransactions(limit = 50) — include product (sku, name, unit)
   - stockIn(formData) — ใช้ prisma.$transaction: สร้าง StockTransaction type='IN' + increment quantity
   - stockOut(formData) — ใช้ prisma.$transaction:
       ดึงสินค้า → ตรวจสอบ quantity เพียงพอ → throw Error ถ้าไม่พอ → สร้าง record type='OUT' → decrement quantity
   - หลัง success ให้ revalidatePath('/transactions'), revalidatePath('/products'), revalidatePath('/dashboard')
   - stockOut: จับ error message ด้วย error instanceof Error ? error.message : '...'
   - ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ทั้งสอง, ใช้ `prisma.$transaction` แบบ interactive transaction, ขอ permission สร้างไฟล์

**✅ Checkpoint ตรวจสอบ:**
- `stockIn` ใช้ `{ increment: quantity }` สำหรับ product update
- `stockOut` มีการ `findUnique` ภายใน `$transaction` ก่อนเช็ค
- Error message เมื่อสต็อกไม่พอ บอกจำนวนที่มีและที่ขอชัดเจน
- `stockOut` catch จับ error ด้วย `error instanceof Error` เพื่อส่ง message ที่ throw มา
- `revalidatePath` 3 เส้นทางใน stockIn และ stockOut

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง) — ส่วน stockOut:**
```ts
// app/transactions/actions.ts (ส่วน stockOut — ตรรกะสำคัญ)
export async function stockOut(formData: FormData) {
  // ... parse และ validate ...
  const { productId, quantity, note } = parsed.data

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } })

      if (!product) {
        throw new Error('ไม่พบสินค้านี้ในระบบ')
      }

      if (product.quantity < quantity) {
        throw new Error(
          `สต็อกไม่เพียงพอ — คงเหลือ ${product.quantity} ${product.unit} แต่ขอเบิก ${quantity} ${product.unit}`
        )
      }

      const transaction = await tx.stockTransaction.create({
        data: { productId, type: 'OUT', quantity, note },
      })

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { quantity: { decrement: quantity } },
      })

      return { transaction, updatedProduct }
    })

    revalidatePath('/transactions')
    revalidatePath('/products')
    revalidatePath('/dashboard')
    return { success: true, data: result, message: `เบิกสินค้าออก ${quantity} หน่วย เรียบร้อยแล้ว` }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถบันทึกการเบิกออกได้'
    return { success: false, error: message }
  }
}
```

### 🛠️ ขั้นตอนที่ 8: สร้างหน้าฟอร์ม Stock In / Stock Out

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ app/transactions/new/page.tsx เป็น Client Component สำหรับ
ฟอร์ม Stock In และ Stock Out ในหน้าเดียว

โดยอ้างอิง @app/transactions/actions.ts และ @app/products/actions.ts

ความต้องการ:
- มีปุ่ม toggle เลือกประเภท: "รับเข้า (Stock In)" (เขียว) หรือ "เบิกออก (Stock Out)" (ส้ม)
- อ่าน query param ?type=in หรือ ?type=out เพื่อ default ค่าเริ่มต้น
- โหลด product list ด้วย useEffect + getAllProducts()
- เมื่อเลือก product แสดง "คงเหลือ: X หน่วย" ด้านล่าง dropdown
- field: productId (select), quantity (number), note (textarea)
- เรียก stockIn หรือ stockOut ตาม type ที่เลือก
- แสดง success message และ reset form เมื่อสำเร็จ
- แสดง error message (สีแดง) เมื่อล้มเหลว
- ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ page.tsx ที่มี state management ค่อนข้างซับซ้อน

**✅ Checkpoint ตรวจสอบ:**
- มี `useSearchParams()` เพื่ออ่าน `?type=`
- มี `useEffect` โหลด products ตอน mount
- เมื่อ submit สำเร็จ มี `form.reset()` และ clear selectedProduct
- error จาก stockOut (เช่น "สต็อกไม่เพียงพอ") แสดงออกมาได้ถูกต้อง
- ไม่มี semicolon

### ทดสอบการกันเบิกเกิน

```
สถานการณ์ทดสอบ:
Product: กระดาษ A4 (SKU-1002), quantity = 5 รีม

ทดสอบ 1: เบิก 3 รีม
→ 5 >= 3 ✅ → บันทึกสำเร็จ → quantity เหลือ 2

ทดสอบ 2: เบิก 10 รีม (จาก quantity ที่เหลือ 2)
→ 2 < 10 ❌ → Error: "สต็อกไม่เพียงพอ — คงเหลือ 2 รีม แต่ขอเบิก 10 รีม"
→ ไม่มี StockTransaction record ถูกสร้าง
→ quantity ยังคงเป็น 2 (ไม่มีการเปลี่ยนแปลง)
```

---

## Module 2.5: หน้า Dashboard และรายงานสต็อก

### สิ่งที่ Dashboard ต้องแสดง

```
┌─────────────────────────────────────────────────────┐
│  ภาพรวมคลังสินค้า                                   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │สินค้าทั้ง│  │ สต็อกปกติ│  │  ใกล้หมด/หมดแล้ว│  │
│  │   หมด   │  │          │  │                  │  │
│  │    7    │  │    4     │  │        3         │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                     │
│  ⚠️ สินค้าที่ต้องดูแล (quantity <= reorderPoint)   │
│  ┌─────────────────────────────────────────────┐   │
│  │ SKU-1002 กระดาษ A4   เหลือ 5/10 รีม ใกล้หมด│   │
│  │ SKU-1005 น้ำดื่ม     เหลือ 0/20 ลัง หมดสต็อก│  │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ประวัติการเคลื่อนไหวล่าสุด                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ ↑ IN  กระดาษ A4  +50 รีม  10 นาทีที่แล้ว  │   │
│  │ ↓ OUT โน้ตบุ๊ค   -2 เครื่อง 1 ชม.ที่แล้ว  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 🛠️ ขั้นตอนที่ 9: สร้างหน้า Dashboard

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ app/dashboard/page.tsx เป็น async Server Component สำหรับ Dashboard

ดึงข้อมูลด้วย Promise.all:
1. prisma.product.findMany({ orderBy: { quantity: 'asc' } })
2. prisma.stockTransaction.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { product: { select: { sku, name, unit } } } })

คำนวณ:
- totalProducts: จำนวนสินค้าทั้งหมด
- normalCount: quantity > reorderPoint
- lowStockProducts: quantity <= reorderPoint (ใช้แสดงรายการแจ้งเตือน)
- alertCount: จำนวน lowStockProducts

แสดง:
- การ์ดสถิติ 3 ใบ: สินค้าทั้งหมด, ปกติ, ใกล้หมด/หมด (ถ้า alertCount > 0 ให้ card มีพื้นหลังแดงอ่อน)
- ส่วนแจ้งเตือน (แสดงเฉพาะเมื่อ alertCount > 0): แสดง product ที่ใกล้หมดพร้อมปุ่ม "รับเข้า" ลิงก์ /transactions/new?type=in
- ประวัติล่าสุด 10 รายการ: ↑ IN (เขียว) / ↓ OUT (ส้ม), ชื่อสินค้า, +/-quantity, timeAgo
- Quick Actions: ปุ่ม รับเข้า, เบิกออก, เพิ่มสินค้าใหม่

สร้าง helper function timeAgo(date: Date): string คำนวณ วินาที/นาที/ชั่วโมง/วัน ที่แล้ว
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** อ่าน schema.prisma เพื่อเข้าใจ model แล้วสร้างหน้า Dashboard ทั้งหมด ใช้ `prisma` โดยตรงใน Server Component

**✅ Checkpoint ตรวจสอบ:**
- ใช้ `Promise.all` ดึงข้อมูลพร้อมกัน (ไม่ใช่ await ทีละอัน)
- `lowStockProducts` คือ filter ด้วย `quantity <= reorderPoint` (ไม่ใช่ `<`)
- `timeAgo` มีครบทุก unit: วินาที, นาที, ชั่วโมง, วัน
- card "ใกล้หมด/หมดแล้ว" เปลี่ยนสีเมื่อ alertCount > 0
- ไม่มี semicolon

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง) — ส่วน query และ timeAgo:**
```ts
// app/dashboard/page.tsx (ส่วนสำคัญ)
async function getDashboardData() {
  const [products, recentTransactions] = await Promise.all([
    prisma.product.findMany({ orderBy: { quantity: 'asc' } }),
    prisma.stockTransaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { sku: true, name: true, unit: true } } },
    }),
  ])

  const totalProducts = products.length
  const normalCount = products.filter((p) => p.quantity > p.reorderPoint).length
  const lowStockProducts = products.filter((p) => p.quantity <= p.reorderPoint)

  return { totalProducts, normalCount, lowStockProducts, recentTransactions }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds} วินาทีที่แล้ว`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  return `${days} วันที่แล้ว`
}
```

### 🛠️ ขั้นตอนที่ 10: เพิ่ม Navigation Layout

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
แก้ไข @app/layout.tsx เพื่อเพิ่ม Sidebar Navigation แบบ fixed ด้านซ้าย

Sidebar ต้องมี:
- Header: "📦 StockApp" + subtitle "ระบบคลังสินค้า"
- Link: Dashboard (/dashboard)
- Link: จัดการสินค้า (/products)
- Link: ประวัติเคลื่อนไหว (/transactions)
- Divider แล้วตามด้วย:
- Link: ↑ รับเข้า (/transactions/new?type=in) สีเขียว bg-green-50
- Link: ↓ เบิกออก (/transactions/new?type=out) สีส้ม bg-orange-50

Layout structure: flex, sidebar w-56 min-h-screen, main flex-1
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** แก้ไข `app/layout.tsx` เพิ่ม sidebar navigation รอบ `{children}`

**✅ Checkpoint ตรวจสอบ:**
- Layout เป็น `flex` ที่ระดับ body wrapper
- Sidebar กว้าง `w-56` และ `min-h-screen`
- Main content เป็น `flex-1 overflow-auto`
- Link ไป `/transactions/new?type=in` และ `?type=out` ถูกต้อง
- ไม่มี semicolon

---

## Module 2.6: Debug และ Refactor กับ Claude Code อย่างเป็นระบบ

### แนวทาง Debug ที่ดีกับ Claude Code

เมื่อเจอ error ให้ให้ข้อมูลครบถ้วนใน prompt เดียว — อย่าถามแบบ "ทำไม error?"

**รูปแบบ Prompt Debug ที่ดี — ต้องมีครบ 3 ส่วน:**

```
มี error ต่อไปนี้เกิดขึ้นที่ @app/transactions/actions.ts ตอนทดสอบ Stock Out:

Error message:
TypeError: Cannot read properties of null (reading 'quantity')
  at stockOut (app/transactions/actions.ts:45:30)

สถานการณ์ที่เกิด: เลือก productId = 99 ที่ไม่มีในฐานข้อมูล แล้วกด Submit

ช่วยหาสาเหตุและแก้ไขให้ด้วย
```

### 🛠️ ขั้นตอนที่ 11: ฝึก Debug ด้วย Prompt ที่ถูกวิธี

**💬 Prompt ที่ใช้สั่ง Claude Code (กรณีทดสอบ: error message ไม่แสดงเมื่อสต็อกไม่พอ):**
```
ทดสอบเบิก 100 ชิ้น จากสินค้าที่มีแค่ 5 ชิ้น
แต่ไม่มี error message แสดงออกมาที่หน้าจอ กลับ submit สำเร็จ

ดู @app/transactions/actions.ts และ @app/transactions/new/page.tsx

ช่วยหาว่า error ไปไหน และแก้ไขให้ error message แสดงออกมาได้ถูกต้อง
```

**🤖 Claude Code จะทำอะไร:** อ่านทั้งสองไฟล์ หา mismatch ระหว่าง error ที่ return กับ state ที่ set ในหน้าจอ เสนอ fix

**✅ Checkpoint ตรวจสอบ:**
- Claude ระบุได้ว่า `handleSubmit` ใน page.tsx ไม่ได้ set error state จาก `result.error`
- แก้ไขแล้ว error message "สต็อกไม่เพียงพอ..." แสดงออกมาในหน้าจอ
- error หายเมื่อ user เลือก product ใหม่ (ถ้า Claude เพิ่ม `setError(null)` ใน onChange ได้ถือว่าดีมาก)

### 🛠️ ขั้นตอนที่ 12: Refactor ให้ DRY ขึ้น

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
@app/transactions/new/page.tsx มีโค้ดที่ซ้ำกันในส่วนของ
ปุ่ม Stock In และ Stock Out (สีต่างกัน แต่ logic เหมือนกัน)
ช่วย refactor ให้ DRY ขึ้น โดยยังคงพฤติกรรมเดิมทุกอย่าง
และห้ามมี semicolon ท้ายบรรทัด
```

**🤖 Claude Code จะทำอะไร:** วิเคราะห์ส่วนที่ซ้ำกัน เสนอ extract เป็น config object หรือ component แยก

**✅ Checkpoint ตรวจสอบ:**
- พฤติกรรมเดิมครบ (toggle type, สีปุ่ม, การ submit)
- โค้ดสั้นลง ไม่มีบล็อกซ้ำกัน
- ไม่มี semicolon

### เทคนิค: ให้ Claude Code อธิบายโค้ดก่อนแก้

```
ก่อนแก้ไข @app/transactions/actions.ts
ช่วยอธิบายว่า prisma.$transaction ในฟังก์ชัน stockOut
ทำงานอย่างไรทีละขั้น เพื่อให้แน่ใจว่าเข้าใจตรงกัน
```

วิธีนี้ช่วยให้:
1. ตรวจสอบว่า Claude เข้าใจโค้ดถูกต้องก่อนแก้
2. ค้นพบ misunderstanding ก่อนที่จะ implement ผิด
3. ได้เรียนรู้ไปด้วยในเวลาเดียวกัน

---

## 🎯 Workshop ท้ายวัน

### โจทย์: ต่อยอด StockApp ให้ครบฟีเจอร์

ทำตามลำดับ — ใช้ Claude Code ช่วยพัฒนาทุกขั้นตอน ห้ามพิมพ์โค้ดเอง

### Workshop 2.1: ทดสอบ Custom Commands

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
/create-crud Product
```

**✅ Checkpoint:**
- Claude อ่าน schema.prisma และสร้างไฟล์ตามโครงสร้างที่กำหนดใน create-crud.md
- ผลลัพธ์สอดคล้องกับ actions.ts ที่สร้างไว้ก่อนหน้า
- ถ้าซ้ำกัน ให้ compare ว่า Claude generate ต่างจาก reference อย่างไร

### Workshop 2.2: ทดสอบ Stock In/Out ครบ 3 Scenario

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วย verify ว่าระบบ Stock In/Out ทำงานถูกต้องโดยการ:
1. รันคำสั่ง pnpm dev แล้วเปิด http://localhost:3000/transactions/new?type=in
2. ทดสอบ Scenario A: เลือก SKU-1001, จำนวน 50, หมายเหตุ "รับจาก Supplier"
   → ตรวจสอบว่า quantity ใน database เพิ่มขึ้น
3. ทดสอบ Scenario B: เบิก SKU-1001, จำนวน 10
   → ตรวจสอบว่า quantity ลดลง
4. ทดสอบ Scenario C: เบิกเกินจำนวน
   → ต้องเห็น error message ที่ชัดเจน quantity ไม่เปลี่ยน
บอกผลการทดสอบแต่ละ scenario
```

**✅ Checkpoint:**
- Scenario A: success message แสดง, ดู Dashboard → quantity เพิ่ม
- Scenario B: success message แสดง, quantity ลด
- Scenario C: error message "สต็อกไม่เพียงพอ..." แสดงออกมาชัดเจน, quantity ไม่เปลี่ยน

### Workshop 2.3: ฝึก Debug จริง

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยทดลอง introduce bug แล้วหาคำตอบ:
1. ลบ if block ที่เช็ค quantity ออกจาก stockOut ใน @app/transactions/actions.ts
   แล้วบอกว่าจะเกิดอะไรขึ้น — Stock Out จะยอม "เบิกติดลบ" ได้ไหม?
2. แก้กลับให้ถูกต้องแล้วอธิบายว่าทำไม check นั้นถึงสำคัญ
3. ลอง remove revalidatePath('/dashboard') ออก แล้วบอกว่า Dashboard จะมีพฤติกรรมอย่างไร
```

**✅ Checkpoint:**
- Claude อธิบายผลกระทบของการลบ guard check ได้ถูกต้อง
- Claude อธิบาย revalidatePath ได้ว่าทำให้ Next.js เคลียร์ cache และ re-fetch ข้อมูลใหม่

### Workshop 2.4 (ถ้าเวลาเหลือ): หน้าประวัติ Transaction

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างหน้า app/transactions/page.tsx สำหรับแสดงประวัติการเคลื่อนไหวสต็อกทั้งหมด

โดยอ้างอิง @app/transactions/actions.ts (ใช้ getAllTransactions)
ความต้องการ:
- แสดงตาราง: วันที่-เวลา, ประเภท (IN/OUT badge), สินค้า (sku + name), จำนวน, หมายเหตุ
- แถว IN = พื้นหลังเขียวอ่อน, OUT = พื้นหลังส้มอ่อน
- badge IN = เขียว, OUT = ส้ม
- ปุ่ม "รับเข้า" และ "เบิกออก" ด้านบน link ไป /transactions/new?type=in และ ?type=out
- ห้ามมี semicolon
```

**✅ Checkpoint:**
- เป็น async Server Component
- badge สี IN/OUT ถูกต้อง
- ไม่มี semicolon

---

## สรุปวันที่ 2

วันนี้เราได้เรียนรู้และลงมือสร้างผ่าน Claude Code ทั้งหมด:

- ✅ วางระบบ Auth (Better Auth): login/register/forgot-password + guard ทุกหน้าด้วย proxy (Next.js 16)
- ✅ เข้าใจ Context Window — ทำงานอย่างไร ทำไมถึงสำคัญ
- ✅ ใช้ `/clear`, `/compact`, และ `@file` บริหาร Context อย่างชาญฉลาด
- ✅ เขียน CLAUDE.md ที่ดี — ให้ Claude "รู้จักโปรเจกต์" ตั้งแต่ต้น
- ✅ สร้าง Custom Slash Commands ใน `.claude/commands/` พร้อม `$ARGUMENTS`
- ✅ สร้าง Commands จริง: `/create-crud`, `/add-feature`, `/review-code`
- ✅ พัฒนา CRUD สินค้า — Server Actions + Zod validation + Prisma
- ✅ เขียน Stock In Action — รับสินค้าเข้าด้วย `prisma.$transaction`
- ✅ เขียน Stock Out Action — **กันเบิกเกินจำนวน** ด้วยการเช็คก่อนตัดสต็อก
- ✅ สร้าง Dashboard — การ์ดสถิติ, แจ้งเตือนสินค้าใกล้หมด, ประวัติเคลื่อนไหว
- ✅ ฝึก Debug และ Refactor กับ Claude Code อย่างเป็นระบบ

**วันพรุ่งนี้ (วันที่ 3):** เราจะขยายพลังของ Claude Code ด้วย **Sub-agents, MCP (Model Context Protocol), และ Hooks** — สอนให้ Claude ทำงานอัตโนมัติแบบ multi-step, เชื่อมต่อกับ external tools, และตั้ง automation ที่ทำงานเบื้องหลังโดยไม่ต้องสั่งทุกครั้ง

---

## แหล่งอ้างอิงเพิ่มเติม

- [Claude Code Docs — Context Management](https://docs.anthropic.com/en/docs/claude-code/context-management) — วิธีบริหาร Context อย่างเป็นทางการ
- [Claude Code Docs — Custom Slash Commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands) — เอกสาร Custom Commands
- [Next.js Docs — Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) — Server Actions อย่างเป็นทางการ
- [Prisma Docs — Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) — `prisma.$transaction` ทุกรูปแบบ
- [Zod Docs](https://zod.dev) — Schema validation library
- [Tailwind CSS Docs](https://tailwindcss.com/docs) — Utility-first CSS framework
