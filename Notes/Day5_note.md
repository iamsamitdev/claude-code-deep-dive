# หลักสูตร Claude Code มือโปร: ดำน้ำลึกสู่ Production — วันที่ 5

## Deploy สู่ Production จริงด้วย VPS Ubuntu, Nginx และ CD อัตโนมัติ

**วันที่อบรม:** วันเสาร์ที่ 18 กรกฎาคม 2569 | เวลา 20:30–23:30 น.
**รูปแบบ:** อบรมออนไลน์ (สอนสด) ผ่าน Zoom Meeting
**วิทยากร:** อาจารย์สามิตร โกยม | IT Genius Engineering Co., Ltd.

---

## บทนำ

วันที่ 5 คือวันสุดท้ายและหัวใจสำคัญที่สุดของหลักสูตร วันที่เราพา **StockApp** ออกจากเครื่อง dev ไปยืนบน internet จริง ผู้ใช้ทั่วโลกเปิดได้ผ่าน `https://stock.itgenius.app`

ใน 4 วันที่ผ่านมา เราสร้างระบบ Next.js 16 + Prisma + PostgreSQL Containerize ด้วย Docker และ push image ขึ้น **ghcr.io** ผ่าน GitHub Actions แล้ว วันนี้เราจะทำ 5 เรื่องใหญ่:

1. **เตรียม VPS Ubuntu** — Firewall, SSH key, security hardening
2. **ติดตั้ง Docker บน server** และนำระบบขึ้น production
3. **ตั้ง Nginx** เป็น Reverse Proxy + gzip + header ที่ถูกต้อง
4. **ผูกโดเมน + HTTPS** ด้วย Let's Encrypt (Certbot) ฟรี 100%
5. **CD อัตโนมัติ** ผ่าน GitHub Actions + SSH + docker compose pull

สไตล์ของวันนี้คือ **Vibe Coding** — คุณไม่ได้พิมพ์สคริปต์ หรือ config file เอง แต่ **สั่ง Claude Code ด้วย prompt** แล้วทำหน้าที่ **ตรวจสอบ (review)** ผลลัพธ์ก่อนรันบน server จริงทุกครั้ง

> ⚠️ **คำเตือนสำคัญ:** บน production ต้อง review ทุกคำสั่งและทุกไฟล์ที่ Claude เสนอก่อนรันเสมอ อย่าใช้ `bypassPermissions` บน server จริงเด็ดขาด — ผิดพลาดบน production หมายถึง downtime จริง

---

## ทบทวน Spec ก่อนเริ่ม: วันนี้คือ Phase 5 — Production

วันสุดท้ายแล้ว ก่อนพา StockApp ขึ้น internet จริง เราเปิด `docs/spec.md` ที่สร้างไว้วันที่ 1 ขึ้นมาทบทวน Phase สุดท้าย แล้วใช้เป็นฐานสั่งงาน Claude Code

### 🛠️ ขั้นตอนเปิดวัน: โหลด spec แล้วล็อกขอบเขต Phase 5

**💬 Prompt ที่ใช้สั่ง Claude Code:**

```
/clear
อ่าน @docs/spec.md แล้วสรุปสั้น ๆ ว่า Phase 5 (Production) มีงานย่อยอะไรบ้าง
ยืนยันว่า Phase 1-4 เสร็จครบแล้ว จากนั้นรอให้ฉันสั่งทำทีละงาน อย่าเพิ่งลงมือ
```

**🤖 Claude Code จะทำอะไร:** Claude จะอ่าน `docs/spec.md` ดึงเฉพาะหัวข้อ Phase 5 มาสรุปเป็น checklist และยังไม่แตะไฟล์จนกว่าเราจะสั่ง

**✅ Checkpoint ตรวจสอบ:**

