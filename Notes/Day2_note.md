# หลักสูตร Claude Code มือโปร: ดำน้ำลึกสู่ Production — วันที่ 2

## พัฒนาฟีเจอร์คลังสินค้าให้ใช้งานได้จริง พร้อมเทคนิคบริหาร Context Window

**วันที่อบรม:** วันอาทิตย์ที่ 5 กรกฎาคม 2569 | เวลา 20:30–23:30 น.
**รูปแบบ:** อบรมออนไลน์ (สอนสด) ผ่าน Zoom Meeting
**วิทยากร:** อาจารย์สามิตร โกยม | IT Genius Engineering Co., Ltd.

---

## บทนำ

วันที่ 1 เราวางรากฐาน StockApp เรียบร้อยแล้ว — สร้างโปรเจกต์ Next.js 16 (App Router) + TypeScript ด้วย pnpm, กำหนด Prisma Schema (Product, StockTransaction), เชื่อม PostgreSQL, และตั้งค่า Tailwind CSS จนพร้อมใช้งาน

**วันนี้เราจะก้าวไปอีกขั้น:** สร้างฟีเจอร์หลักของ StockApp ให้ใช้งานได้จริงครบวงจร ทั้ง CRUD สินค้า (พร้อม soft-delete), ระบบรับเข้า-เบิกจ่ายสต็อกที่**กันเบิกเกินและกัน race condition**, และหน้า Dashboard พร้อมแจ้งเตือนสินค้าใกล้หมด - **UI ทุกส่วนใช้ component ของ shadcn/ui (สไตล์ base-nova บน Base UI) ตามธีม Genius Stock** ที่ตั้งค่าไว้ตั้งแต่วันที่ 1

พร้อมกันนั้นเราจะเรียนรู้เทคนิคสำคัญที่ทำให้การทำงานกับ Claude Code รวดเร็วและแม่นยำขึ้นอย่างมาก คือ **การบริหาร Context Window**

> **หมายเหตุการปรับแผน (สำคัญ):**
>
> - **Module 2.0 (Better Auth)** - spec เดิมกำหนด auth เป็น Out of Scope ของ MVP เราจึง**ปรับแผนเพิ่ม auth เข้า Phase 2 เป็นงานค้าง** (อัปเดตใน docs/spec.md แล้ว) เนื้อหา module นี้คงไว้เป็นแนวทาง แต่ใน workshop จริงยังไม่ได้ลงมือทำ - สร้าง core features ก่อน
> - **Custom Slash Commands** - ย้ายไปทำในวันที่ 3 (ดู Day3_note.md) ให้ตรงกับ Phase 3 ใน spec

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

- รายการงานที่ Claude สรุปตรงกับ Phase 2 ใน spec จริงไหม (CRUD สินค้า + หน้า Products แบบตาราง/dialog, Stock In/Out กันเบิกเกิน, Dashboard + แจ้งเตือน, revalidate + toast และงานปรับแผนที่ค้าง: ระบบ Auth ด้วย Better Auth)
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
├── app/
│   ├── layout.tsx          ← โหลดฟอนต์ Inter/Anuphan/JetBrains Mono + Toaster
│   ├── globals.css         ← design tokens ธีม Genius Stock (Tailwind v4 @theme inline)
│   └── page.tsx
├── lib/
│   └── prisma.ts           ← Prisma Client singleton (สร้างด้วย PrismaPg adapter)
├── src/generated/prisma/   ← โค้ด client ที่ generate (gitignored - รัน prisma generate)
├── .env                    ← DATABASE_URL เชื่อม PostgreSQL แล้ว
├── CLAUDE.md               ← สมองของโปรเจกต์ (อยู่ root ของ repo)
└── package.json
```

> **สังเกต:** โปรเจกต์นี้**ไม่ใช้โฟลเดอร์ `src/`** สำหรับโค้ดแอป - `app/` และ `lib/` อยู่ที่ root เลย มีเพียง generated Prisma client เท่านั้นที่อยู่ใน `src/generated/prisma/`

> **Key Concept (Prisma 7):** ตั้งแต่วันที่ 1 เราตั้งค่า `lib/prisma.ts` ให้สร้าง client ด้วย driver adapter — `new PrismaClient({ adapter })` โดย `adapter = new PrismaPg({ connectionString })` — และ import `PrismaClient` จาก `@/src/generated/prisma/client` (ไม่ใช่ `@prisma/client`) ข่าวดีคือ **โค้ดฝั่งฟีเจอร์วันนี้ไม่เปลี่ยนเลย** ทุกที่ยังเรียกผ่าน `import { prisma } from '@/lib/prisma'` และใช้ `prisma.product.findMany()`, `prisma.$transaction()` เหมือนเดิมทุกประการ — adapter ถูกซ่อนไว้ใน singleton ที่เดียว

---

## Module 2.0: ระบบ Authentication ด้วย Better Auth (แผนปรับ - งานค้าง Phase 2)

> **⏳ สถานะ: ยังไม่ได้ทำใน workshop** - spec เดิมกำหนด auth เป็น Out of Scope ของ MVP ภายหลังเราปรับแผนเพิ่ม auth เข้าเป็น**งานค้างของ Phase 2** (อัปเดตใน docs/spec.md แล้ว) เนื้อหา module นี้เก็บไว้เป็นแนวทางสำหรับตอนลงมือทำจริง

### แนวคิด: Auth ในโปรเจกต์นี้

ตามหลักการทั่วไป ฟีเจอร์คลังสินค้า (CRUD, Stock In/Out, Dashboard) ควรเข้าถึงได้เฉพาะผู้ใช้ที่ login แล้ว แต่ MVP ของเราเลือกส่งมอบ core features ก่อนเพื่อความเร็ว แล้วค่อยเติม auth ภายหลัง โดย guard ทุกหน้าด้วย proxy จุดเดียว - ไม่ต้องไล่เพิ่ม auth check ทีละหน้า

### 🛠️ ขั้นที่ 0: ปรับแผนใน spec ก่อนเสมอ (ทำแล้ว)

ทุกครั้งที่แผนเปลี่ยน ให้แก้ `docs/spec.md` ก่อนแตะโค้ด:

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
อ่าน @docs/spec.md แล้วปรับแผนดังนี้:
1. เพิ่มงาน "ระบบ Auth (Better Auth): login/register/forgot-password/reset-password
   + guard ทุกหน้าด้วย proxy (Next.js 16)" เป็นงานค้าง (unchecked) ใน Phase 2
2. ปรับหัวข้อ Scope และ Out of Scope ให้สอดคล้อง (roles/permissions ยังอยู่นอกขอบเขต)
อย่าเพิ่งแก้โค้ดใด ๆ
```

### Better Auth คืออะไร?

**Better Auth** คือ authentication library สำหรับ TypeScript ที่รองรับ email/password, session management และเชื่อม Prisma ได้ผ่าน adapter — ไม่ต้องเขียน auth logic เองตั้งแต่ต้น อ้างอิง docs: https://www.better-auth.com/docs/installation

```
สิ่งที่ Module 2.0 จะสร้าง (path ตามโครงสร้างจริง - ไม่มีโฟลเดอร์ src/):
├── lib/auth.ts              ← config Better Auth (email/password + Prisma adapter)
├── lib/auth-client.ts       ← client-side hooks (signIn, signUp, useSession)
├── app/api/auth/[...all]/   ← API route handler
├── proxy.ts                 ← guard ทุกหน้า (root) - redirect → /login ถ้าไม่ได้ login
└── app/(auth)/              ← หน้า login, register, forgot-password, reset-password
                                (UI ใช้ shadcn/ui: Card, Input, Label, Button -
                                 มี mockup ใน project-ui/ ให้เทียบดีไซน์)
```

