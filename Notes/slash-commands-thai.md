# Slash Commands — คำสั่งควบคุมเซสชันแบบโต้ตอบ (Interactive Session Control)

> แปลและเรียบเรียงจาก **Claude Code 2.1 Cheatsheet** หัวข้อ "Slash Commands - Interactive Session Control"
> แหล่งอ้างอิง: https://awesomeclaude.ai/code-cheatsheet (อัปเดตล่าสุด: 12 มิถุนายน 2026)

---

## ภาพรวม

คำสั่ง Slash Command คือคำสั่งที่ใช้ควบคุมพฤติกรรมของ Claude ระหว่างที่กำลังทำงานในเซสชันแบบโต้ตอบ (interactive session) โดยพิมพ์คำสั่งเหล่านี้โดยตรงในหน้าต่างแชทของ Claude Code เครื่องหมาย `/` นำหน้าเป็นตัวบ่งชี้ว่ากำลังเรียกใช้คำสั่งระบบ ไม่ใช่การพิมพ์คำสั่ง/คำถามให้ AI ตีความ

---

## 📋 คำสั่งพื้นฐานที่มีมาให้ (Built-in Commands)

### กลุ่มจัดการบทสนทนา (Conversation Management)

| คำสั่ง | คำอธิบาย | ตัวอย่างการใช้งาน |
|---|---|---|
| `/clear` | เริ่มบทสนทนาใหม่ทั้งหมด แต่ยังคงความจำระดับโปรเจกต์ไว้ (เช่น CLAUDE.md ยังโหลดอยู่) | ใช้เมื่อทำงานเสร็จหนึ่งฟีเจอร์แล้วต้องการเริ่มงานถัดไปแบบ context สะอาด: `/clear` |
| `/compact [focus]` | สรุปย่อเนื้อหาบทสนทนาที่ผ่านมาเพื่อคืนพื้นที่ context window ที่ใกล้เต็ม | ถ้าคุยเรื่อง Riverpod provider chain มายาวและ context เริ่มเต็ม: `/compact เก็บรายละเอียดเรื่อง provider dependency ไว้` |
| `/resume [session]` | กลับมาทำงานต่อในบทสนทนาก่อนหน้า โดยระบุ session ID หรือชื่อ ถ้าไม่ระบุจะมีตัวเลือกให้เลือก | `/resume day1-riverpod-session` หรือพิมพ์ `/resume` เฉยๆ เพื่อเปิดตัวเลือก |
| `/branch [name]` | แยกกิ่งบทสนทนา ณ จุดปัจจุบัน เพื่อทดลองแนวทางอื่นโดยไม่กระทบสายหลัก (alias: `/fork`) | ก่อนทดลองปรับสถาปัตยกรรม state management ใหม่: `/branch experiment-cubit` |
| `/rewind` | ย้อนกลับโค้ดและ/หรือบทสนทนาไปยังสถานะก่อนหน้า (เทียบเท่าปุ่มลัด Esc Esc) มี alias คือ `/undo`, `/checkpoint` | หากแก้ไข API integration แล้วพัง: `/rewind` แล้วเลือกจุดก่อนแก้ไขไฟล์นั้น |
| `/context [all]` | แสดงภาพรวมการใช้งาน context window ว่าถูกใช้ไปเท่าไร ส่วนไหนบ้าง | ตรวจสอบก่อนตัดสินใจว่าจะ `/compact` หรือไม่: `/context all` |
| `/export [file]` | ส่งออกบทสนทนาทั้งหมดเป็นไฟล์ข้อความ | เก็บบันทึกการสอนไว้ทำเอกสารประกอบ: `/export day2-dio-explanation.txt` |
| `/copy [N]` | คัดลอกคำตอบล่าสุด (หรือคำตอบลำดับที่ N) ไปยัง clipboard | คัดลอกโค้ดตัวอย่างที่เพิ่งอธิบายไปวางในสไลด์: `/copy` |
| `/recap` | สรุปเนื้อหาของเซสชันทั้งหมดแบบสั้นในหนึ่งบรรทัด | ใช้ทบทวนก่อนเริ่ม session สอนวันถัดไป: `/recap` |
| `/btw <question>` | ถามคำถามแทรกระหว่างทางโดยไม่ทำให้ประวัติสนทนาหลักบวมขึ้น (คำถามและคำตอบจะไม่ถูกนับรวมเป็นบริบทหลัก) | `/btw Dio กับ http package ต่างกันอย่างไร` |

