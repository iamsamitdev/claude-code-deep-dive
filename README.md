# Claude Code Deep Dive

หลักสูตรอบรมออนไลน์ (สอนสด) **"Claude Code มือโปร: ดำน้ำลึกสู่ Production"** โดยสถาบันไอทีจีเนียส เอ็นจิเนียริ่ง — รวมเนื้อหา 15 ชั่วโมง สอนการใช้งาน Claude Code ในระดับมือโปร ผ่านการพัฒนาโปรเจกต์จริง **"ระบบคลังสินค้าเบิกจ่าย (StockApp)"** ด้วย Next.js, Prisma และ PostgreSQL ตั้งแต่ Vibe Coding ไปจนถึง Production

## เกี่ยวกับหลักสูตร

หลักสูตรนี้พาผู้เรียนเจาะลึก Claude Code ในฐานะ **Agentic Coding Tool** ครอบคลุมตั้งแต่การวาง `CLAUDE.md` เป็น Project Memory, การบริหาร Context, Custom Slash Commands, การออกแบบ Sub-agents เฉพาะทาง (Code Reviewer, Test Writer, Security Auditor), การต่อ MCP และ Hooks, การทำงานร่วมกันเป็นทีมผ่าน Git ไปจนถึงการ Containerize ด้วย Docker, วาง CI/CD ด้วย GitHub Actions และ Deploy ขึ้น VPS Ubuntu จริงพร้อม Nginx และ HTTPS

- **วิทยากร:** อาจารย์สามิตร โกยม | IT Genius Engineering Co., Ltd.
- **รูปแบบ:** สอนสดออนไลน์ผ่าน Zoom Meeting พร้อมวิดีโอบันทึกย้อนหลัง
- **ระยะเวลา:** รวม 5 วัน (วันที่ 4-5, 11-12 และ 18 กรกฎาคม 2569) เวลา 20:30–23:30 น.

รายละเอียดหลักสูตรฉบับเต็มดูได้ที่ [Outlines/claude-code-pro-deep-dive-to-production-course.md](Outlines/claude-code-pro-deep-dive-to-production-course.md)

## โครงสร้างโปรเจกต์

```
README.md
Notes/               # สรุปเนื้อหาการอบรมรายวัน
  Day1_note.md
  Day2_note.md
  Day3_note.md
  Day4_note.md
  Day5_note.md
  Bonus_AgentFlow_note.md
Outlines/            # เอกสารแนะนำภาพรวมหลักสูตร
  claude-code-pro-deep-dive-to-production-course.md
Presentations/       # สไลด์ประกอบการสอน (PDF)
```

## เนื้อหาบันทึกการอบรม (Notes)

| ไฟล์ | เนื้อหา |
| --- | --- |
| [Notes/Day1_note.md](Notes/Day1_note.md) | ปูพื้น Claude Code ระดับมือโปร และตั้งต้นระบบคลังสินค้าด้วย Next.js |
| [Notes/Day2_note.md](Notes/Day2_note.md) | เนื้อหาการอบรมวันที่ 2 |
| [Notes/Day3_note.md](Notes/Day3_note.md) | เนื้อหาการอบรมวันที่ 3 |
| [Notes/Day4_note.md](Notes/Day4_note.md) | เนื้อหาการอบรมวันที่ 4 |
| [Notes/Day5_note.md](Notes/Day5_note.md) | เนื้อหาการอบรมวันที่ 5 |
| [Notes/Bonus_AgentFlow_note.md](Notes/Bonus_AgentFlow_note.md) | Bonus Module: สร้าง Multi-Agent Dashboard ด้วย Claude Agent SDK (AgentFlow) |

## สไลด์ประกอบการสอน

โฟลเดอร์ [Presentations](Presentations/) เก็บไฟล์ PDF สไลด์ประกอบการสอนของแต่ละวัน

## ผู้เรียนต้องมีพื้นฐานอะไรบ้าง

- มีพื้นฐานการเขียนเว็บด้วย JavaScript / TypeScript หรือ React มาบ้าง
- เข้าใจแนวคิดของฐานข้อมูลเชิงสัมพันธ์ (Relational Database) เบื้องต้น
- เคยใช้งานคำสั่งพื้นฐานบน Command Line / Terminal และ Git
- ไม่จำเป็นต้องเคยใช้ Claude Code, Sub-agent, Docker, CI/CD หรือ Linux Server มาก่อน
- มีคอมพิวเตอร์ส่วนตัว (Windows, macOS หรือ Linux) และบัญชี Claude ที่ใช้งาน Claude Code ได้ (Pro/Max หรือ API)