> **Key Concept:** เราจะ guard ทุกหน้าด้วย proxy ระดับ Next.js 16 — ไม่ต้องเพิ่ม auth check ใน component ทีละหน้า ทำครั้งเดียวป้องกันได้ทั้งแอป

---

### 🛠️ ขั้นที่ 1: ติดตั้งและตั้งค่า Better Auth

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ติดตั้ง better-auth และตั้งค่าดังนี้:
1. เพิ่ม env ใน .env: BETTER_AUTH_SECRET (random string ≥ 32 ตัว), BETTER_AUTH_URL=http://localhost:3000, NEXT_PUBLIC_APP_URL=http://localhost:3000
2. สร้าง lib/auth.ts แบบ email/password + Prisma adapter (import prisma จาก @/lib/prisma)
   - sendResetPassword: dev mode — log reset link ใน console แทนการส่งอีเมลจริง
3. ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** รัน `pnpm add better-auth`, เพิ่ม env, สร้างไฟล์ `lib/auth.ts`

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์ `lib/auth.ts` มี `prismaAdapter(prisma, { provider: 'postgresql' })`
- `.env` มี `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`
- Prisma 7 ต้องใช้ `prisma` ที่ import จาก `@/lib/prisma` (มี driver adapter) — **ไม่ใช่** `new PrismaClient()` เปล่า

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```ts
// lib/auth.ts
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
1. app/api/auth/[...all]/route.ts — Next.js handler สำหรับ Better Auth
2. lib/auth-client.ts — client-side auth hooks
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ทั้งสองพร้อมกัน ขอ permission

**✅ Checkpoint ตรวจสอบ:**
- `route.ts` export `{ POST, GET }` จาก `toNextJsHandler(auth)`
- `auth-client.ts` มี `'use client'` directive
- export `signIn`, `signUp`, `signOut`, `useSession` ออกมาใช้ได้

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```ts
// app/api/auth/[...all]/route.ts
import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

export const { POST, GET } = toNextJsHandler(auth)
```
```ts
// lib/auth-client.ts
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

> **หมายเหตุ Next.js 16:** Next.js 16 เปลี่ยน convention จาก `middleware` เป็น **`proxy`** — ไฟล์คือ `proxy.ts` ที่ root ของโปรเจกต์ (เพราะเราไม่ใช้โฟลเดอร์ `src/`) และ function ชื่อ `export function proxy(...)` proxy รันบน **Node.js runtime** (ไม่ใช่ Edge runtime แบบเดิม) ข้อดีคือ `better-auth/cookies` (`getSessionCookie`) ใช้ได้โดยไม่มี warning เรื่อง Edge runtime

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้าง proxy.ts (ที่ root โปรเจกต์) สำหรับ Next.js 16 ที่:
- redirect ไป /login ถ้ายังไม่ login (ตรวจด้วย getSessionCookie จาก better-auth/cookies)
- ยกเว้น public paths: /login, /register, /forgot-password, /reset-password
- ถ้า login แล้วพยายามเข้า public path ให้ redirect ไป /
- export function proxy (ไม่ใช่ middleware)
- ใช้ matcher ยกเว้น api, _next/static, _next/image, favicon.ico และไฟล์ที่มีนามสกุล
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้าง `proxy.ts` พร้อม config matcher

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์ชื่อ `proxy.ts` ที่ root (ไม่ใช่ `middleware.ts`)
- function ชื่อ `export function proxy(request: NextRequest)` (ไม่ใช่ `middleware`)
- เปิดหน้าใดก็ได้โดยไม่ login → ถูก redirect ไป `/login`
- หลัง login แล้วพิมพ์ URL `/login` → ถูก redirect ไป `/`
- route `/api/auth/...` ไม่ถูก intercept (ยกเว้นผ่าน matcher)

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```ts
// proxy.ts
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
สร้างหน้า auth ทั้งหมดใน route group app/(auth)/ ดังนี้ (เทียบดีไซน์กับ mockup ใน project-ui/):
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

เมื่อลงมือทำ module นี้จริงและเสร็จแล้ว อย่าลืมกลับไปติ๊ก checkbox งาน Auth ใน `docs/spec.md` ให้เป็น `[x]` ด้วย - รักษาให้ spec เป็น single source of truth เสมอ

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
ช่วยอัปเดต @CLAUDE.md (อยู่ root ของโปรเจกต์) ให้มีข้อมูลครบถ้วนสำหรับ stock-app
โดยระบุ tech stack ตามจริง (Next.js 16, React 19, Tailwind v4, shadcn/ui base-nova,
Prisma 7, PostgreSQL, pnpm), กฎสำคัญ (ห้ามมี semicolon, Server Actions ใน app/actions/
คืนค่า ActionResult, validate ด้วย zod, ทุก query สินค้าต้อง filter deletedAt: null),
โครงสร้าง Prisma models (Product มี deletedAt soft-delete, StockTransaction, enum),
ตรรกะสถานะสต็อก (0=หมด, <=reorderPoint=ใกล้หมด, อื่นๆ=ปกติ),
และโครงสร้าง folder หลักของโปรเจกต์
```

**🤖 Claude Code จะทำอะไร:** อ่านไฟล์ `CLAUDE.md` ที่ root แล้วเขียนทับด้วยเวอร์ชันที่ครบถ้วน

**✅ Checkpoint ตรวจสอบ:**
- มี tech stack ระบุ Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui (base-nova บน Base UI), Prisma 7, PostgreSQL, pnpm
- มีกฎ "ห้ามใส่ semicolon (;)" ชัดเจน
- มีกฎ soft-delete: ทุก query สินค้าต้อง filter `deletedAt: null` (ใช้ helper ใน `lib/queries.ts`)
- มี model Product (รวม `deletedAt`) และ StockTransaction พร้อม field สำคัญ
- มีตรรกะสถานะสต็อกครบ 3 กรณี
- มีโครงสร้าง folder `app/products/`, `app/stock-in/`, `app/stock-out/`, `app/low-stock/`, `app/actions/`

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง - ดูฉบับเต็มได้ที่ CLAUDE.md จริงในโปรเจกต์):**
```markdown
# CLAUDE.md — StockApp

## Tech Stack
- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript 5.9
- Tailwind CSS v4 (design tokens ใน app/globals.css แบบ @theme inline)
- shadcn/ui สไตล์ base-nova (บน Base UI) + ธีม Genius Stock
- Prisma 7 + PostgreSQL (Docker, localhost:5434) · pnpm

## กฎสำคัญ
- ห้ามใส่ semicolon (;) ในทุกไฟล์ TypeScript/JavaScript
- UI เป็นภาษาไทย · validate ทุก input ด้วย zod ก่อนบันทึก
- mutation ทั้งหมดผ่าน Server Actions ใน app/actions/ คืนค่า ActionResult
  ({ ok, message } หรือ { ok: false, error, fieldErrors? })
- ทุก query สินค้าต้อง filter deletedAt: null (soft-delete) - ใช้ helper ใน lib/queries.ts
- Stock Out ห้ามเบิกเกิน + กัน race ด้วย updateMany เงื่อนไข quantity gte ใน $transaction

## Prisma Models หลัก
- Product: id (cuid), sku (unique), name, category, unit, quantity,
  reorderPoint, price Decimal(12,2), deletedAt? (soft-delete)
- StockTransaction: id, productId, type (IN/OUT), quantity, note?, createdAt

## ตรรกะสถานะสต็อก
- quantity == 0 → "หมด" · quantity <= reorderPoint → "ใกล้หมด" · อื่น ๆ → "ปกติ"

## โครงสร้างหลัก
- app/page.tsx — Dashboard (/) · app/products/ · app/stock-in/ · app/stock-out/ · app/low-stock/
- app/actions/ — server actions (products.ts, stock.ts)
- lib/ — prisma.ts, queries.ts, validations.ts, types.ts, product-status.ts, format.ts
- prisma/schema.prisma — Database Schema
```