### กลุ่มโมเดลและระดับความพยายามในการคิด (Model & Effort)

| คำสั่ง | คำอธิบาย | ตัวอย่างการใช้งาน |
|---|---|---|
| `/model [model]` | สลับโมเดลที่ใช้งาน จะมีตัวเลือกให้เลือกหากไม่ระบุชื่อ ใช้ปุ่มลูกศร ← → เพื่อปรับระดับ effort ได้ในหน้าต่างเดียวกัน | `/model opus` เพื่อสลับไปใช้ Opus สำหรับงานวิเคราะห์สถาปัตยกรรมที่ซับซ้อน |
| `/effort [level]` | ตั้งค่าระดับความพยายามในการให้เหตุผล มีตัวเลือก `low` / `medium` / `high` / `xhigh` / `max` | `/effort high` ก่อนให้ช่วยออกแบบ schema ฐานข้อมูลที่ซับซ้อน |
| `/fast [on|off]` | เปิด/ปิดโหมดเร็ว (fast mode) ทำให้ Opus ตอบเร็วขึ้นโดยไม่ได้เปลี่ยนไปใช้โมเดลที่เล็กลง | `/fast on` เมื่อต้องการคำตอบไว ๆ ระหว่างสอนสด |

### กลุ่มการวางแผนและตรวจสอบงาน (Planning & Review)

| คำสั่ง | คำอธิบาย | ตัวอย่างการใช้งาน |
|---|---|---|
| `/plan [desc]` | เข้าสู่โหมดวางแผน (plan mode) ซึ่ง Claude จะวางแผนก่อนลงมือแก้ไขไฟล์จริง | `/plan ปรับ bla_policy_app ให้รองรับ Riverpod 3.0` |
| `/goal [condition]` | กำหนดเงื่อนไขความสำเร็จ แล้วให้ Claude ทำงานต่อเนื่องจนกว่าจะบรรลุเงื่อนไขนั้น | `/goal ทดสอบผ่านทุกเคสใน integration test แล้วหยุด` |
| `/code-review [effort] [--fix]` | ตรวจสอบ diff เพื่อหาบั๊กและจุดที่ควรปรับปรุง หากใส่ `--fix` จะแก้ไขให้อัตโนมัติ | `/code-review high --fix` ก่อน commit โค้ด branch `day2` |
| `/simplify [target]` | ตรวจสอบเฉพาะเพื่อทำความสะอาดโครงสร้างโค้ด (cleanup) โดยไม่เน้นหาบั๊ก | `/simplify lib/providers/api_provider.dart` |
| `/security-review` | สแกน diff เพื่อหาช่องโหว่ด้านความปลอดภัยโดยเฉพาะ | ใช้ก่อน deploy โปรเจกต์ที่เชื่อมต่อฐานข้อมูลลูกค้า: `/security-review` |
| `/review [PR]` | รีวิว pull request จากในเครื่อง (local) | `/review 42` เพื่อรีวิว PR หมายเลข 42 |
| `/run` | สั่งให้ Claude รันและขับเคลื่อนแอปพลิเคชันเพื่อยืนยันว่าการเปลี่ยนแปลงทำงานได้จริง | `/run` หลังแก้ไข provider chain เพื่อดูว่าแอป Flutter ยังรันได้ปกติ |
| `/verify` | ยืนยันว่าการเปลี่ยนแปลงโค้ดล่าสุดทำงานได้ตามที่ตั้งใจไว้ | `/verify` หลังปรับ Dio interceptor |
| `/diff` | เปิดตัวแสดงผลความแตกต่างของโค้ด (diff viewer) แบบโต้ตอบ | `/diff` เพื่อดูการเปลี่ยนแปลงทั้งหมดก่อน commit |

### กลุ่มระบบอัตโนมัติ (Automation)

