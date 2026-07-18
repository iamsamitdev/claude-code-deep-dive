import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter, Anuphan, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// ฟอนต์ตามดีไซน์: Inter (อังกฤษ/ตัวเลข) → Anuphan (ไทย) → JetBrains Mono (โค้ด)
// Inter ไม่มี glyph ภาษาไทย อักษรไทยจึง fallback ไป Anuphan อัตโนมัติ
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
})

const anuphan = Anuphan({
  variable: '--font-anuphan',
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700']
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '600']
})

export const metadata: Metadata = {
  title: 'AgentFlow — Agent Teams Mission Control',
  description: 'Bonus: Claude Code Agent Teams + shadcn + Office 3D (จากดีไซน์ Design3D)'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${inter.variable} ${anuphan.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-muted/30">
        <div className="flex h-svh flex-col">
          <nav className="flex h-12 shrink-0 items-center gap-1 border-b bg-background px-4">
            <span className="mr-3 flex items-center gap-2 font-bold">🛰️ AgentFlow</span>
            <Link href="/" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Mission Control</Link>
            <Link href="/office" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">ออฟฟิศ 3D</Link>
          </nav>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