---

## Module 2.2: Custom Slash Commands → ย้ายไปวันที่ 3

เนื้อหา **Custom Slash Commands** (การสร้างคำสั่งของตัวเองใน `.claude/commands/` พร้อม `$ARGUMENTS`) ถูก**ย้ายไปสอนในวันที่ 3** ด้วยเหตุผล 2 ข้อ:

1. `docs/spec.md` จัดงานนี้ไว้ใน **Phase 3 (Agentic Quality)** ซึ่งเป็นกลุ่ม dev tooling เดียวกับ Sub-agents และ MCP
2. ในโปรเจกต์จริงยังไม่มีโฟลเดอร์ `.claude/commands/` - จะสร้างพร้อมกันตอนทำ Phase 3

ดูเนื้อหาเต็มได้ที่ **Day3_note.md (Module 3.0: Custom Slash Commands)**

---

## Module 2.3: พัฒนา CRUD จัดการสินค้า

> **หมายเหตุ UI:** ทุกหน้าใน Module นี้ใช้ component ของ shadcn/ui (Card, Table, Button, Input, Select) ที่ติดตั้งไว้ตั้งแต่วันที่ 1 — ไม่ต้องติดตั้งเพิ่ม

### เริ่มต้นด้วย Server Actions

Next.js 16 App Router แนะนำให้ใช้ **Server Actions** สำหรับ mutation (create/update/delete) แทน API Routes เพราะ:
- เขียนโค้ดน้อยกว่า — ไม่ต้องสร้าง `/api/` route
- Type-safe ระหว่าง client และ server
- Integrate กับ form ได้ตรงๆ

### 🛠️ ขั้นตอนที่ 2: สร้าง Zod Schema รวมที่ lib/validations.ts

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ lib/validations.ts รวม Zod schema ของทั้งโปรเจกต์ไว้ไฟล์เดียว
โดยดู field จาก @prisma/schema.prisma

productSchema (ฟอร์มสร้าง/แก้ไขสินค้า):
- sku: string, trim, 1-50 ตัวอักษร
- name: string, trim, 1-200 ตัวอักษร
- category: string, trim, ไม่ว่าง, max 100
- unit: string, trim, ไม่ว่าง, max 50
- reorderPoint: number (coerce), int, >=0
- price: number (coerce), >=0
- ห้ามมี quantity ใน schema นี้ — จำนวนคงเหลือแก้ตรง ๆ ไม่ได้
  ต้องผ่าน Stock In/Out เท่านั้น (spec F1)

stockMovementSchema (ฟอร์มรับเข้า/เบิกออก):
- productId: string ไม่ว่าง (id เป็น cuid ไม่ใช่ตัวเลข)
- quantity: number (coerce), int, positive (>0)
- note: string, max 500, optional

export type ProductInput และ StockMovementInput
error message เป็นภาษาไทยทั้งหมด ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** อ่าน schema.prisma แล้วสร้างไฟล์ `lib/validations.ts` ที่มี 2 schema

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์อยู่ที่ `lib/validations.ts` (ไฟล์เดียว ไม่แยกเป็นโฟลเดอร์)
- `productSchema` **ไม่มี field `quantity`** - จุดสำคัญของ data integrity
- มี `z.coerce.number()` สำหรับ field ตัวเลข (รับค่าจาก FormData เป็น string ได้)
- `productId` เป็น `z.string()` เพราะ id เป็น cuid
- ไม่มี semicolon ท้ายบรรทัด

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```ts
// lib/validations.ts (ตัดมาบางส่วน)
import { z } from "zod"

export const productSchema = z.object({
  sku: z.string().trim().min(1, "กรุณากรอก SKU").max(50, "SKU ต้องไม่เกิน 50 ตัวอักษร"),
  name: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า").max(200, "ชื่อสินค้ายาวเกินไป"),
  category: z.string().trim().min(1, "กรุณากรอกหมวดหมู่").max(100, "หมวดหมู่ยาวเกินไป"),
  unit: z.string().trim().min(1, "กรุณากรอกหน่วยนับ").max(50, "หน่วยนับยาวเกินไป"),
  reorderPoint: z.coerce
    .number({ message: "จุดสั่งซื้อต้องเป็นตัวเลข" })
    .int("จุดสั่งซื้อต้องเป็นจำนวนเต็ม")
    .min(0, "จุดสั่งซื้อต้องไม่ติดลบ"),
  price: z.coerce
    .number({ message: "ราคาต้องเป็นตัวเลข" })
    .min(0, "ราคาต้องไม่ติดลบ"),
})

export type ProductInput = z.infer<typeof productSchema>

export const stockMovementSchema = z.object({
  productId: z.string().trim().min(1, "กรุณาเลือกสินค้า"),
  quantity: z.coerce
    .number({ message: "จำนวนต้องเป็นตัวเลข" })
    .int("จำนวนต้องเป็นจำนวนเต็ม")
    .positive("จำนวนต้องมากกว่า 0"),
  note: z.string().trim().max(500, "หมายเหตุยาวเกินไป").optional()
    .transform((v) => (v ? v : undefined)),
})

export type StockMovementInput = z.infer<typeof stockMovementSchema>
```

### 🛠️ ขั้นตอนที่ 3: สร้าง Server Actions สำหรับ Product (app/actions/products.ts)

ก่อนเริ่ม สังเกตหลักการแบ่งงานของโปรเจกต์นี้: **mutation อยู่ใน Server Actions แต่ read query อยู่ฝั่ง RSC** - หน้าเพจ query Prisma ตรงผ่าน helper ใน `lib/queries.ts` ได้เลย ไม่ต้องมี getAllProducts ใน actions

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างสองไฟล์:

1. lib/types.ts - type กลางของโปรเจกต์:
   - ActionResult = { ok: true, message: string }
     | { ok: false, error: string, fieldErrors?: Record<string, string> }
   - ProductDTO (plain object สำหรับส่งเข้า client — price เป็น number)
   - isUniqueConstraintError(e) — ตรวจ Prisma error P2002 (SKU ซ้ำ)

2. app/actions/products.ts - Server Actions ของสินค้า
   อ้างอิง @lib/validations.ts @lib/prisma.ts
   - createProduct(formData) - safeParse → create → จับ SKU ซ้ำ (P2002)
   - updateProduct(id: string, formData) - เช็คว่าสินค้ายังอยู่ (deletedAt: null) → update
     (ห้ามแตะ quantity)
   - deleteProduct(id: string) - soft-delete: เซ็ต deletedAt = new Date() ไม่ลบจริง
     เพื่อรักษาประวัติ transaction (spec F1)
   - ทุกฟังก์ชันคืนค่า Promise<ActionResult> - validation fail ให้ส่ง fieldErrors รายช่อง
   - หลัง mutation เรียก revalidatePath ทุกหน้า: /, /products, /stock-in, /stock-out, /low-stock
   - ห้ามมี semicolon, 'use server' ด้านบน

3. lib/queries.ts - query helper ที่ filter deletedAt: null เสมอ:
   getActiveProducts, getProductOptions, getLowStockProducts, getLowStockCount
   (ใกล้หมด = quantity <= reorderPoint ใช้ field reference ของ Prisma)
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ทั้งสาม ขอ permission เขียนไฟล์