| คำสั่ง | คำอธิบาย | ตัวอย่างการใช้งาน |
|---|---|---|
| `/loop [interval] [prompt]` | รันคำสั่งเดิมซ้ำตามช่วงเวลาที่กำหนด (alias: `/proactive`) | `/loop 30m ตรวจสอบว่า API endpoint ยังตอบสนองปกติหรือไม่` |
| `/workflows` | ดูและจัดการ multi-agent workflow ที่กำลังรันอยู่เบื้องหลัง | `/workflows` เพื่อตรวจสถานะงานที่มอบหมายให้ subagent หลายตัวพร้อมกัน |
| `/batch <instruction>` | แตกงานเปลี่ยนแปลงขนาดใหญ่ออกเป็นหลาย git worktree เพื่อทำงานแบบขนาน | `/batch อัปเกรด Riverpod เป็นเวอร์ชัน 3.0 ในทุกโมดูล` |
| `/schedule [desc]` | สร้าง agent บนคลาวด์ที่ทำงานตามตารางเวลา (cron routine) | `/schedule รันเทสต์ทุกวันตอนเที่ยงคืน` |

### กลุ่มการตั้งค่าและระบบ (Configuration & System)

| คำสั่ง | คำอธิบาย | ตัวอย่างการใช้งาน |
|---|---|---|
| `/config` | เปิดหน้าต่างการตั้งค่า (alias: `/settings`) | `/config` |
| `/permissions` | ดูหรือแก้ไขสิทธิ์การใช้เครื่องมือของ Claude | `/permissions` เพื่อจำกัดไม่ให้ Claude รันคำสั่ง `rm -rf` โดยไม่ถาม |
| `/mcp` | จัดการ MCP servers และการยืนยันตัวตนผ่าน OAuth | `/mcp` เพื่อเชื่อมต่อ MCP server ของฐานข้อมูลโปรเจกต์ |
| `/agents` | สร้างและจัดการ subagents (ผู้ช่วยเฉพาะทาง) | `/agents` เพื่อสร้าง subagent สำหรับรีวิวโค้ด Flutter โดยเฉพาะ |
| `/hooks` | ตั้งค่า lifecycle hooks (สคริปต์ที่ทำงานอัตโนมัติในจังหวะต่างๆ) | `/hooks` เพื่อตั้งให้รัน `dart format` ทุกครั้งที่แก้ไขไฟล์ |
| `/memory` | แก้ไขไฟล์ CLAUDE.md และเปิด/ปิดระบบ auto-memory | `/memory` เพื่อเพิ่มบริบทเรื่องมาตรฐานโค้ด (ไม่ใส่ semicolon ใน TS/JS) |
| `/init` | สร้างไฟล์ CLAUDE.md เริ่มต้นให้อัตโนมัติจากการสแกนโค้ดในโปรเจกต์ | `/init` เมื่อเริ่มโปรเจกต์ `bla_policy_app` ใหม่ |
| `/cd <path>` | ย้ายเซสชันปัจจุบันไปยังไดเรกทอรีทำงานใหม่ (เพิ่มใน v2.1.169+) | `/cd ../edl-generation-backend` |
| `/add-dir <path>` | เพิ่มไดเรกทอรีทำงานเสริม โดยไม่ต้องย้ายออกจากไดเรกทอรีปัจจุบัน | `/add-dir ../shared-components` |
| `/skills` | แสดงรายการ Agent Skills ที่มีอยู่ในระบบ | `/skills` |
| `/reload-skills` | สแกน skills ใหม่โดยไม่ต้องรีสตาร์ทเซสชัน | ใช้หลังเพิ่ม SKILL.md ใหม่ในโฟลเดอร์: `/reload-skills` |
| `/plugin` | จัดการปลั๊กอิน (ติดตั้ง/เปิด/ปิด) | `/plugin` |
| `/voice` | เปิด/ปิดโหมดพูดสั่งงานแบบ push-to-talk | `/voice` |
| `/status` | แสดงเวอร์ชัน โมเดลที่ใช้ บัญชี และสถานะการเชื่อมต่อ | `/status` |
| `/usage` | แสดงขีดจำกัดของแพ็กเกจและค่าใช้จ่ายแยกตามหมวดหมู่ (alias: `/cost`) | `/usage` เพื่อตรวจสอบว่าใช้โควตาไปเท่าไรแล้วในเดือนนี้ |
| `/doctor` | วินิจฉัยปัญหาการติดตั้งและการตั้งค่า | `/doctor` เมื่อ Claude Code ทำงานผิดปกติหลังอัปเดต |
| `/login` | เข้าสู่ระบบหรือสลับบัญชี Anthropic | `/login` |
| `/help` | แสดงรายการคำสั่งทั้งหมดที่ใช้งานได้ | `/help` |