- งานที่ Claude สรุปตรงกับ Phase 5 ใน spec ไหม (VPS + SSH/UFW/hardening, Nginx reverse proxy, HTTPS Let's Encrypt, CD อัตโนมัติ, backup/rollback/monitoring)
- งานวันนี้แตะ production จริง — review ทุกคำสั่งที่ Claude เสนอก่อนรันเสมอ และอย่าใช้ `bypassPermissions` บน server จริง

> **Key Concept:** spec ที่สมบูรณ์ตั้งแต่วันแรกทำให้ Phase สุดท้าย (Deploy) ไม่ใช่เรื่องน่ากลัว — เพราะทุกอย่างถูกวางแผนและสร้างมาเพื่อ Production ตั้งแต่ต้น

---

## สถาปัตยกรรม Production (ภาพรวม)

```
Internet
    │
    │ HTTPS :443  /  HTTP :80 (redirect → 443)
    ▼
┌─────────────────────────────────────┐
│  Nginx (Reverse Proxy)              │
│  /etc/nginx/sites-available/stock-app│
│  SSL: /etc/letsencrypt/live/...     │
└──────────────────┬──────────────────┘
                   │ proxy_pass http://localhost:3000
                   ▼
┌─────────────────────────────────────┐
│  Docker Compose (on VPS)            │
│  ┌──────────────────────────────┐   │
│  │  Next.js 16 (standalone)     │   │
│  │  Container  :3000            │   │
│  └──────────────┬───────────────┘   │
│                 │ Prisma ORM        │
│  ┌──────────────▼───────────────┐   │
│  │  PostgreSQL Container        │   │
│  │  :5432 (internal only)       │   │
│  └──────────────────────────────┘   │
│  Volume: postgres_data              │
└─────────────────────────────────────┘
         VPS Ubuntu (IP: x.x.x.x)
         Domain: stock.itgenius.app
```

> **Key Concept:** Nginx ทำหน้าที่รับ request จาก internet (port 80/443) แล้วส่งต่อ (proxy_pass) ไปยัง Next.js container ที่วิ่งอยู่บน port 3000 Next.js ไม่ได้เปิดหา internet โดยตรง ปลอดภัยกว่า และ Nginx ยังช่วยด้าน SSL, compression, header, caching ด้วย

---

## Module 5.1: เตรียม VPS Ubuntu

### สิ่งที่ต้องมีก่อนเริ่ม

| รายการ | รายละเอียด |
|---|---|
| **VPS** | Ubuntu 22.04 LTS หรือ 24.04 LTS (แนะนำ) |
| **RAM** | อย่างน้อย 2 GB (แนะนำ 4 GB) |
| **Storage** | อย่างน้อย 20 GB |
| **IP สาธารณะ** | IPv4 static IP |
| **โดเมน** | stock.itgenius.app ชี้ A record มาที่ IP นี้ |
| **SSH Client** | Terminal บน Mac/Linux หรือ Windows Terminal / PuTTY |

---

### 🛠️ ขั้นตอนที่ 1: ร่างสคริปต์ Setup VPS ทั้งหมดในคำสั่งเดียว

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยร่างสคริปต์ bash ชื่อ setup-vps.sh สำหรับ VPS Ubuntu 24.04 ใหม่เอี่ยม
ให้ทำสิ่งเหล่านี้ตามลำดับ:
1. สร้าง user ชื่อ deploy และเพิ่มเข้ากลุ่ม sudo
2. สร้างโฟลเดอร์ .ssh และวาง public key placeholder ลงใน authorized_keys
3. ตั้ง permission ที่ถูกต้องให้ .ssh (700) และ authorized_keys (600)
4. ตั้งค่า UFW: อนุญาต OpenSSH, 80/tcp, 443/tcp แล้ว enable
5. ติดตั้ง fail2ban และตั้งค่า [sshd] ให้ maxretry=5 bantime=3600 findtime=600
6. แก้ไข /etc/ssh/sshd_config: ปิด PermitRootLogin, PasswordAuthentication
   เปิด PubkeyAuthentication
7. restart sshd และ enable fail2ban

เพิ่ม comment ภาษาไทยอธิบายแต่ละขั้นตอน และเพิ่ม echo แสดงสถานะระหว่างรัน
บันทึกเป็นไฟล์ setup-vps.sh
```

**🤖 Claude Code จะทำอะไร:** Claude จะร่างสคริปต์ `setup-vps.sh` พร้อม comment ภาษาไทยและ echo แสดงสถานะ ครอบคลุมทุกขั้นตอนตั้งแต่ user management จนถึง firewall และ SSH hardening เราเอาไปตรวจดูก่อนแล้วค่อย copy ไปรันบน server

**✅ Checkpoint ตรวจสอบ:**
- ตรวจว่า `sudo ufw allow OpenSSH` อยู่ **ก่อน** `sudo ufw enable` เสมอ ไม่งั้นล็อกตัวเองออก
- ตรวจ `PermitRootLogin no` และ `PasswordAuthentication no` ถูกต้องในไฟล์ sshd_config
- ตรวจว่ามี `PubkeyAuthentication yes` และ `AuthorizedKeysFile .ssh/authorized_keys`
- ต้องแน่ใจว่า key login ทดสอบผ่านแล้วก่อน restart sshd

```bash
# คำสั่งตรวจสอบผล — รันหลังจาก script เสร็จ
sudo ufw status verbose
sudo systemctl status sshd
sudo systemctl status fail2ban
sudo fail2ban-client status sshd
```

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ UFW ที่ควรได้ (ไว้เทียบ):**
```bash
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
OpenSSH (v6)               ALLOW IN    Anywhere (v6)
80/tcp (v6)                ALLOW IN    Anywhere (v6)
443/tcp (v6)               ALLOW IN    Anywhere (v6)
```

---

### 🛠️ ขั้นตอนที่ 2: สร้าง SSH Key Pair และ Config บนเครื่อง Local

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยร่างคำสั่งและไฟล์ที่ต้องทำบนเครื่อง local ของฉัน (macOS/Linux) สำหรับ:
1. สร้าง SSH key pair แบบ ED25519 บันทึกที่ ~/.ssh/stock_app_deploy
   comment ว่า "deploy@stock-app"
2. แสดงคำสั่งดู public key เพื่อ copy ไปวางบน server
3. สร้างไฟล์ ~/.ssh/config สำหรับ alias "stockapp"
   ที่ชี้ไปยัง YOUR_SERVER_IP, user=deploy, key=stock_app_deploy, port=22
4. อธิบายว่า authorized_keys คืออะไรและทำงานอย่างไร

แสดงผลเป็น step-by-step พร้อม comment ภาษาไทย
```

**🤖 Claude Code จะทำอะไร:** Claude ร่างคำสั่ง `ssh-keygen`, ตัวอย่างเนื้อหาไฟล์ `~/.ssh/config` พร้อมอธิบายหลักการ Public Key Authentication ให้ผู้เรียนเข้าใจก่อนลงมือทำ

**✅ Checkpoint ตรวจสอบ:**
- ไฟล์ private key (`~/.ssh/stock_app_deploy`) ต้องมี permission `600` เท่านั้น
- ทดสอบ `ssh -i ~/.ssh/stock_app_deploy deploy@YOUR_SERVER_IP` ให้ผ่านก่อนปิด root login
- ทดสอบ `ssh stockapp` ผ่าน alias ว่าเข้าได้จริง

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```bash
# สร้าง SSH key
ssh-keygen -t ed25519 -C "deploy@stock-app" -f ~/.ssh/stock_app_deploy
# ได้ 2 ไฟล์:
# ~/.ssh/stock_app_deploy      ← private key (ห้ามแชร์ใคร!)
# ~/.ssh/stock_app_deploy.pub  ← public key (ส่งให้ server)
```

```
# ~/.ssh/config
Host stockapp
    HostName YOUR_SERVER_IP
    User deploy
    IdentityFile ~/.ssh/stock_app_deploy
    Port 22
```

> ⚠️ **จุดอันตราย:** Private key คือกุญแจที่สำคัญที่สุด ห้ามใส่ใน code, commit ลง git, หรือแชร์ทางอื่นใดเด็ดขาด ใช้ GitHub Secrets ในการส่งต่อเท่านั้น

---

### 🛠️ ขั้นตอนที่ 3: ร่าง fail2ban Config

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยอธิบายและร่าง config สำหรับ fail2ban ส่วน [sshd] ใน jail.local
ต้องการ:
- maxretry = 5 (โดน ban หลัง login ผิด 5 ครั้ง)
- bantime = 3600 (ban 1 ชั่วโมง)
- findtime = 600 (นับภายใน 10 นาที)
- logpath สำหรับ Ubuntu 24.04

พร้อมอธิบายว่า fail2ban ทำงานอย่างไร และคำสั่งตรวจสอบสถานะหลังติดตั้ง
```

**🤖 Claude Code จะทำอะไร:** Claude ร่าง config ส่วน `[sshd]` ของไฟล์ `jail.local` พร้อมอธิบายกลไก detection ของ fail2ban และคำสั่งตรวจสอบ IP ที่ถูก ban

**✅ Checkpoint ตรวจสอบ:**
- `sudo systemctl status fail2ban` ต้อง active (running)
- `sudo fail2ban-client status sshd` แสดง Banned IP ว่างในตอนแรก (ดี)
- ตรวจ logpath ถูก path (`/var/log/auth.log` สำหรับ Ubuntu)

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```ini
[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 5
bantime  = 3600
findtime = 600
```

---

## Module 5.2: ติดตั้ง Docker บน Server และ Deploy ระบบ

### แนวคิด: ทำไมต้อง Pull Image จาก ghcr.io ไม่ Build บน Server?

การ build บน server จริงมีข้อเสียหลายอย่าง — ใช้ RAM/CPU สูง, เวลานาน, ผลลัพธ์อาจต่างจาก dev environment ดังนั้นเราจึง **build ครั้งเดียวบน GitHub Actions** แล้ว push ขึ้น ghcr.io จากนั้น server แค่ `docker pull` มาใช้ — image เดียวกัน, ผลลัพธ์เดียวกัน ทุก environment

---

### 🛠️ ขั้นตอนที่ 4: ร่างสคริปต์ติดตั้ง Docker Engine บน Ubuntu

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยร่างคำสั่งติดตั้ง Docker Engine + Compose Plugin บน Ubuntu 24.04
ตามวิธีการ official จาก Docker docs (ไม่ใช้ snap)
ขั้นตอน:
1. ติดตั้ง dependencies และเพิ่ม Docker GPG key
2. เพิ่ม Docker apt repository
3. ติดตั้ง docker-ce, docker-ce-cli, containerd.io,
   docker-buildx-plugin, docker-compose-plugin
4. เพิ่ม user deploy เข้ากลุ่ม docker
5. คำสั่งทดสอบว่าติดตั้งสำเร็จ

เพิ่ม comment ภาษาไทยทุกขั้นตอน
```

**🤖 Claude Code จะทำอะไร:** Claude ร่างคำสั่งติดตั้ง Docker แบบ step-by-step ตาม official method พร้อม comment อธิบาย ให้เราตรวจก่อนนำไปรัน ซึ่งช่วยประหยัดเวลาค้นหาจาก docs

**✅ Checkpoint ตรวจสอบ:**
- `docker --version` แสดง version ถูกต้อง
- `docker compose version` แสดง Compose version (v2+)
- `docker run hello-world` รันผ่านโดยไม่ต้อง sudo
- ถ้า hello-world ต้อง sudo แปลว่า user ยังไม่อยู่ใน group docker (ต้อง logout/login ใหม่)

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```bash
docker --version
# Docker version 27.x.x, build xxxxxxx

docker compose version
# Docker Compose version v2.x.x

docker run hello-world
# Hello from Docker!
```

---

### 🛠️ ขั้นตอนที่ 5: ร่าง docker-compose.prod.yml สำหรับ Production

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยร่างไฟล์ docker-compose.prod.yml สำหรับ StockApp production
ที่มี 2 services:
1. db: postgres:16-alpine — ใช้ env vars POSTGRES_USER/PASSWORD/DB
   ต้องมี healthcheck ด้วย pg_isready
   มี volume: postgres_data และอยู่ใน network: app-network
2. app: image จาก ghcr.io/YOUR_GITHUB_USERNAME/stock-app:latest
   ตั้ง env: DATABASE_URL ชี้ไปยัง db:5432, BETTER_AUTH_SECRET,
   BETTER_AUTH_URL=https://stock.itgenius.app, NEXT_PUBLIC_APP_URL=https://stock.itgenius.app, NODE_ENV=production
   port 3000:3000, depends_on db ด้วย condition: service_healthy
   อยู่ใน network: app-network

พร้อมตัวอย่างไฟล์ .env ที่ต้องสร้างบน server (ห้าม commit!)
และคำสั่ง chmod 600 .env ป้องกัน unauthorized access
```

**🤖 Claude Code จะทำอะไร:** Claude ร่างไฟล์ `docker-compose.prod.yml` ที่มี healthcheck, network isolation, volume สำหรับ database persistence พร้อมตัวอย่าง `.env` — เราตรวจค่าทุกอย่างก่อน deploy

**✅ Checkpoint ตรวจสอบ:**
- `image:` ใน app service ชี้ไปยัง ghcr.io ของ repo ถูกต้อง
- `BETTER_AUTH_URL` และ `NEXT_PUBLIC_APP_URL` ต้องเป็น `https://stock.itgenius.app` ห้ามใช้ `http://` ; `BETTER_AUTH_SECRET` ต้องเป็น random ≥ 32 ตัว (`openssl rand -base64 32`)
- ไฟล์ `.env` ต้องมี `chmod 600` และ **ห้าม commit เด็ดขาด**
- `healthcheck` ใน db service ต้อง test ด้วย `pg_isready -U` ตรงกับ POSTGRES_USER

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: ghcr.io/YOUR_GITHUB_USERNAME/stock-app:latest
    restart: always
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: https://stock.itgenius.app
      NEXT_PUBLIC_APP_URL: https://stock.itgenius.app
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
```

---

### 🛠️ ขั้นตอนที่ 6: Pull Image และ Deploy พร้อม Prisma Migrate

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยร่างคำสั่ง step-by-step สำหรับ:
1. Login เข้า ghcr.io ด้วย docker login ผ่าน PAT (Personal Access Token)
2. Pull image ล่าสุดจาก ghcr.io
3. Start docker compose ในโหมด detached (-d)
4. ตรวจสอบว่า container ทั้งหมดขึ้น (ps)
5. รัน prisma migrate deploy ใน app container
6. ดู log 50 บรรทัดล่าสุดของ app
7. ทดสอบด้วย curl http://localhost:3000

อธิบายความต่างระหว่าง prisma migrate deploy กับ prisma migrate dev
```

**🤖 Claude Code จะทำอะไร:** Claude ร่างคำสั่งครบชุดและอธิบาย `prisma migrate deploy` ว่าปลอดภัยสำหรับ production อย่างไร (apply เฉพาะ migration ที่มีอยู่แล้ว ไม่สร้างใหม่)

**✅ Checkpoint ตรวจสอบ:**
- `docker compose -f docker-compose.prod.yml ps` ต้องแสดง `Up` และ `healthy` ทั้ง db และ app
- Log ต้องไม่มี `Error`, `ECONNREFUSED` หรือ `Prisma error`
- `curl http://localhost:3000` ต้องได้ HTTP response (ไม่ใช่ connection refused)

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```bash
# Login ghcr.io
echo "YOUR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull และ start
cd /home/deploy/stock-app
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# ตรวจสอบ
docker compose -f docker-compose.prod.yml ps

# Migrate และ log
docker compose -f docker-compose.prod.yml exec app \
  npx prisma migrate deploy
docker compose -f docker-compose.prod.yml logs app --tail=50

# ทดสอบ
curl http://localhost:3000
```

> **Key Concept:** `prisma migrate deploy` แค่ apply migration files ที่มีอยู่แล้ว ไม่ได้สร้าง migration ใหม่ — เหมาะสำหรับ production เพราะปลอดภัยและ predictable

---

## Module 5.3: Nginx เป็น Reverse Proxy

### Reverse Proxy คืออะไร?

Nginx ทำหน้าที่เป็น "ประตูหน้า" รับ request จาก internet แล้วส่งต่อ (proxy_pass) ไปยัง Next.js ข้อดี:
- Next.js ไม่ต้องเปิด port โดยตรงสู่ internet
- Nginx จัดการ SSL/TLS, gzip compression, caching header ให้
- รองรับ multiple domains บน server เดียว
- WebSocket pass-through สำหรับ Next.js Server Actions

---

### 🛠️ ขั้นตอนที่ 7: ร่าง Nginx Server Block Config สำหรับ stock.itgenius.app

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยร่าง Nginx server block config สำหรับ stock.itgenius.app
ที่ proxy_pass ไปยัง Next.js ที่ localhost:3000
ต้องการ:
- รับ request บน port 80
- gzip compression สำหรับ text, css, js, json, svg
- proxy_pass http://127.0.0.1:3000 พร้อม headers:
  Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto
  และ Upgrade/Connection สำหรับ WebSocket
- timeout 60s สำหรับ connect, send, read
- location /_next/static/ ตั้ง expires 1y และ Cache-Control immutable
- location /public/ ตั้ง expires 7d

บันทึกเป็น /etc/nginx/sites-available/stock-app
พร้อมคำสั่ง symlink, ลบ default, nginx -t, และ reload
```

**🤖 Claude Code จะทำอะไร:** Claude ร่าง nginx config ครบถ้วนพร้อม comment อธิบาย header แต่ละตัว และคำสั่งเปิดใช้งาน config — เราตรวจก่อน nginx -t แล้วค่อย reload

**✅ Checkpoint ตรวจสอบ:**
- `sudo nginx -t` ต้องได้ `syntax is ok` และ `test is successful`
- ตรวจว่ามี `proxy_set_header X-Forwarded-Proto $scheme` — ขาดตัวนี้อาจเกิด redirect loop
- ตรวจว่า location `/_next/static/` มี `Cache-Control "public, immutable"` ถูกต้อง
- หลัง reload ทดสอบ `curl -I http://stock.itgenius.app` ได้ HTTP 200 หรือ 301

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```nginx
# /etc/nginx/sites-available/stock-app

server {
    listen 80;
    listen [::]:80;
    server_name stock.itgenius.app;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_connect_timeout  60s;
        proxy_send_timeout     60s;
        proxy_read_timeout     60s;
        proxy_buffering    on;
        proxy_buffer_size  4k;
        proxy_buffers      8 4k;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static/ {
        proxy_pass         http://127.0.0.1:3000/_next/static/;
        proxy_set_header   Host $host;
        expires            1y;
        add_header         Cache-Control "public, immutable";
    }

    location /public/ {
        proxy_pass         http://127.0.0.1:3000/public/;
        proxy_set_header   Host $host;
        expires            7d;
        add_header         Cache-Control "public";
    }
}
```

```bash
# เปิดใช้งาน
sudo ln -s /etc/nginx/sites-available/stock-app \
           /etc/nginx/sites-enabled/stock-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

ผลลัพธ์ที่ดีจาก `nginx -t`:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

## Module 5.4: โดเมนและ HTTPS ด้วย Let's Encrypt

### Let's Encrypt คืออะไร?

Let's Encrypt คือ Certificate Authority (CA) ที่ให้ SSL certificate **ฟรี** โดย Certbot เป็น tool ที่ช่วย:
1. ยืนยันว่าเราเป็นเจ้าของ domain จริง (ผ่าน HTTP challenge)
2. ออก certificate อัตโนมัติ
3. แก้ไข nginx config เพิ่ม HTTPS ให้เลย
4. ตั้ง systemd timer renew certificate ทุก ~60 วัน (หมดอายุทุก 90 วัน)

---

### 🛠️ ขั้นตอนที่ 8: ตั้ง DNS A Record และตรวจสอบการ Propagate

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยอธิบายขั้นตอนการตั้ง DNS A record สำหรับ stock.itgenius.app
ชี้ไปยัง VPS IP address และวิธีตรวจสอบว่า DNS propagate แล้ว
ด้วยคำสั่ง nslookup และ dig บน Linux/macOS
พร้อมบอกว่าต้องรอนานแค่ไหน และทำไม Certbot ถึงต้องให้ DNS ชี้ถูกก่อน
```

**🤖 Claude Code จะทำอะไร:** Claude อธิบาย DNS propagation และคำสั่งตรวจสอบ ช่วยให้ผู้เรียนเข้าใจว่าต้องรอ DNS ก่อนจึงจะรัน Certbot ได้ ไม่งั้น challenge จะ fail

**✅ Checkpoint ตรวจสอบ:**
- `nslookup stock.itgenius.app` ต้องแสดง IP ของ VPS เราถูกต้อง
- `dig stock.itgenius.app +short` ต้องได้ IP เดียวกัน
- ถ้ายังไม่ชี้ ให้รอ 5–30 นาที (TTL ที่ตั้งไว้)

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```bash
nslookup stock.itgenius.app
# Server: ...
# Address: ...
# Name: stock.itgenius.app
# Address: YOUR_SERVER_IP

dig stock.itgenius.app +short
# YOUR_SERVER_IP
```

---

### 🛠️ ขั้นตอนที่ 9: ออกใบรับรอง SSL ด้วย Certbot

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยร่างคำสั่งและขั้นตอนการติดตั้ง Certbot + plugin สำหรับ Nginx บน Ubuntu
และรัน certbot --nginx สำหรับ domain stock.itgenius.app
อธิบาย:
1. Certbot จะถามอะไรบ้างและควรตอบอะไร
2. Certbot แก้ไข nginx config อย่างไร (redirect HTTP → HTTPS)
3. คำสั่งทดสอบ auto-renew แบบ dry-run
4. ตรวจสอบ systemd timer ของ Certbot

พร้อมแสดง nginx config หลัง Certbot แก้ไขให้ที่มี ssl_certificate, ssl_certificate_key
และ redirect 301 จาก port 80 ไป 443
```

**🤖 Claude Code จะทำอะไร:** Claude ร่างคำสั่ง Certbot และแสดง nginx config ฉบับสมบูรณ์หลัง SSL พร้อมอธิบายทุกส่วน — เราตรวจ config ก่อน reload nginx

**✅ Checkpoint ตรวจสอบ:**
- `sudo certbot renew --dry-run` ต้องแสดง `simulated renewals succeeded`
- เปิด `https://stock.itgenius.app` ใน browser ต้องมี padlock icon
- ตรวจ `sudo systemctl status certbot.timer` ต้อง active
- ทดสอบ `curl -I http://stock.itgenius.app` ต้องได้ `301 Moved Permanently` ไป HTTPS

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d stock.itgenius.app
```

nginx config หลัง Certbot แก้ไขให้:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name stock.itgenius.app;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name stock.itgenius.app;

    ssl_certificate     /etc/letsencrypt/live/stock.itgenius.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stock.itgenius.app/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain text/css text/xml text/javascript
        application/json application/javascript
        application/xml+rss image/svg+xml;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_connect_timeout  60s;
        proxy_send_timeout     60s;
        proxy_read_timeout     60s;
        proxy_buffering    on;
        proxy_buffer_size  4k;
        proxy_buffers      8 4k;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static/ {
        proxy_pass         http://127.0.0.1:3000/_next/static/;
        proxy_set_header   Host $host;
        expires            1y;
        add_header         Cache-Control "public, immutable";
    }

    location /public/ {
        proxy_pass         http://127.0.0.1:3000/public/;
        proxy_set_header   Host $host;
        expires            7d;
        add_header         Cache-Control "public";
    }
}
```

> **Key Concept:** Let's Encrypt certificate อายุ 90 วัน Certbot ตั้ง systemd timer renew อัตโนมัติทุก ~60 วัน ตราบใดที่ server เปิดอยู่และ DNS ยังชี้ถูก ไม่ต้องทำอะไรเพิ่ม

---

## Module 5.5: CD อัตโนมัติ + ดูแลระบบ

### สถาปัตยกรรม CD Pipeline

```
Developer เขียนโค้ดบนเครื่อง local
    │
    │  git push origin main
    ▼
GitHub Repository
    │
    │  GitHub Actions trigger
    ▼
  CI Job: Build & Test
  - docker buildx build
  - run tests
  - docker push → ghcr.io
    │
    │  CD Job: Deploy
    ▼
  appleboy/ssh-action
  SSH เข้า VPS Ubuntu
  - docker compose pull
  - docker compose up -d
  - prisma migrate deploy
    │
    ▼
VPS Ubuntu (stock.itgenius.app)
  Nginx :443 → Next.js :3000 → PostgreSQL :5432
    │
    ▼
ผู้ใช้ทั่วโลกเปิดเว็บได้ผ่าน HTTPS
```

---

### 🛠️ ขั้นตอนที่ 10: ร่าง GitHub Actions Workflow สำหรับ CD (deploy.yml)

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยร่างไฟล์ .github/workflows/deploy.yml สำหรับ CI/CD Pipeline ของ StockApp
ที่ trigger เมื่อ push ไปยัง branch main

ต้องการ 2 jobs:
Job 1 - build-and-push:
- checkout, setup docker buildx
- login เข้า ghcr.io ด้วย GITHUB_TOKEN
- ใช้ docker/metadata-action สร้าง tags: sha-short และ latest
- build และ push image ด้วย cache (type=gha)
- output image_tag ออกมา

Job 2 - deploy (ต้องการ build-and-push สำเร็จก่อน):
- ใช้ environment: production
- ใช้ appleboy/ssh-action@v1.0.3 SSH เข้า VPS
  host จาก secrets.VPS_HOST
  user จาก secrets.VPS_USER
  key จาก secrets.VPS_SSH_PRIVATE_KEY
- script:
  set -e
  cd /home/deploy/stock-app
  login ghcr.io ด้วย GHCR_PAT
  docker compose pull
  docker compose up -d --remove-orphans
  docker compose exec -T app npx prisma migrate deploy
  docker image prune -f
  docker compose ps

พร้อมตารางแสดง GitHub Secrets ที่ต้องตั้งค่าและวิธี copy private key
บันทึกเป็น .github/workflows/deploy.yml
```

**🤖 Claude Code จะทำอะไร:** Claude สร้างไฟล์ `deploy.yml` ครบสมบูรณ์และตารางรายการ Secrets ที่ต้องตั้งค่าใน GitHub — เราตรวจ YAML syntax และ secret names ก่อน commit

**✅ Checkpoint ตรวจสอบ:**
- `set -e` ต้องอยู่ตอนต้น script เพื่อหยุดทันทีถ้า command ใดล้มเหลว
- ตรวจว่า `docker compose exec -T` มี `-T` (ไม่มี TTY ใน CI environment)
- Secrets ใน GitHub ตั้งครบ: `VPS_HOST`, `VPS_USER`, `VPS_SSH_PRIVATE_KEY`, `GHCR_PAT`, `GHCR_USERNAME`
- Environment `production` ถูกสร้างใน GitHub repo settings

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline — StockApp

on:
  push:
    branches:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository_owner }}/stock-app

jobs:
  build-and-push:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
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
            type=sha,format=short
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Production VPS
    runs-on: ubuntu-latest
    needs: build-and-push
    environment: production

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_PRIVATE_KEY }}
          port: 22
          script: |
            set -e

            echo "==> Navigating to app directory"
            cd /home/deploy/stock-app

            echo "==> Logging in to ghcr.io"
            echo "${{ secrets.GHCR_PAT }}" | \
              docker login ghcr.io -u ${{ secrets.GHCR_USERNAME }} --password-stdin

            echo "==> Pulling latest image"
            docker compose -f docker-compose.prod.yml pull

            echo "==> Starting updated containers"
            docker compose -f docker-compose.prod.yml up -d --remove-orphans

            echo "==> Running database migrations"
            docker compose -f docker-compose.prod.yml exec -T app \
              npx prisma migrate deploy

            echo "==> Removing unused images"
            docker image prune -f

            echo "==> Deploy complete!"
            docker compose -f docker-compose.prod.yml ps
```

ตาราง GitHub Secrets ที่ต้องตั้งค่า:

| Secret Name | ค่า |
|---|---|
| `VPS_HOST` | IP address ของ server เช่น `203.0.113.10` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_PRIVATE_KEY` | เนื้อหาของ `~/.ssh/stock_app_deploy` (private key ทั้งหมด) |
| `GHCR_PAT` | GitHub Personal Access Token (read:packages) |
| `GHCR_USERNAME` | GitHub username ของคุณ |

---

### 🛠️ ขั้นตอนที่ 11: ร่างสคริปต์ Backup ฐานข้อมูล + Cron Job

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยร่างคำสั่งและ cron job สำหรับ backup PostgreSQL ของ StockApp ที่วิ่งใน Docker
โดย:
1. คำสั่ง backup ทันที ใช้ docker compose exec db pg_dump
   บันทึกไฟล์ชื่อ backup_YYYYMMDD_HHMMSS.sql
2. สร้างโฟลเดอร์ /home/deploy/backups
3. cron job รันทุกวันเวลาตี 2 (02:00)
   backup ลงใน /home/deploy/backups/db_YYYYMMDD.sql
4. คำสั่งตรวจสอบว่า cron ทำงานถูกต้อง

อธิบายว่าเหตุใด production ต้องมี backup และควรมี retention policy อย่างไร
```

**🤖 Claude Code จะทำอะไร:** Claude ร่างคำสั่ง pg_dump ผ่าน Docker และ cron entry พร้อมอธิบาย retention policy — เราตรวจ cron syntax และ path ก่อน apply

**✅ Checkpoint ตรวจสอบ:**
- ทดสอบคำสั่ง backup ด้วยมือก่อนว่าไฟล์ .sql ถูกสร้างจริง
- ตรวจ cron entry ด้วย `crontab -l`
- ตรวจว่า `/home/deploy/backups/` มีสิทธิ์ write ถูกต้อง
- วางแผน retention: ลบ backup เก่าเกิน 30 วัน ไม่งั้น disk เต็ม

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```bash
# backup ทันที
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U stockuser stockdb > backup_$(date +%Y%m%d_%H%M%S).sql

# สร้างโฟลเดอร์ backup
mkdir -p /home/deploy/backups

# cron job (เพิ่มใน crontab -e)
0 2 * * * cd /home/deploy/stock-app && docker compose -f docker-compose.prod.yml exec -T db pg_dump -U stockuser stockdb > /home/deploy/backups/db_$(date +\%Y\%m\%d).sql 2>&1
```

---

### 🛠️ ขั้นตอนที่ 12: ร่างคำสั่งดู Log และ Monitor ระบบ

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยรวบรวมคำสั่งสำคัญสำหรับ monitor และดู log ของ StockApp production
รวมถึง:
1. docker compose logs ทั้งหมด, เฉพาะ app, เฉพาะ db (realtime และ tail)
2. docker stats (resource usage)
3. Nginx access.log และ error.log
4. docker compose ps ตรวจสถานะ
5. คำสั่ง debug เมื่อ container crash

จัดเป็นรูปแบบ cheatsheet ที่พิมพ์ออกมาแปะหน้าจอได้
```

**🤖 Claude Code จะทำอะไร:** Claude รวบรวมคำสั่งทั้งหมดเป็น cheatsheet พร้อม use case ของแต่ละคำสั่ง — ผู้เรียนเอาไปใช้อ้างอิงได้ทันที

**✅ Checkpoint ตรวจสอบ:**
- ทดสอบทุกคำสั่งบน server จริงว่าทำงานได้
- `docker compose logs -f` ต้อง stream log ได้ realtime
- `docker stats` ต้องแสดง CPU/Memory/Network ของทุก container

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```bash
# Log realtime ทั้งระบบ
docker compose -f docker-compose.prod.yml logs -f

# Log เฉพาะ app (50 บรรทัดล่าสุด)
docker compose -f docker-compose.prod.yml logs app --tail=50

# Log เฉพาะ db
docker compose -f docker-compose.prod.yml logs db --tail=20

# Resource usage
docker stats

# สถานะ container
docker compose -f docker-compose.prod.yml ps

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

### 🛠️ ขั้นตอนที่ 13: ร่างสคริปต์ Rollback เมื่อ Deploy มีปัญหา

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยร่าง bash script ชื่อ rollback.sh สำหรับ rollback docker compose
ไปยัง image tag ที่กำหนด (รับ argument เป็น image tag เช่น sha-abc1234)
script ต้องทำ:
1. รับ argument IMAGE_TAG (ถ้าไม่มีให้แสดง usage และ exit 1)
2. cd /home/deploy/stock-app
3. แก้ไข image ใน docker-compose.prod.yml จาก :latest เป็น :IMAGE_TAG
   โดยใช้ sed
4. docker compose pull (image ที่ระบุ)
5. docker compose up -d --remove-orphans
6. docker compose exec -T app npx prisma migrate deploy
7. แสดงสถานะ docker compose ps
8. echo ว่า rollback สำเร็จไปยัง tag อะไร

พร้อมอธิบาย: ทำไมต้อง tag image ด้วย git SHA ทุกครั้ง
```

**🤖 Claude Code จะทำอะไร:** Claude ร่าง rollback script พร้อม argument handling และอธิบายความสำคัญของ image tagging strategy — เราตรวจ sed pattern และ logic ก่อนใช้จริง

**✅ Checkpoint ตรวจสอบ:**
- ทดสอบ script ด้วย tag ที่มีอยู่จริงก่อน
- ตรวจว่า sed แก้ไข YAML ถูกต้อง ไม่ทำให้ไฟล์เสียหาย
- เก็บ list ของ image tags ที่ build ไว้ใน GitHub Actions history

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```bash
# ใช้งาน rollback
bash rollback.sh sha-abc1234

# หรือแก้ไขไฟล์ compose ด้วยมือแล้ว restart
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker compose -f docker-compose.prod.yml exec -T app \
  npx prisma migrate deploy
```

> **Key Concept:** การ tag image ด้วย git SHA ทำให้เรา rollback ได้ทุก commit เหตุนี้เองจึงควัก tag ทั้ง `latest` และ `sha-xxxxx` ไว้ทุกครั้งที่ build

---

### 🛠️ ขั้นตอนที่ 14: ใช้ Claude Code ช่วย Incident Response แบบ Real-time

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ระบบ StockApp production ไม่ตอบสนอง curl https://stock.itgenius.app ได้ 502 Bad Gateway
ช่วยบอกขั้นตอน debug เป็นลำดับ:
1. ตรวจอะไรก่อน (nginx หรือ app?)
2. คำสั่ง log ที่ควรรันอะไรบ้าง
3. สาเหตุที่เป็นไปได้ของ 502 จาก nginx
4. วิธีแก้แต่ละสาเหตุ

แล้วช่วยวิเคราะห์ log ต่อไปนี้: [วางเนื้อหา log ที่ copy มาจาก server]
```

**🤖 Claude Code จะทำอะไร:** Claude วิเคราะห์ log และแนะนำคำสั่ง debug เป็นลำดับ ช่วยหาสาเหตุ (เช่น app container ล่ม, port 3000 ไม่เปิด, database disconnection) และแนะนำวิธีแก้ตรงจุด

**✅ Checkpoint ตรวจสอบ:**
- วิธีใช้: copy log จาก server แปะในช่อง prompt โดยตรง
- Claude Code อาจแนะนำคำสั่งที่ต้องรันเพิ่ม — อ่านก่อนรันเสมอ
- ถ้าแนะนำให้ restart service ควรรู้ว่า downtime จะเกิดขึ้นช่วงสั้น ๆ
- จดบันทึก root cause และแนวทางแก้ไว้เป็น runbook

**📄 คำสั่ง/ไฟล์อ้างอิง — ผลลัพธ์ที่ควรได้ (ไว้เทียบ):**
```bash
# วิเคราะห์ log ส่งให้ Claude Code
docker compose -f docker-compose.prod.yml logs app --tail=100 | \
  claude "วิเคราะห์ log นี้ว่ามี error อะไร และแนะนำวิธีแก้"

# วิเคราะห์ nginx error log
sudo tail -200 /var/log/nginx/error.log | \
  claude "อธิบาย error เหล่านี้และบอกวิธีแก้ทีละข้อ"

# debug database connection
docker compose -f docker-compose.prod.yml logs app --tail=50 | \
  claude --print "app container log นี้แสดง error database connection
  ช่วยบอกสาเหตุที่เป็นไปได้และคำสั่ง debug ที่ควรรันก่อน"
```

คำสั่ง debug ที่ Claude Code มักแนะนำ:
```bash
# ตรวจสอบ db container healthy ไหม
docker compose -f docker-compose.prod.yml ps db

# ทดสอบว่า app ต่อ DB ได้ ผ่าน health endpoint (Prisma 7 ต้องสร้าง client ด้วย adapter จึงไม่ใช้ inline new PrismaClient())
docker compose -f docker-compose.prod.yml exec app wget -qO- http://localhost:3000/api/health

# หรือทดสอบ connection ตรงไปที่ Postgres
docker compose -f docker-compose.prod.yml exec db \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1"

# ดู environment variable ที่ app เห็น
docker compose -f docker-compose.prod.yml exec app env | grep DATABASE
```

---

## Workshop ท้ายวัน: Deploy stock-app เต็มรูปแบบ + CD

### โจทย์ Workshop

Deploy **StockApp** ขึ้น production และตั้ง CD อัตโนมัติให้ครบวงจร โดยใช้ Vibe Coding — สั่ง Claude Code ร่างสคริปต์และไฟล์ config ทุกอย่าง จากนั้น review ก่อนรันบน server จริงทุกขั้นตอน

### 🛠️ Workshop ขั้นตอนที่ W1: เตรียม VPS

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ฉันเพิ่งได้ VPS Ubuntu 24.04 ใหม่มา IP คือ [IP_ADDRESS]
ช่วยสรุป checklist และคำสั่งที่ต้องรันตั้งแต่ต้นเพื่อ:
1. สร้าง SSH key บนเครื่อง local
2. สร้าง user deploy บน server
3. รัน setup-vps.sh ตั้งค่า security
4. ทดสอบ login ด้วย key และ alias

จัดเป็น checklist tick ได้ทีละข้อ
```

**✅ Checkpoint:** SSH เข้าได้ด้วย `ssh stockapp`, UFW status active, fail2ban running, root login ปิดแล้ว

---

### 🛠️ Workshop ขั้นตอนที่ W2: Deploy ระบบขึ้น Server

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ฉันอยู่บน VPS แล้ว ช่วยสรุปคำสั่งตั้งแต่:
1. ติดตั้ง Docker Engine
2. login ghcr.io
3. สร้าง /home/deploy/stock-app พร้อม docker-compose.prod.yml และ .env
4. pull image และ start ระบบ
5. รัน prisma migrate deploy
6. ทดสอบด้วย curl localhost:3000

เรียงเป็น numbered list พร้อม expected output แต่ละขั้น
```

**✅ Checkpoint:** `docker compose ps` แสดง Up และ healthy, `curl localhost:3000` ได้ HTML response

---

### 🛠️ Workshop ขั้นตอนที่ W3: ตั้ง Nginx และ SSL

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยสรุปคำสั่งตั้งแต่ต้นจนจบสำหรับ:
1. ติดตั้ง nginx
2. สร้างและเปิดใช้ nginx config สำหรับ stock.itgenius.app
3. ออก SSL certificate ด้วย Certbot
4. ทดสอบ https://stock.itgenius.app

domain stock.itgenius.app ชี้ A record มาที่ IP แล้ว
```

**✅ Checkpoint:** `https://stock.itgenius.app` เปิดใน browser ได้ มี padlock, `sudo certbot renew --dry-run` ผ่าน

---

### 🛠️ Workshop ขั้นตอนที่ W4: ตั้ง GitHub Actions CD

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ฉันต้องการตั้ง CD workflow ใน repo stock-app
ช่วยสร้างไฟล์ .github/workflows/deploy.yml ที่:
- trigger เมื่อ push ไปยัง main
- build และ push image ไป ghcr.io พร้อม tag sha และ latest
- deploy ไปยัง VPS ผ่าน SSH (appleboy/ssh-action)
- รัน docker compose pull, up -d, prisma migrate deploy

พร้อมรายการ GitHub Secrets ที่ต้องตั้งค่า
```

**✅ Checkpoint:** หลัง push ไปยัง main ดู GitHub Actions — ทั้ง 2 jobs ผ่าน (build-and-push และ deploy)

---

### 🛠️ Workshop ขั้นตอนที่ W5: ทดสอบ End-to-End และ Rollback

**💬 Prompt ที่ใช้สั่ง Claude Code:**
```
ช่วยเขียน checklist ทดสอบ End-to-End สำหรับ StockApp production
ครอบคลุม:
1. เปิดหน้าเว็บและ login ได้
2. เพิ่มสินค้าและดูรายการ CRUD ทำงาน
3. ทดสอบ push code ใหม่แล้ว CD วิ่งอัตโนมัติ
4. ทดสอบ rollback ไป image tag ก่อนหน้า

พร้อมคำสั่งที่ใช้ตรวจสอบแต่ละข้อ
```

**✅ Checkpoint:** ทดสอบครบทุกข้อในตาราง, rollback สำเร็จและ app ทำงานปกติหลัง rollback

### เกณฑ์ที่ถือว่า Workshop สำเร็จ

| เกณฑ์ | วิธีตรวจสอบ |
|---|---|
| เว็บเปิดได้ผ่าน HTTPS | เปิด `https://stock.itgenius.app` ใน browser |
| ใบรับรอง SSL ถูกต้อง | Padlock icon สีเขียว ไม่มี warning |
| Login เข้าระบบได้ | ลองสร้าง user และ login |
| เพิ่มสินค้าและดูรายการได้ | ทดสอบ CRUD flow |
| Push code แล้ว deploy อัตโนมัติ | เห็น GitHub Actions วิ่งและ deploy สำเร็จ |
| Rollback ได้ | ทดลอง rollback ไป image tag ก่อนหน้า |

---

## สรุปวันที่ 5

วันสุดท้ายเราได้ผ่านกระบวนการทั้งหมดของ **Production Deployment** ที่ครบวงจรด้วยสไตล์ Vibe Coding — สั่ง Claude Code ร่างทุกอย่างแล้ว review ก่อนรันบน server จริงทุกขั้นตอน:

- ✅ เตรียม VPS Ubuntu ตั้งแต่ต้น — SSH key, non-root user, UFW Firewall, fail2ban
- ✅ ติดตั้ง Docker บน server และ pull image จาก ghcr.io มา deploy
- ✅ ตั้ง Nginx เป็น Reverse Proxy พร้อม gzip, header ที่ถูกต้อง, caching static files
- ✅ ผูกโดเมน `stock.itgenius.app` และเปิด HTTPS ด้วย Let's Encrypt (Certbot) ฟรี
- ✅ เขียน GitHub Actions `.github/workflows/deploy.yml` ทำ CD อัตโนมัติ push → deploy
- ✅ เรียนรู้การดู log, backup ฐานข้อมูล, Rollback image, และใช้ Claude Code ช่วย Incident Response

---

## สรุปภาพรวมทั้งหลักสูตร (Vibe → Production)

```
วันที่ 1: Vibe Coding & Foundation
────────────────────────────────────────
  Claude Code ทำงานเป็น AI agent ใน terminal
  สร้าง StockApp (Next.js 16 + Prisma + PostgreSQL) ด้วย prompt
  โครงสร้างโปรเจกต์, TypeScript ไม่มี semicolon
  เข้าใจ agentic loop และ tool use ของ Claude

วันที่ 2: Database, API & Business Logic
────────────────────────────────────────
  Prisma Schema ออกแบบ Model สินค้าและการเบิกจ่าย
  Next.js Route Handlers (API endpoints)
  Server Actions สำหรับ mutation
  Claude Code ช่วย generate CRUD, validate, test

วันที่ 3: Sub-agents, MCP & Hooks
────────────────────────────────────────
  Sub-agents เฉพาะทาง: code-reviewer, test-writer, security-auditor
  MCP เชื่อม Claude กับ GitHub, Database, Filesystem
  Hooks: automation รันสคริปต์อัตโนมัติเมื่อ Claude ทำงาน
  Claude Code ทำ code review และแนะนำ refactor

วันที่ 4: Containerize & CI Pipeline
────────────────────────────────────────
  Dockerfile (Next.js standalone mode)
  Docker Compose สำหรับ dev และ prod
  GitHub Actions CI — build, test, push image ขึ้น ghcr.io
  Multi-stage build, layer cache, image size optimization

วันที่ 5: Deploy to Production (วันนี้)
────────────────────────────────────────
  VPS Ubuntu — SSH key, UFW, fail2ban, non-root user
  Docker + Nginx Reverse Proxy บน server จริง
  Let's Encrypt SSL — HTTPS ฟรีพร้อม auto-renew
  CD อัตโนมัติ, Log, Backup, Rollback, Incident Response
```

### เส้นทาง Code → Internet ทั้งหมด

```
Developer เขียนโค้ดบนเครื่อง local
    │
    │  git push origin main
    ▼
GitHub Repository
    │
    │  GitHub Actions trigger
    ▼
  CI Job: Build & Test
  - docker buildx build
  - run tests
  - docker push → ghcr.io
    │
    │  CD Job: Deploy
    ▼
  appleboy/ssh-action
  SSH เข้า VPS Ubuntu
  - docker compose pull
  - docker compose up -d
  - prisma migrate deploy
    │
    ▼
VPS Ubuntu (stock.itgenius.app)
  Nginx :443 → Next.js :3000 → PostgreSQL :5432
    │
    ▼
ผู้ใช้ทั่วโลกเปิดเว็บได้ผ่าน HTTPS
```

---

## Best Practices การทำงานกับ AI Agent ในทีมระยะยาว

### 1. ให้บริบทเสมอ (Context is King)

Claude Code ทำงานได้ดีขึ้นมากเมื่อรู้ว่า project ทำอะไร:

```bash
# สร้าง CLAUDE.md ที่ root ของโปรเจกต์ (Claude อ่านอัตโนมัติ)
cat > CLAUDE.md << 'EOF'
# StockApp — ระบบคลังสินค้าเบิกจ่าย

## Stack
- Next.js 16 (standalone) + TypeScript
- Prisma ORM + PostgreSQL
- Docker Compose
- Deploy บน VPS Ubuntu ผ่าน Nginx

## Code Style
- ห้ามใช้ semicolon (;) ใน TypeScript/JavaScript
- ใช้ single quote เสมอ
- ตัวแปรภาษาอังกฤษ, comment ภาษาไทย

## คำสั่งสำคัญ
- dev: docker compose up -d && npm run dev
- migrate: npx prisma migrate dev
- test: npm run test

## Domain & Infrastructure
- Production: https://stock.itgenius.app
- VPS: Ubuntu 24.04 LTS
- CI/CD: GitHub Actions → ghcr.io → VPS
EOF
```

### 2. Review ทุกครั้งก่อน Apply

Claude Code ทรงพลัง แต่ต้องมี human-in-the-loop เสมอ โดยเฉพาะบน production:

```bash
# ใช้ --print เพื่อดูก่อนแล้วค่อยตัดสินใจ
claude --print "เพิ่ม rate limiting ให้ API endpoint /api/products"

# ถ้าเห็นด้วยค่อยรัน
claude "เพิ่ม rate limiting ให้ API endpoint /api/products"
```

> ⚠️ บน production server อย่าใช้ `--dangerously-skip-permissions` หรือ `bypassPermissions` เด็ดขาด review ทุกคำสั่งก่อนรัน

### 3. Commit บ่อย — ทุก feature/fix = 1 commit

```bash
# หลัง Claude Code ทำงานเสร็จแต่ละชิ้น
git add -p          # review ทีละ hunk
git commit -m "feat: เพิ่ม rate limiting สำหรับ /api/products"
```

ถ้า Claude Code ทำพังอะไร `git checkout -- .` แก้ได้ทันที

### 4. อย่าเปิด Permission มากเกินจำเป็น

```bash
# ใน .claude/settings.json
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Write(src/**)",
      "Bash(npm run *)",
      "Bash(npx prisma *)",
      "Bash(docker compose *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Write(.env*)"
    ]
  }
}
```

### 5. แยก Branch สำหรับงาน Claude Code แบบ Trial

```bash
# สร้าง branch ก่อนให้ Claude Code ทดลองทำ
git checkout -b claude/add-barcode-scanner

# ให้ Claude Code ทำงาน
claude "เพิ่มฟีเจอร์ barcode scanner ด้วย react-zxing"

# ถ้าพอใจ merge
git checkout main
git merge --squash claude/add-barcode-scanner
git commit -m "feat: เพิ่ม barcode scanner"
```

### 6. ใช้ Claude Code เป็น Pair Programmer ไม่ใช่ Code Generator

```bash
# แย่ — ให้ทำทุกอย่างเองโดยไม่คุย
claude "สร้างระบบ inventory ทั้งหมด"

# ดี — วนสนทนาและตัดสินใจร่วมกัน
claude "ฉันจะเพิ่มฟีเจอร์ export Excel ให้หน้า inventory
       มี 2 แนวทาง: (1) server-side ด้วย xlsx library
       (2) client-side ด้วย SheetJS
       ช่วยเปรียบเทียบ trade-off และแนะนำแนวทางที่เหมาะกับ Next.js 16 standalone mode"
```

### 7. Log การสนทนากับ Claude Code ไว้ใน PR

เมื่อ Claude Code ช่วยสร้าง feature ใหญ่ ให้ export summary ใส่ PR description:

```bash
claude --print "สรุปสิ่งที่ทำในเซสชันนี้เพื่อใส่ใน PR description"
```

### 8. Test ก่อน Deploy เสมอ

```bash
# Pipeline สำคัญ
npm run test        # unit / integration test
npm run build       # ต้อง build ผ่านก่อน push
docker build .      # ตรวจว่า container build ได้

# Claude Code ช่วยเขียน test
claude "เขียน unit test สำหรับฟังก์ชัน calculateReorderPoint ใน lib/inventory.ts
       ครอบคลุม edge case: stock เป็น 0, reorderPoint เป็น negative number"
```

### 9. Security Checklist ก่อน Production

```bash
# ให้ Claude Code ทำ security review
claude "ทำ security review ของโปรเจกต์นี้ เน้น:
       1. API endpoint ที่ไม่มี authentication
       2. ข้อมูล sensitive ที่อาจหลุดใน response
       3. SQL injection / Prisma injection risk
       4. .env file ที่อาจติดไปใน Docker image"
```

### 10. Human Review สำคัญที่สุดเสมอ

Claude Code เป็นเครื่องมือที่ทรงพลังมาก แต่:

- อาจ hallucinate API ที่ไม่มีจริง
- อาจเขียน logic ผิดในกรณี edge case ซับซ้อน
- ไม่รู้ business context ลึกเท่า developer ในทีม
- ต้องการ developer ที่เข้าใจโค้ดที่ generate เสมอ

> **Key Concept:** Claude Code เพิ่ม velocity แต่ไม่ได้ลด responsibility developer ยังคงต้องรับผิดชอบทุกบรรทัดที่ deploy ขึ้น production

---

## แหล่งอ้างอิงเพิ่มเติม

### Claude Code
- [Claude Code Docs (Anthropic)](https://docs.anthropic.com/en/docs/claude-code) — เอกสารทางการ
- [Claude Code GitHub](https://github.com/anthropics/claude-code) — source และ changelog
- [Anthropic Prompt Library](https://docs.anthropic.com/en/prompt-library) — ตัวอย่าง prompt

### VPS & Linux
- [Ubuntu Server Guide](https://ubuntu.com/server/docs) — เอกสาร Ubuntu อย่างเป็นทางการ
- [UFW Guide](https://help.ubuntu.com/community/UFW) — วิธีตั้ง Firewall บน Ubuntu
- [fail2ban Documentation](https://www.fail2ban.org/wiki/index.php/MANUAL_0_8) — เอกสาร fail2ban

### Docker & Compose
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/) — schema ของ compose file
- [Docker Engine Install on Ubuntu](https://docs.docker.com/engine/install/ubuntu/) — ขั้นตอนติดตั้งอย่างเป็นทางการ
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) — วิธีใช้ ghcr.io

### Nginx
- [Nginx Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html) — เอกสาร nginx
- [Nginx Config for Next.js](https://nextjs.org/docs/app/building-your-application/deploying#nginx) — แนวทางจาก Next.js docs
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/) — generate SSL config ที่ปลอดภัย

### Let's Encrypt & Certbot
- [Certbot Instructions](https://certbot.eff.org/instructions) — ขั้นตอนตาม OS และ web server
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/) — เอกสาร Let's Encrypt

### GitHub Actions
- [GitHub Actions Documentation](https://docs.github.com/en/actions) — เอกสารทางการ
- [appleboy/ssh-action](https://github.com/appleboy/ssh-action) — SSH action ที่ใช้ใน CD workflow
- [docker/build-push-action](https://github.com/docker/build-push-action) — build & push image

### Next.js Deployment
- [Next.js Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying) — แนวทาง deploy
- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/next-config-js/output) — standalone mode สำหรับ Docker

### Prisma
- [Prisma in Production](https://www.prisma.io/docs/guides/deployment/deployment-guides) — แนวทาง production
- [prisma migrate deploy](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-deploy) — เอกสาร command

---

*หลักสูตร Claude Code มือโปร: ดำน้ำลึกสู่ Production — IT Genius Engineering Co., Ltd.*
*อาจารย์สามิตร โกยม | samitkoyom@gmail.com*