**✅ Checkpoint ตรวจสอบ:**
- บรรทัดแรกของ actions คือ `"use server"`
- `deleteProduct` เป็น **soft-delete** (update `deletedAt`) ไม่ใช่ `prisma.product.delete`
- ทุก action คืนค่า `ActionResult` รูปแบบ `{ ok, ... }` (ไม่ใช่ `{ success, ... }`)
- SKU ซ้ำถูกจับด้วย `isUniqueConstraintError` (P2002) + ส่ง `fieldErrors.sku`
- `revalidatePath` ครบทั้ง 5 เส้นทางหลัง mutation
- query ทุกตัวใน `lib/queries.ts` มี `deletedAt: null`
- ไม่มี semicolon ท้ายบรรทัดใดเลย (ตรวจด้วย grep)

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง - ตัดมาบางส่วนจากโค้ดจริง):**
```ts
// app/actions/products.ts (ส่วนสำคัญ)
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { productSchema } from "@/lib/validations"
import { isUniqueConstraintError, type ActionResult } from "@/lib/types"

function revalidateAll() {
  revalidatePath("/")
  revalidatePath("/products")
  revalidatePath("/stock-in")
  revalidatePath("/stock-out")
  revalidatePath("/low-stock")
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const parsed = parseProduct(formData)
  if (!parsed.success) {
    return {
      ok: false,
      error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors),
    }
  }

  try {
    await prisma.product.create({ data: parsed.data })
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return {
        ok: false,
        error: `SKU "${parsed.data.sku}" ถูกใช้ไปแล้ว`,
        fieldErrors: { sku: "SKU นี้มีอยู่ในระบบแล้ว" },
      }
    }
    throw e
  }

  revalidateAll()
  return { ok: true, message: `เพิ่มสินค้า "${parsed.data.name}" เรียบร้อย` }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: { name: true },
  })
  if (!existing) {
    return { ok: false, error: "ไม่พบสินค้าที่ต้องการลบ" }
  }

  // soft-delete — เก็บประวัติการเคลื่อนไหวไว้ (spec F1)
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  revalidateAll()
  return { ok: true, message: `ลบสินค้า "${existing.name}" แล้ว (เก็บประวัติไว้)` }
}
```

```ts
// lib/queries.ts (ส่วนสำคัญ) — ทุก query กรอง deletedAt: null เสมอ
const notDeleted = { deletedAt: null }

// ใกล้หมด/หมด = quantity <= reorderPoint (เทียบ field-to-field ด้วย field reference)
const lowStockWhere = {
  ...notDeleted,
  quantity: { lte: prisma.product.fields.reorderPoint },
}

export function getActiveProducts() {
  return prisma.product.findMany({
    where: notDeleted,
    orderBy: { createdAt: "desc" },
  })
}
```

> **Key Concept (Soft-delete):** `deleteProduct` ไม่ลบ row จริง แต่เซ็ต `deletedAt` เพื่อรักษาประวัติ `StockTransaction` ไว้ครบ (FK ยังเป็น `ON DELETE RESTRICT`) ผลคือ**ทุก query สินค้าต้อง filter `deletedAt: null`** - นี่คือเหตุผลที่รวม query ไว้ใน `lib/queries.ts` ที่เดียว จะได้ไม่มีใครลืม ข้อจำกัดที่ต้องรู้: SKU `@unique` ยังครอบ row ที่ลบแล้ว สร้าง SKU เดิมซ้ำจะติด `P2002` (MVP ยอมรับได้ ถ้าจะแก้ค่อยทำ partial unique index)

### 🛠️ ขั้นตอนที่ 4: สร้างหน้า /products (ตาราง + Dialog ฟอร์ม)

UI ของโปรเจกต์นี้ใช้รูปแบบ **dialog** สำหรับสร้าง/แก้ไขสินค้า (ไม่แยกหน้า `/products/new`) ตามดีไซน์ใน `project-ui/Products.dc.html`

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างหน้า /products โดยอ้างอิง @app/actions/products.ts @lib/queries.ts และธีมใน @app/globals.css

1. app/products/page.tsx - async Server Component (export const dynamic = "force-dynamic")
   - ดึงข้อมูลด้วย getActiveProducts() + getLowStockCount() จาก lib/queries.ts
   - แปลงเป็น ProductDTO ก่อนส่งเข้า client - price ต้อง Number(p.price)
     เพราะ Decimal serialize ข้าม RSC boundary ไม่ได้
   - ห่อด้วย <AppShell title subtitle lowStockCount>

2. components/products/products-client.tsx - Client Component
   - ตารางสินค้า: SKU (ฟอนต์ mono), ชื่อ, หมวดหมู่, คงเหลือ, ราคา,
     สถานะ (StatusBadge), ปุ่มแก้ไข/ลบ
   - ค้นหา + กรองตามหมวดหมู่
   - เรียก action ผ่าน useTransition แล้วแสดง sonner toast จาก ActionResult

3. components/products/product-form-dialog.tsx - Dialog ฟอร์มสร้าง/แก้ไข
   - ใช้ UI primitives ใน components/ui/ (Dialog, Input, Select, Button, Label)
   - แสดง fieldErrors จาก ActionResult ใต้ input แต่ละช่อง

4. lib/product-status.ts - getStockStatus(quantity, reorderPoint) คืนสถานะ
   หมด (quantity == 0) / ใกล้หมด (<= reorderPoint) / ปกติ + components/status-badge.tsx

ใช้ design token จากธีม (bg-primary, bg-warning-bg, text-danger ฯลฯ)
ห้าม hardcode สี hex ในคอมโพเนนต์ ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ทั้งหมด ขอ permission เขียนไฟล์หลายไฟล์

**✅ Checkpoint ตรวจสอบ:**
- `page.tsx` เป็น async Server Component + มี `export const dynamic = "force-dynamic"` (spec F4 - ข้อมูลสดเสมอ)
- มีการแปลง `Number(p.price)` เป็น `ProductDTO` ก่อนส่งเข้า client component
- สร้าง/แก้ไขผ่าน **dialog** ไม่ใช่หน้าแยก `/products/new`
- ลบสินค้าแล้ว toast แจ้ง "ลบสินค้า ... แล้ว (เก็บประวัติไว้)" และแถวหายจากตาราง
- badge สถานะถูกต้องตาม logic 3 กรณี ผ่าน `StatusBadge`
- ไม่มี semicolon และไม่มีสี hex hardcode ใน component

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง):**
```tsx
// app/products/page.tsx (โค้ดจริงในโปรเจกต์)
import { getActiveProducts, getLowStockCount } from "@/lib/queries"
import type { ProductDTO } from "@/lib/types"
import { AppShell } from "@/components/layout/app-shell"
import { ProductsClient } from "@/components/products/products-client"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const [products, lowStockCount] = await Promise.all([
    getActiveProducts(),
    getLowStockCount(),
  ])

  const dtos: ProductDTO[] = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    quantity: p.quantity,
    reorderPoint: p.reorderPoint,
    price: Number(p.price), // Decimal → number ก่อนข้าม RSC boundary
  }))

  return (
    <AppShell title="จัดการสินค้า" subtitle={`ทั้งหมด ${dtos.length} รายการ`} lowStockCount={lowStockCount}>
      <ProductsClient products={dtos} />
    </AppShell>
  )
}
```

---

## Module 2.4: ฟังก์ชันรับเข้า (Stock In) และเบิกจ่าย (Stock Out)