---

## 🎯 เทมเพลตคำสั่งกำหนดเอง (Custom Slash Command Templates)

นอกจากคำสั่งที่มีมาให้ Claude Code ยังรองรับการสร้างคำสั่ง Slash Command ของตัวเอง โดยสร้างเป็นไฟล์ Markdown เก็บไว้ในโฟลเดอร์ที่กำหนด

### 1) คำสั่งระดับโปรเจกต์แบบพื้นฐาน (Basic Project Command)

สร้างคำสั่งเฉพาะโปรเจกต์แบบง่ายที่สุด — พิมพ์ข้อความคำสั่งไว้ในไฟล์ แล้วเรียกใช้ด้วย `/optimize`

📁 บันทึกไว้ที่: `.claude/commands/optimize.md`

```
Analyze this code for performance issues and suggest optimizations:
```

> **คำอธิบาย:** เมื่อพิมพ์ `/optimize` Claude จะนำเนื้อหาในไฟล์นี้มาใช้เป็นคำสั่งทันที เหมาะสำหรับงานที่ทำซ้ำบ่อยในโปรเจกต์เดียว เช่น ให้ตรวจสอบ performance ของโค้ด Flutter ในหลักสูตร EDL-Generation

### 2) คำสั่งส่วนตัวใช้ได้ทุกโปรเจกต์ (Personal Command)

คำสั่งที่เก็บไว้ในโฟลเดอร์ผู้ใช้ (user-wide) จะใช้ได้กับทุกโปรเจกต์ที่เปิดด้วย Claude Code บนเครื่องนั้น

📁 บันทึกไว้ที่: `~/.claude/commands/security-review.md`

```
Review this code for security vulnerabilities:
```

> **คำอธิบาย:** เหมาะกับคำสั่งที่อาจารย์ใช้ประจำในทุกโปรเจกต์ที่สอน เช่น การตรวจสอบความปลอดภัยของ API ก่อนสาธิตให้ผู้เรียนดู

### 3) คำสั่งที่รับอาร์กิวเมนต์ทั้งหมด (Command with All Arguments)

ใช้ตัวแปร `$ARGUMENTS` เพื่อรับข้อความทั้งหมดที่พิมพ์ตามหลังชื่อคำสั่ง

📁 บันทึกไว้ที่: `.claude/commands/fix-issue.md`

```
Fix issue #$ARGUMENTS following our coding standards
```

> **ตัวอย่างการเรียกใช้:** พิมพ์ `/fix-issue 123` แล้ว `$ARGUMENTS` จะถูกแทนที่ด้วย `123` โดยอัตโนมัติ

### 4) คำสั่งที่รับอาร์กิวเมนต์แบบระบุตำแหน่ง (Command with Positional Arguments)

ใช้ `$1`, `$2`, `$3` เพื่อรับอาร์กิวเมนต์แยกทีละตัวตามลำดับ พร้อมกำหนด metadata ด้วย YAML frontmatter

📁 บันทึกไว้ที่: `.claude/commands/review-pr.md`

```yaml
---
argument-hint: [pr-number] [priority] [assignee]
description: Review pull request with priority and assignee
---

Review PR #$1 with priority $2 and assign to $3.
Focus on security, performance, and code style.
```

> **ตัวอย่างการเรียกใช้:** `/review-pr 88 high สามิตร` → `$1` = 88, `$2` = high, `$3` = สามิตร

### 5) คำสั่ง Git Commit (Git Commit Command)

เทมเพลตขั้นสูงที่รันคำสั่ง Bash ก่อนแล้วนำผลลัพธ์มาประกอบเป็นบริบทให้ Claude ใช้ตัดสินใจ

📁 บันทึกไว้ที่: `.claude/commands/commit.md`