> **หมายเหตุ UI:** หน้าฟอร์ม Stock In/Out ใช้ shadcn/ui (Card, Select, Input, Button) เช่นกัน

### ทำความเข้าใจ Business Logic

```
Stock IN (รับเข้า):
  สร้าง StockTransaction type=IN + increment quantity
  ทำได้เสมอ - ไม่มีข้อจำกัด (แต่ต้องอยู่ใน $transaction เดียวกัน)

Stock OUT (เบิกออก) - กันเบิกเกิน + กัน race:
  updateMany({
    where: { id, deletedAt: null, quantity: { gte: จำนวนที่เบิก } },
    data:  { quantity: { decrement: จำนวนที่เบิก } },
  })
  ├── count === 1 → ตัดสต็อกสำเร็จ → สร้าง StockTransaction type=OUT ✅
  └── count === 0 → quantity ไม่พอ → ปฏิเสธ ไม่สร้าง txn ไม่แตะสต็อก ❌

ทั้งหมดทำใน prisma.$transaction เดียว (atomic)
```

> **ทำไมไม่ใช้วิธี findUnique แล้วเช็คก่อนค่อย update?** เพราะมีช่องว่างเวลา (race window) ระหว่าง "อ่านค่า" กับ "เขียนค่า" - ถ้าสองคนกดเบิกพร้อมกัน ทั้งคู่จะอ่านเห็นว่ายอดพอ แล้วต่างคนต่างตัดสต็อก ทำให้ติดลบได้ วิธี `updateMany` ที่มีเงื่อนไข `quantity: { gte }` ให้ database ตรวจเงื่อนไขที่ระดับ row ตอนเขียนเลย จึงกัน race ได้จริง (spec F3 ระบุว่าพิสูจน์ด้วย concurrent test แล้ว)

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

### 🛠️ ขั้นตอนที่ 5: สร้าง Server Actions สำหรับ Stock In/Out (app/actions/stock.ts)

Zod schema (`stockMovementSchema`) สร้างไว้แล้วใน `lib/validations.ts` ตั้งแต่ขั้นตอนที่ 2 - ขั้นนี้เหลือแค่ actions

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างไฟล์ app/actions/stock.ts - Server Actions สำหรับ Stock In และ Stock Out
- 'use server' ด้านบน อ้างอิง @lib/prisma.ts @lib/validations.ts @lib/types.ts
- import enum: import { TransactionType } from "@/src/generated/prisma/enums"

- stockIn(formData): ใน prisma.$transaction -
    หา product (ต้อง deletedAt: null) → ไม่เจอคืน notfound
    → สร้าง StockTransaction type=IN → increment quantity
- stockOut(formData): ใน prisma.$transaction -
    หา product (deletedAt: null) → ไม่เจอคืน notfound
    → updateMany({ where: { id, deletedAt: null, quantity: { gte: qty } },
                    data: { quantity: { decrement: qty } } })
    → ถ้า count === 0 แปลว่าเบิกเกิน → คืน insufficient ไม่สร้าง txn
    → ถ้าสำเร็จค่อยสร้าง StockTransaction type=OUT

- ทั้งสองคืนค่า Promise<ActionResult>
  - สำเร็จ: message บอกชื่อสินค้า จำนวน และยอดคงเหลือใหม่
  - เบิกเกิน: error บอกยอดคงเหลือจริง + fieldErrors.quantity
- หลังสำเร็จเรียก revalidatePath: /, /products, /stock-in, /stock-out, /low-stock
- ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้างไฟล์ ใช้ `prisma.$transaction` แบบ interactive transaction ขอ permission

**✅ Checkpoint ตรวจสอบ:**
- `stockIn` ใช้ `{ increment: quantity }` สำหรับ product update
- `stockOut` ใช้ **`updateMany` + เงื่อนไข `quantity: { gte: quantity }`** แล้วเช็ค `count === 0` (ไม่ใช่ findUnique แล้วเช็คเอง - แบบนั้นกัน race ไม่ได้)
- เบิกเกิน → ไม่มี StockTransaction ถูกสร้าง + error บอกยอดคงเหลือจริง
- ทุก query product ใน transaction มี `deletedAt: null`
- `revalidatePath` ครบ 5 เส้นทาง
- ไม่มี semicolon

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง - ส่วน stockOut จากโค้ดจริง):**
```ts
// app/actions/stock.ts (ส่วน stockOut — ตรรกะสำคัญ)
export async function stockOut(formData: FormData): Promise<ActionResult> {
  const parsed = parseMovement(formData)
  if (!parsed.success) {
    return { ok: false, error: firstFieldError(parsed.error.flatten().fieldErrors) }
  }
  const { productId, quantity, note } = parsed.data

  const outcome = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { name: true, quantity: true, unit: true },
    })
    if (!product) return { kind: "notfound" as const }

    // กันเบิกเกิน + กัน race: update แบบมีเงื่อนไข quantity >= จำนวนที่เบิก
    // ถ้าเงื่อนไขไม่ผ่าน count จะเป็น 0 → ปฏิเสธ ไม่แตะสต็อก ไม่สร้าง transaction
    const updated = await tx.product.updateMany({
      where: { id: productId, deletedAt: null, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    })
    if (updated.count === 0) {
      return {
        kind: "insufficient" as const,
        name: product.name,
        available: product.quantity,
        unit: product.unit,
      }
    }

    await tx.stockTransaction.create({
      data: { productId, type: TransactionType.OUT, quantity, note },
    })

    return { kind: "ok" as const, name: product.name, unit: product.unit,
             remaining: product.quantity - quantity }
  })

  if (outcome.kind === "notfound") {
    return { ok: false, error: "ไม่พบสินค้าที่เลือก" }
  }
  if (outcome.kind === "insufficient") {
    return {
      ok: false,
      error: `เบิกเกินจำนวนคงเหลือ — "${outcome.name}" มีเพียง ${outcome.available} ${outcome.unit}`,
      fieldErrors: { quantity: `เบิกได้ไม่เกิน ${outcome.available}` },
    }
  }

  revalidateAll()
  return { ok: true, message: `เบิกจ่าย "${outcome.name}" −${quantity} ${outcome.unit} · คงเหลือ ${outcome.remaining}` }
}
```

### 🛠️ ขั้นตอนที่ 6: สร้างหน้า /stock-in และ /stock-out

โปรเจกต์นี้แยกรับเข้าและเบิกออกเป็น **2 route** (`/stock-in`, `/stock-out`) โดยใช้ฟอร์มร่วมกันผ่าน prop `mode` - ไม่ใช้ query param `?type=`

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างหน้ารับเข้าและเบิกออก โดยอ้างอิง @app/actions/stock.ts และ @lib/queries.ts

1. app/stock-in/page.tsx และ app/stock-out/page.tsx - async Server Component
   - export const dynamic = "force-dynamic"
   - โหลดตัวเลือกสินค้าด้วย getProductOptions() ฝั่ง server (ไม่ใช้ useEffect)
   - ห่อด้วย <AppShell> พร้อม title/subtitle ของแต่ละหน้า
   - ถ้ายังไม่มีสินค้า แสดง empty state พร้อมลิงก์ไป /products

2. components/stock/stock-form.tsx - Client Component รับ prop mode: "in" | "out"
   - field: productId (Select), quantity (Input number), note (Textarea)
   - เมื่อเลือกสินค้า แสดง "คงเหลือ: X หน่วย" ใต้ dropdown
   - submit เรียก stockIn หรือ stockOut ตาม mode ผ่าน useTransition
   - สำเร็จ → sonner toast (message จาก ActionResult) + reset form
   - ล้มเหลว → toast error + แสดง fieldErrors ใต้ช่องที่ผิด
- ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้าง 2 หน้า + ฟอร์มร่วม ขอ permission เขียนไฟล์

**✅ Checkpoint ตรวจสอบ:**
- ตัวเลือกสินค้าโหลดฝั่ง **server ผ่าน `getProductOptions()`** - ไม่มี `useEffect` fetch ฝั่ง client
- `stock-form.tsx` ตัวเดียวรองรับทั้ง 2 โหมดผ่าน prop `mode`
- เบิกเกิน → toast error "เบิกเกินจำนวนคงเหลือ..." + fieldError ใต้ช่องจำนวน
- สินค้าที่ถูก soft-delete ไม่โผล่ใน dropdown
- ไม่มี semicolon

### ทดสอบการกันเบิกเกิน

```
สถานการณ์ทดสอบ (ที่หน้า /stock-out):
Product: กระดาษ A4 (SKU-1002), quantity = 5 รีม

ทดสอบ 1: เบิก 3 รีม
→ updateMany เงื่อนไข gte ผ่าน (5 >= 3) ✅ → บันทึกสำเร็จ → คงเหลือ 2

ทดสอบ 2: เบิก 10 รีม (จากที่เหลือ 2)
→ เงื่อนไข gte ไม่ผ่าน → count === 0 ❌
→ toast: เบิกเกินจำนวนคงเหลือ — "กระดาษ A4" มีเพียง 2 รีม
→ ไม่มี StockTransaction record ถูกสร้าง
→ quantity ยังคงเป็น 2 (ไม่มีการเปลี่ยนแปลง)
```

---

## Module 2.5: หน้า Dashboard และรายงานสต็อก

### สิ่งที่ Dashboard ต้องแสดง (ตาม spec F4)

Dashboard อยู่ที่ **route `/`** (`app/page.tsx`) - ไม่ใช่ `/dashboard`

```
┌──────────────────────────────────────────────────────────┐
│  ภาพรวมคลังสินค้า                        (route /)       │
│                                                          │
│  ┌────────┐ ┌───────────┐ ┌─────────┐ ┌──────────┐      │
│  │ SKU    │ │ มูลค่าสต็อก│ │ ใกล้หมด │ │ หมดสต็อก │      │
│  │ทั้งหมด │ │ รวม (บาท)  │ │         │ │          │      │
│  │   7    │ │  152,300  │ │    2    │ │    1     │      │
│  └────────┘ └───────────┘ └─────────┘ └──────────┘      │
│                                                          │
│  📈 กราฟแนวโน้ม IN vs OUT ย้อนหลัง 14 วัน (TrendChart)   │
│                                                          │
│  ⚠️ สินค้าใกล้หมด (quantity <= reorderPoint)             │
│  │ SKU-1002 กระดาษ A4   เหลือ 5/10 รีม   ใกล้หมด │      │
│  │ SKU-1005 น้ำดื่ม     เหลือ 0/20 ลัง   หมดสต็อก│      │
│  → ดูทั้งหมดที่หน้า /low-stock                           │
│                                                          │
│  ประวัติการเคลื่อนไหวล่าสุด 10 รายการ                    │
│  │ ↑ IN  กระดาษ A4  +50 รีม   12 ก.ค. 20:45 │           │
│  │ ↓ OUT โน้ตบุ๊ค   −2 เครื่อง 12 ก.ค. 19:30 │           │
└──────────────────────────────────────────────────────────┘
```

มูลค่าสต็อกรวม = `Σ quantity × price` - นี่คือเหตุผลที่ `price` เป็น `Decimal(12,2)` ไม่ใช่ int

### 🛠️ ขั้นตอนที่ 7: สร้างหน้า Dashboard (app/page.tsx) และหน้า /low-stock

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างหน้า Dashboard ที่ app/page.tsx (route /) เป็น async Server Component
export const dynamic = "force-dynamic" (spec F4 - ข้อมูลสดเสมอ)

ดึงข้อมูล (ทุก query product ต้อง filter deletedAt: null):
1. products ทั้งหมด → คำนวณ KPI
2. stockTransaction 10 รายการล่าสุด include product (name, unit)
3. transaction ย้อนหลัง 14 วัน → รวมยอด IN/OUT รายวันเป็นข้อมูลกราฟ

KPI cards 4 ใบ (ตาม spec F4):
- จำนวน SKU ทั้งหมด
- มูลค่าสต็อกรวม = Σ quantity × Number(price) แสดงเป็นบาท (formatBaht)
- ใกล้หมด (quantity > 0 และ <= reorderPoint)
- หมดสต็อก (quantity === 0)

แสดงผลด้วย component:
- <KpiCard> 4 ใบ (components/dashboard/kpi-card.tsx)
- <TrendChart> กราฟ IN vs OUT 14 วัน (components/dashboard/trend-chart.tsx - client)
- ตารางสินค้าใกล้หมดเรียงวิกฤตสุดก่อน + ลิงก์ "ดูทั้งหมด" ไปหน้า /low-stock
- รายการเคลื่อนไหวล่าสุด 10 รายการ (↑ IN เขียว / ↓ OUT ส้ม + วันเวลาแบบไทย)
ห่อทั้งหมดด้วย <AppShell> ใช้ format helper จาก @lib/format.ts

และสร้างหน้า app/low-stock/page.tsx แสดงตารางสินค้าใกล้หมด/หมดทั้งหมด
โดยใช้ getLowStockProducts() จาก @lib/queries.ts
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้างหน้า Dashboard + Low Stock พร้อม component กราฟและ KPI card ใช้ `prisma` โดยตรงใน Server Component

**✅ Checkpoint ตรวจสอบ:**
- Dashboard อยู่ที่ `app/page.tsx` (route `/`) + มี `force-dynamic`
- KPI มี **4 ใบรวมมูลค่าสต็อกรวม** ที่คูณ `Number(p.price)` (Decimal ต้องแปลงก่อนคำนวณ)
- แยก "ใกล้หมด" (`quantity > 0 && quantity <= reorderPoint`) กับ "หมดสต็อก" (`quantity === 0`) เป็นคนละใบ
- กราฟแนวโน้มครอบคลุม 14 วัน วันที่ไม่มีรายการต้องเป็น 0 (ไม่ใช่หายไป)
- หน้า `/low-stock` ใช้ query ร่วมจาก `lib/queries.ts`
- ไม่มี semicolon

**📄 โค้ดอ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ ไม่ใช่พิมพ์เอง - ส่วน KPI จากโค้ดจริง):**
```ts
// app/page.tsx (ส่วนสำคัญ)
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { sku: "asc" },
  })

  const skuCount = products.length
  const stockValue = products.reduce(
    (sum, p) => sum + p.quantity * Number(p.price),
    0
  )
  const lowCount = products.filter(
    (p) => p.quantity > 0 && p.quantity <= p.reorderPoint
  ).length
  const outCount = products.filter((p) => p.quantity === 0).length

  const recent = await prisma.stockTransaction.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, unit: true } } },
  })
  // ... สร้างข้อมูล trend 14 วัน แล้ว render KpiCard / TrendChart / ตาราง ...
}
```

### 🛠️ ขั้นตอนที่ 8: Layout และ Navigation ด้วย AppShell

โปรเจกต์นี้**ไม่ฝัง sidebar ใน `app/layout.tsx`** แต่แยกเป็น component `<AppShell>` ให้แต่ละหน้าห่อเอง - เพราะหน้า RSC ต้องส่ง `lowStockCount` เข้าไปแสดง badge ที่เมนู sidebar

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้าง layout system ตามธีม Genius Stock (ดู design tokens ใน @app/globals.css):