```yaml
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
argument-hint: [message]
description: Create a git commit
---

## Context

- Current git status: !`git status`
- Current git diff: !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task

Based on the above changes, create a single git commit.
```

> **คำอธิบาย:** เครื่องหมาย `` !`command` `` คือการรันคำสั่ง Bash ก่อนแล้วแทรกผลลัพธ์เข้าไปในบริบท ส่วน `allowed-tools` ใช้จำกัดว่าให้ Claude เรียกใช้เครื่องมือใดได้บ้างเพื่อความปลอดภัย เหมาะกับการ commit โค้ดใน branch `day1`/`day2` ของโปรเจกต์ `bla_policy_app`

### 6) คำสั่งที่กำหนดโมเดลเฉพาะ (Command with Model Override)

ระบุโมเดลเฉพาะให้ใช้กับคำสั่งนี้ และปิดการเรียกใช้อัตโนมัติโดย Claude (ต้องพิมพ์เรียกเองเท่านั้น)

📁 บันทึกไว้ที่: `.claude/commands/deep-analysis.md`

```yaml
---
description: Perform deep code analysis
model: claude-opus-4-8
disable-model-invocation: true
---

Perform a comprehensive analysis of this codebase focusing on:
- Architecture patterns
- Potential scalability issues
- Security vulnerabilities
- Performance bottlenecks
```

> **คำอธิบาย:** `model: claude-opus-4-8` บังคับให้คำสั่งนี้ใช้ Opus เสมอไม่ว่ากำลังใช้โมเดลอะไรอยู่ ส่วน `disable-model-invocation: true` ป้องกันไม่ให้ Claude เรียกคำสั่งนี้เองโดยอัตโนมัติ ต้องให้ผู้ใช้พิมพ์ `/deep-analysis` เท่านั้น

---

## 💡 เคล็ดลับการใช้งาน (Usage Tips)

| หัวข้อ | รายละเอียด |
|---|---|
| **คำสั่งระดับโปรเจกต์** | เก็บไว้ในโฟลเดอร์ `.claude/commands/` — ใช้ร่วมกับทีมได้ (commit เข้า git) |
| **คำสั่งส่วนตัว** | เก็บไว้ในโฟลเดอร์ `~/.claude/commands/` — ใช้ได้กับทุกโปรเจกต์บนเครื่องของตัวเอง |
| **การรับอาร์กิวเมนต์** | ใช้ตัวแปร `$ARGUMENTS` สำหรับรับค่าทั้งหมดแบบไม่แยกส่วน |
| **การรันคำสั่ง Bash ล่วงหน้า** | ใช้รูปแบบ `` !`command` `` เพื่อรันคำสั่งก่อนแล้วนำผลลัพธ์มาใช้ประมวลผล |
| **การอ้างอิงไฟล์** | ใช้ `@filename` เพื่อดึงเนื้อหาของไฟล์นั้นเข้ามาในบริบท |
| **คำสั่งจาก MCP** | รูปแบบ: `/mcp__server__prompt_name` เช่นเรียก prompt จาก MCP server ที่เชื่อมต่อไว้ |

---

## สรุปสำหรับการนำไปใช้สอน

หมวดคำสั่งนี้เหมาะมากสำหรับใช้อธิบายในคอร์สที่เกี่ยวกับ Claude Code เช่น หลักสูตรที่มีการสอนการทำงานร่วมกับ AI Agent เพราะครอบคลุมตั้งแต่การจัดการบทสนทนาพื้นฐาน (`/clear`, `/compact`, `/rewind`) ไปจนถึงการสร้างคำสั่งกำหนดเองสำหรับ workflow เฉพาะทางของแต่ละทีม (custom slash commands) ซึ่งสามารถนำไปประยุกต์ใช้กับ workflow การสอน Flutter/Laravel ของอาจารย์ได้โดยตรง เช่น การสร้างคำสั่ง `/riverpod-check` เพื่อตรวจสอบ provider chain โดยเฉพาะ

---

*แหล่งที่มา: [Claude Code 2.1 Cheatsheet — awesomeclaude.ai](https://awesomeclaude.ai/code-cheatsheet) (ข้อมูล ณ วันที่ 12 มิถุนายน 2026)*