1. components/layout/app-shell.tsx - <AppShell title subtitle lowStockCount>
   - Sidebar โทน teal ด้านซ้าย + Topbar แสดง title/subtitle + ปุ่มสลับธีม
   - มือถือ: sidebar เป็น drawer เปิดจากปุ่ม hamburger
2. components/layout/sidebar.tsx - เมนู:
   Dashboard (/), จัดการสินค้า (/products), รับสินค้าเข้า (/stock-in),
   เบิกจ่ายออก (/stock-out), สินค้าใกล้หมด (/low-stock + badge จำนวนจาก lowStockCount)
3. components/layout/theme-toggle.tsx - dark mode:
   toggle class .dark ที่ <html> + เก็บใน localStorage key 'geniusstock-theme'
4. ปรับ app/layout.tsx - โหลดฟอนต์ Inter + Anuphan + JetBrains Mono ผ่าน next/font,
   วาง <Toaster> ของ sonner และใส่ no-flash script อ่านธีมจาก localStorage ก่อน paint
ห้ามมี semicolon
```

**🤖 Claude Code จะทำอะไร:** สร้าง AppShell + sidebar + theme toggle แล้วปรับ layout.tsx

**✅ Checkpoint ตรวจสอบ:**
- ทุกหน้า (Dashboard, Products, Stock In/Out, Low Stock) ห่อด้วย `<AppShell>` และส่ง `lowStockCount` จาก RSC
- เมนู sidebar ลิงก์ครบ 5 หน้า: `/`, `/products`, `/stock-in`, `/stock-out`, `/low-stock` (พร้อม badge)
- สลับ dark mode แล้ว refresh หน้าไม่มีอาการ flash (no-flash script ทำงาน)
- ฟอนต์ไทยแสดงเป็น Anuphan / SKU เป็น JetBrains Mono
- ไม่มี semicolon

---

## Module 2.6: Debug และ Refactor กับ Claude Code อย่างเป็นระบบ

### แนวทาง Debug ที่ดีกับ Claude Code

เมื่อเจอ error ให้ให้ข้อมูลครบถ้วนใน prompt เดียว — อย่าถามแบบ "ทำไม error?"

**รูปแบบ Prompt Debug ที่ดี — ต้องมีครบ 3 ส่วน:**

```
มี error ต่อไปนี้เกิดขึ้นที่ @app/actions/stock.ts ตอนทดสอบ Stock Out:

Error message:
TypeError: Cannot read properties of null (reading 'quantity')
  at stockOut (app/actions/stock.ts:45:30)

สถานการณ์ที่เกิด: เลือกสินค้าใน dropdown แล้วอีกคนลบสินค้านั้นพอดี
ก่อนเรากด Submit (productId ที่ส่งมาไม่มีในระบบแล้ว)

ช่วยหาสาเหตุและแก้ไขให้ด้วย
```

### 🛠️ ขั้นตอนที่ 9: ฝึก Debug ด้วย Prompt ที่ถูกวิธี

**💬 Prompt ที่ใช้สั่ง Claude Code (กรณีทดสอบ: error message ไม่แสดงเมื่อเบิกเกิน):**
```
ทดสอบเบิก 100 ชิ้น จากสินค้าที่มีแค่ 5 ชิ้น
แต่ไม่มี error message แสดงออกมาที่หน้าจอ กลับเหมือน submit สำเร็จ

ดู @app/actions/stock.ts และ @components/stock/stock-form.tsx

ช่วยหาว่า error ไปไหน และแก้ไขให้ error แสดงเป็น toast + fieldError ได้ถูกต้อง
```

**🤖 Claude Code จะทำอะไร:** อ่านทั้งสองไฟล์ หา mismatch ระหว่าง `ActionResult` ที่ action คืนมากับการ handle ผลลัพธ์ในฟอร์ม เสนอ fix

**✅ Checkpoint ตรวจสอบ:**
- Claude ระบุได้ว่าฟอร์มไม่ได้เช็ค `result.ok === false` แล้วเอา `result.error` ไปแสดง toast / `result.fieldErrors` ไปแสดงใต้ input
- แก้ไขแล้ว error "เบิกเกินจำนวนคงเหลือ..." แสดงออกมาในหน้าจอ
- error หายเมื่อ user เลือกสินค้าใหม่หรือแก้จำนวน (เคลียร์ fieldErrors ตอน onChange)

### 🛠️ ขั้นตอนที่ 10: Refactor ให้ DRY ขึ้น

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
@components/stock/stock-form.tsx มีส่วน config ของโหมด in และ out
(สี ข้อความปุ่ม ข้อความ title, action ที่เรียก) กระจายอยู่หลายจุดในไฟล์
ช่วย refactor รวมเป็น config object เดียวต่อโหมด โดยยังคงพฤติกรรมเดิมทุกอย่าง
และห้ามมี semicolon ท้ายบรรทัด
```

**🤖 Claude Code จะทำอะไร:** วิเคราะห์ส่วนที่ซ้ำกัน เสนอ extract เป็น config object ต่อ mode

**✅ Checkpoint ตรวจสอบ:**
- พฤติกรรมเดิมครบ (mode in/out, สีปุ่ม, การ submit, toast)
- โค้ดสั้นลง ไม่มีบล็อกซ้ำกัน
- ไม่มี semicolon

### เทคนิค: ให้ Claude Code อธิบายโค้ดก่อนแก้

```
ก่อนแก้ไข @app/actions/stock.ts
ช่วยอธิบายว่า prisma.$transaction ในฟังก์ชัน stockOut
ทำงานอย่างไรทีละขั้น โดยเฉพาะเงื่อนไข updateMany + gte ที่กัน race
เพื่อให้แน่ใจว่าเข้าใจตรงกัน
```

วิธีนี้ช่วยให้:
1. ตรวจสอบว่า Claude เข้าใจโค้ดถูกต้องก่อนแก้
2. ค้นพบ misunderstanding ก่อนที่จะ implement ผิด
3. ได้เรียนรู้ไปด้วยในเวลาเดียวกัน

---

## 🎯 Workshop ท้ายวัน

### โจทย์: ต่อยอด StockApp ให้ครบฟีเจอร์

ทำตามลำดับ — ใช้ Claude Code ช่วยพัฒนาทุกขั้นตอน ห้ามพิมพ์โค้ดเอง

### Workshop 2.1: พิสูจน์ Soft-delete

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยพิสูจน์ว่าการลบสินค้าเป็น soft-delete จริง:
1. ลบสินค้า 1 ตัวที่มีประวัติ transaction (ผ่าน UI หรือเรียก deleteProduct)
2. ตรวจใน database ว่า row ยังอยู่ (deletedAt ไม่เป็น null)
   และ StockTransaction ของสินค้านั้นยังครบ
3. ตรวจว่าหน้า /products และ dropdown ใน /stock-in ไม่แสดงสินค้าที่ถูกลบแล้ว
4. ทดลองสร้างสินค้าใหม่ด้วย SKU เดิมที่เพิ่งลบ - อธิบายว่าทำไมติด P2002
   และ MVP ยอมรับข้อจำกัดนี้อย่างไร (พร้อมแนวทางแก้ในอนาคต)
```

**✅ Checkpoint:**
- row ยังอยู่ + ประวัติ transaction ครบ (ตรงตาม spec F1)
- ทุกหน้าไม่เห็นสินค้าที่ลบ เพราะ query ผ่าน `lib/queries.ts` ที่ filter `deletedAt: null`
- Claude อธิบายข้อจำกัด SKU `@unique` ครอบ row ที่ลบแล้ว + ทางแก้ (partial unique index `WHERE deletedAt IS NULL`) ได้

### Workshop 2.2: ทดสอบ Stock In/Out ครบ 3 Scenario

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วย verify ว่าระบบ Stock In/Out ทำงานถูกต้องโดยการ:
1. รันคำสั่ง pnpm dev แล้วเปิด http://localhost:3000/stock-in
2. ทดสอบ Scenario A: รับเข้า SKU-1001, จำนวน 50, หมายเหตุ "รับจาก Supplier"
   → ตรวจสอบว่า quantity ใน database เพิ่มขึ้น
3. ทดสอบ Scenario B: ที่หน้า /stock-out เบิก SKU-1001, จำนวน 10
   → ตรวจสอบว่า quantity ลดลง
4. ทดสอบ Scenario C: เบิกเกินจำนวนคงเหลือ
   → ต้องเห็น toast error ชัดเจน และ quantity ไม่เปลี่ยน
บอกผลการทดสอบแต่ละ scenario
```

**✅ Checkpoint:**
- Scenario A: toast สำเร็จแสดง, ดู Dashboard → quantity และมูลค่าสต็อกรวมเพิ่ม
- Scenario B: toast สำเร็จแสดง, quantity ลด
- Scenario C: toast "เบิกเกินจำนวนคงเหลือ..." แสดงชัดเจน, quantity ไม่เปลี่ยน, ไม่มี txn ถูกสร้าง

### Workshop 2.3: ฝึก Debug จริง

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยทดลอง introduce bug แล้วหาคำตอบ:
1. ใน stockOut (@app/actions/stock.ts) ลองเปลี่ยน updateMany ที่มีเงื่อนไข
   quantity: { gte: quantity } เป็น update ธรรมดาที่ไม่มีเงื่อนไข
   แล้วอธิบายว่าจะเกิดอะไรขึ้น - เบิกติดลบได้ไหม?
   แล้วถ้าสองคนกดเบิกพร้อมกันจะเกิดอะไร?
2. แก้กลับให้ถูกต้อง แล้วอธิบายว่าทำไมเงื่อนไข gte ที่ระดับ row ใน database
   ถึงกัน race condition ได้ ในขณะที่ findUnique แล้วเช็คใน JS กันไม่ได้
3. ลอง remove revalidatePath('/') ออก แล้วบอกว่าหน้า Dashboard
   จะมีพฤติกรรมอย่างไรหลังทำรายการ
```

**✅ Checkpoint:**
- Claude อธิบายผลกระทบของการถอดเงื่อนไข `gte` ได้ถูกต้อง (ติดลบได้ + แพ้ race)
- Claude อธิบายความต่างระหว่าง check-then-write (มี race window) กับ conditional update (atomic ที่ DB)
- Claude อธิบาย revalidatePath ได้ว่าทำให้ Next.js เคลียร์ cache และ re-fetch ข้อมูลใหม่

### Workshop 2.4 (โจทย์ท้าทาย - ยังไม่มีในโปรเจกต์): หน้าประวัติ Transaction

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
สร้างหน้า app/transactions/page.tsx สำหรับแสดงประวัติการเคลื่อนไหวสต็อกทั้งหมด

ความต้องการ:
- เพิ่ม query ใหม่ getRecentTransactions(limit = 50) ใน @lib/queries.ts
  (include product: sku, name, unit)
- async Server Component + force-dynamic ห่อด้วย <AppShell>
- แสดงตาราง: วันที่-เวลา (แบบไทยจาก @lib/format.ts), ประเภท (IN/OUT badge),
  สินค้า (sku + name), จำนวน, หมายเหตุ
- badge IN = โทน success, OUT = โทน warning (ใช้ design token ห้าม hardcode hex)
- ปุ่ม "รับเข้า" และ "เบิกออก" ด้านบน link ไป /stock-in และ /stock-out
- เพิ่มเมนู "ประวัติเคลื่อนไหว" ใน sidebar ด้วย
- ห้ามมี semicolon
```

**✅ Checkpoint:**
- เป็น async Server Component + query อยู่ใน `lib/queries.ts` ตาม convention
- badge สี IN/OUT ใช้ token `--color-success` / `--color-warning`
- ไม่มี semicolon
- ถ้าทำเสร็จ อย่าลืมชวน Claude อัปเดต `docs/spec.md` และ `CLAUDE.md` ให้รู้จักหน้าใหม่นี้ด้วย

---

## สรุปวันที่ 2

วันนี้เราได้เรียนรู้และลงมือสร้างผ่าน Claude Code ทั้งหมด:

- ✅ เข้าใจ Context Window — ทำงานอย่างไร ทำไมถึงสำคัญ
- ✅ ใช้ `/clear`, `/compact`, และ `@file` บริหาร Context อย่างชาญฉลาด
- ✅ เขียน CLAUDE.md ที่ดี (root ของ repo) — ให้ Claude "รู้จักโปรเจกต์" ตั้งแต่ต้น
- ✅ สร้าง Zod schema รวมที่ `lib/validations.ts` - productSchema ไม่มี quantity (ต้องผ่าน Stock In/Out เท่านั้น)
- ✅ พัฒนา CRUD สินค้า - Server Actions ใน `app/actions/products.ts` คืนค่า `ActionResult` + **soft-delete** รักษาประวัติ
- ✅ แยก read query ไว้ `lib/queries.ts` - บังคับ filter `deletedAt: null` ทุกที่
- ✅ เขียน Stock In/Out ใน `app/actions/stock.ts` - **กันเบิกเกิน + กัน race** ด้วย `updateMany` เงื่อนไข `gte` ใน `prisma.$transaction`
- ✅ สร้าง Dashboard ที่ `/` - KPI 4 ใบ (รวมมูลค่าสต็อก), กราฟแนวโน้ม 14 วัน, สินค้าใกล้หมด, เคลื่อนไหวล่าสุด + หน้า `/low-stock`
- ✅ วาง Layout ด้วย `<AppShell>` (sidebar + dark mode + badge แจ้งเตือน) ตามธีม Genius Stock
- ✅ ฝึก Debug และ Refactor กับ Claude Code อย่างเป็นระบบ
- ⏳ งานค้างตามแผนปรับ: **ระบบ Auth (Better Auth)** - ดู Module 2.0 และ checkbox ใน docs/spec.md
- ➡️ ย้ายไปวันที่ 3: **Custom Slash Commands** (ตรงกับ Phase 3 ใน spec)

**วันพรุ่งนี้ (วันที่ 3):** เราจะเริ่มด้วย **Custom Slash Commands** ที่ย้ายมา แล้วขยายพลังของ Claude Code ด้วย **Sub-agents, MCP (Model Context Protocol), และ Hooks** — สอนให้ Claude ทำงานอัตโนมัติแบบ multi-step, เชื่อมต่อกับ external tools, และตั้ง automation ที่ทำงานเบื้องหลังโดยไม่ต้องสั่งทุกครั้ง

---

## แหล่งอ้างอิงเพิ่มเติม

- [Claude Code Docs — Context Management](https://docs.anthropic.com/en/docs/claude-code/context-management) — วิธีบริหาร Context อย่างเป็นทางการ
- [Better Auth Docs](https://www.better-auth.com/docs/installation) — สำหรับงานค้าง Module 2.0
- [Next.js Docs — Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) — Server Actions อย่างเป็นทางการ
- [Prisma Docs — Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) — `prisma.$transaction` ทุกรูปแบบ
- [Zod Docs](https://zod.dev) — Schema validation library
- [Tailwind CSS Docs](https://tailwindcss.com/docs) — Utility-first CSS framework
