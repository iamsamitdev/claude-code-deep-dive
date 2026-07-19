# คู่มือ Deploy Next.js Stock App ขึ้น Production ฉบับมือใหม่ (ละเอียดทุกขั้นตอน)

ตั้งแต่จดโดเมนเนม ตั้งค่า DNS เช่า VPS ไปจนถึงระบบ CI/CD Deploy อัตโนมัติ

อ้างอิงจากเอกสาร Day 5: Production Deployment ของหลักสูตร Claude Code Deep Dive
ปรับค่าให้ตรงกับสภาพแวดล้อมจริงของโปรเจ็กต์ ดังนี้

| รายการ | ค่าที่ใช้จริง |
|---|---|
| Domain | stock.aibisec.com |
| Server OS | Ubuntu 24.04 LTS |
| IP Address | 103.91.190.181 |
| Repository (CI/CD) | https://github.com/iamsamitdev/stock-app-claude |
| Docker Image | ghcr.io/iamsamitdev/stock-app-claude:latest |
| Deploy User | deploy |
| App Path บน Server | /home/deploy/stock-app |

## สิ่งที่ต้องเตรียมก่อนเริ่ม

1. คอมพิวเตอร์ที่มี Terminal (Windows ใช้ PowerShell หรือ Windows Terminal, macOS/Linux ใช้ Terminal ปกติ)
2. บัตรเครดิต/เดบิต หรือ PromptPay สำหรับจ่ายค่าโดเมนและค่าเช่า VPS
3. บัญชี GitHub (ในที่นี้คือ iamsamitdev) และโปรเจ็กต์ Next.js ที่มี Dockerfile กับ CI pipeline พร้อมแล้ว
4. ความรู้พื้นฐานการพิมพ์คำสั่งใน Terminal (copy วางได้ทีละบรรทัด)

คำแนะนำการอ่าน: บรรทัดที่ขึ้นต้นด้วย `#` ในกล่องโค้ด คือคำอธิบาย ไม่ต้องพิมพ์ตาม ให้พิมพ์เฉพาะคำสั่งจริงเท่านั้น

---

# Part 1: การจดโดเมนเนม (Domain Name)

โดเมน aibisec.com จดทะเบียนไว้เรียบร้อยแล้ว หัวข้อนี้สรุปไว้เพื่อให้มือใหม่ที่เริ่มจากศูนย์ทำตามได้

## 1.1 เลือกผู้ให้บริการจดโดเมน (Registrar)

ตัวอย่างผู้ให้บริการยอดนิยม

| ผู้ให้บริการ | เว็บไซต์ | หมายเหตุ |
|---|---|---|
| Cloudflare Registrar | https://www.cloudflare.com/products/registrar/ | ราคาทุน ไม่บวกกำไร มี DNS ฟรีในตัว (แนะนำ) |
| Namecheap | https://www.namecheap.com | ราคาถูก ใช้งานง่าย |
| GoDaddy | https://www.godaddy.com | มีภาษาไทย จ่ายง่าย |
| THNIC (.th) | https://www.thnic.co.th | สำหรับโดเมน .co.th, .in.th |

## 1.2 ขั้นตอนการจดโดเมน (ตัวอย่างแนวทางเดียวกันทุกเจ้า)

1. เข้าเว็บผู้ให้บริการ แล้วสมัครสมาชิก (ยืนยันอีเมลให้เรียบร้อย)
2. ใช้ช่องค้นหา พิมพ์ชื่อโดเมนที่ต้องการ เช่น `aibisec.com` แล้วกด Search
3. ถ้าสถานะเป็น Available ให้กด Add to Cart
4. เลือกระยะเวลา 1 ปี (ต่ออายุรายปี) และปิด add-on ที่ไม่จำเป็น ยกเว้น "WHOIS Privacy / Domain Privacy" แนะนำให้เปิด (ส่วนใหญ่ฟรี) เพื่อซ่อนข้อมูลส่วนตัว
5. ชำระเงินด้วยบัตรเครดิต/เดบิต
6. หลังชำระเงิน โดเมนจะปรากฏในหน้า Dashboard/My Domains ของบัญชีเรา

## 1.3 ชี้ Nameserver (กรณีใช้ DNS ของที่อื่น)

- ถ้าจดโดเมนและใช้ DNS เจ้าเดียวกัน ข้ามขั้นตอนนี้ได้เลย
- ถ้าต้องการใช้ Cloudflare DNS (ฟรี มี CDN ในตัว) ให้สมัคร Cloudflare > Add Site > ใส่ `aibisec.com` > Cloudflare จะให้ nameserver มา 2 ตัว เช่น `xxx.ns.cloudflare.com` แล้วนำไปใส่ในหน้า Nameserver Settings ของ Registrar เดิม รอมีผล 1-24 ชั่วโมง

---

# Part 2: การเช่า VPS (Virtual Private Server)

Server 103.91.190.181 (Ubuntu 24.04) เช่าไว้เรียบร้อยแล้ว หัวข้อนี้สรุปแนวทางสำหรับผู้เริ่มต้น

## 2.1 เลือกผู้ให้บริการ VPS

| ผู้ให้บริการ | เว็บไซต์ | หมายเหตุ |
|---|---|---|
| Ruk-Com (ไทย) | https://ruk-com.in.th | Data center ในไทย ping ต่ำ จ่าย PromptPay ได้ |
| HostAtom (ไทย) | https://hostatom.com | มีทีมซัพพอร์ตภาษาไทย |
| DigitalOcean | https://www.digitalocean.com | มี Data center สิงคโปร์ เอกสารดีมาก |
| Vultr | https://www.vultr.com | มี Data center กรุงเทพฯ |
| Linode (Akamai) | https://www.linode.com | เสถียร ราคาชัดเจน |

## 2.2 สเปกขั้นต่ำที่แนะนำสำหรับ Next.js + PostgreSQL ใน Docker

- CPU: 2 vCPU
- RAM: 2 GB ขึ้นไป (แนะนำ 4 GB ถ้า build บนเครื่องด้วย)
- Disk: SSD 40 GB ขึ้นไป
- OS: **Ubuntu 24.04 LTS (64-bit)**

## 2.3 ขั้นตอนการสั่งซื้อ VPS (แนวทางเดียวกันทุกเจ้า)

1. สมัครสมาชิกและยืนยันตัวตนตามที่ผู้ให้บริการกำหนด
2. เลือกเมนู Create/Deploy New Server หรือ Droplet/Instance
3. เลือก Region ใกล้ผู้ใช้งานที่สุด (ไทย หรือสิงคโปร์)
4. เลือก Image/OS เป็น Ubuntu 24.04 LTS x64
5. เลือกแพ็กเกจตามสเปกข้อ 2.2
6. ส่วน Authentication ถ้ามีตัวเลือก SSH Key ให้เลือกใส่ SSH public key ได้เลย (สร้างตาม Part 4) ถ้าไม่มีให้เลือก Password ไปก่อน แล้วค่อยเปลี่ยนเป็น key ภายหลัง
7. กดสั่งซื้อและชำระเงิน รอ 1-5 นาที ระบบจะแสดง **IP Address** ของ server (ในที่นี้คือ 103.91.190.181) พร้อมรหัสผ่าน root ทางอีเมลหรือหน้า Dashboard

---

# Part 3: ตั้งค่า DNS A Record ให้ stock.aibisec.com ชี้ไปที่ Server

ขั้นตอนนี้ทำไว้เรียบร้อยแล้ว (stock.aibisec.com ชี้ไป 103.91.190.181) สรุปวิธีทำและวิธีตรวจสอบไว้ให้ครบ

## 3.1 เพิ่ม A Record

1. Login เข้าหน้าจัดการ DNS ของโดเมน aibisec.com (ที่ Registrar หรือ Cloudflare)
2. ไปที่เมนู DNS / DNS Management / DNS Records
3. กด Add Record แล้วกรอกค่าดังนี้

| ช่อง | ค่าที่กรอก | คำอธิบาย |
|---|---|---|
| Type | A | ชี้ชื่อโดเมนไปยัง IPv4 |
| Name / Host | stock | ระบบจะต่อเป็น stock.aibisec.com ให้อัตโนมัติ |
| Value / IP | 103.91.190.181 | IP ของ VPS |
| TTL | Auto หรือ 3600 | เวลาที่ DNS cache จะจำค่า |
| Proxy (เฉพาะ Cloudflare) | DNS only (เมฆสีเทา) | ช่วงออก SSL ครั้งแรกให้ปิด proxy ก่อน |

4. กด Save

## 3.2 ตรวจสอบว่า DNS มีผลแล้ว (รอได้ตั้งแต่ 5 นาที ถึง 24 ชั่วโมง)

รันจากเครื่องตัวเอง

```bash
# วิธีที่ 1 (มีทุก OS)
nslookup stock.aibisec.com

# วิธีที่ 2 (macOS/Linux)
dig stock.aibisec.com +short
```

ผลลัพธ์ที่ถูกต้อง: ต้องแสดง `103.91.190.181`

หรือตรวจผ่านเว็บ https://dnschecker.org โดยพิมพ์ `stock.aibisec.com` เลือก Type = A ต้องเห็น 103.91.190.181 เป็นสีเขียวทั่วโลก

---

# Part 4: สร้าง SSH Key และเชื่อมต่อ Server ครั้งแรก (บนเครื่องเรา)

SSH Key คือกุญแจดิจิทัลแทนรหัสผ่าน ปลอดภัยกว่าและจำเป็นสำหรับระบบ deploy อัตโนมัติ

## 4.1 สร้าง SSH Key (ทำครั้งเดียว)

เปิด Terminal (Windows: PowerShell / macOS: Terminal) แล้วรัน

```bash
ssh-keygen -t ed25519 -C "deploy@stock-app" -f ~/.ssh/stock_app_deploy
```

- ระบบถาม passphrase ให้กด Enter ผ่าน 2 ครั้ง (ไม่ต้องตั้งก็ได้สำหรับมือใหม่)
- จะได้ไฟล์ 2 ไฟล์ในโฟลเดอร์ `~/.ssh/`
  - `stock_app_deploy` = Private Key (ห้ามส่งให้ใครเด็ดขาด)
  - `stock_app_deploy.pub` = Public Key (เอาไปวางบน server ได้)

ดูเนื้อหา public key เก็บไว้ใช้ในขั้นตอนถัดไป

```bash
# macOS / Linux
cat ~/.ssh/stock_app_deploy.pub

# Windows PowerShell
type $env:USERPROFILE\.ssh\stock_app_deploy.pub
```

ผลลัพธ์จะเป็นข้อความบรรทัดเดียว ขึ้นต้นด้วย `ssh-ed25519 AAAA...` ลงท้ายด้วย `deploy@stock-app`

## 4.2 เชื่อมต่อ Server ครั้งแรกด้วย root

ใช้รหัสผ่าน root ที่ผู้ให้บริการ VPS ส่งให้

```bash
ssh root@103.91.190.181
```

- ครั้งแรกจะถาม `Are you sure you want to continue connecting (yes/no)?` ให้พิมพ์ `yes` แล้ว Enter
- ใส่รหัสผ่าน root (ตอนพิมพ์รหัสจะไม่เห็นตัวอักษร เป็นเรื่องปกติ พิมพ์เสร็จกด Enter)
- เข้าสำเร็จจะเห็น prompt เปลี่ยนเป็น `root@ชื่อเครื่อง:~#`

## 4.3 อัปเดตระบบทันทีหลังเข้าครั้งแรก (รันบน server ด้วย root)

```bash
apt update && apt upgrade -y
```

รอจนเสร็จ ถ้าระบบแจ้งให้ restart service ใดให้กด Enter ตามค่า default

---

# Part 5: สร้าง User deploy และตั้งค่าความปลอดภัย Server

ทุกคำสั่งใน Part นี้รันบน **server** (ตอนนี้ยัง login เป็น root อยู่)

## 5.1 สร้าง user ชื่อ deploy

```bash
adduser deploy
```

- ตั้งรหัสผ่านของ user deploy (จดเก็บไว้ให้ดี ใช้ตอนรันคำสั่ง sudo)
- ข้อมูลอื่นๆ เช่น Full Name กด Enter ข้ามได้ทั้งหมด แล้วพิมพ์ `Y` ยืนยัน

เพิ่มสิทธิ์ sudo ให้ user deploy

```bash
usermod -aG sudo deploy
```

## 5.2 นำ SSH Public Key ไปใส่ให้ user deploy

```bash
# สร้างโฟลเดอร์ .ssh ของ user deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# เปิดไฟล์ authorized_keys ด้วย nano
nano /home/deploy/.ssh/authorized_keys
```

- วางเนื้อหา public key (บรรทัด `ssh-ed25519 AAAA... deploy@stock-app` จากข้อ 4.1) ลงไป 1 บรรทัด
- กด `Ctrl+O` แล้ว Enter เพื่อบันทึก จากนั้น `Ctrl+X` เพื่อออก

```bash
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

ทดสอบจาก **เครื่องเรา** (เปิด Terminal ใหม่อีกหน้าต่าง อย่าเพิ่งปิดหน้าต่าง root)

```bash
ssh -i ~/.ssh/stock_app_deploy deploy@103.91.190.181
```

ผลลัพธ์ที่ถูกต้อง: เข้าได้ทันทีโดยไม่ถามรหัสผ่าน และ prompt เป็น `deploy@ชื่อเครื่อง:~$`

## 5.3 สร้างไฟล์ SSH Config บนเครื่องเรา (พิมพ์สั้นลงเหลือ ssh stockapp)

บน **เครื่องเรา** สร้าง/แก้ไขไฟล์ `~/.ssh/config` (Windows: `C:\Users\ชื่อเรา\.ssh\config`)

```
Host stockapp
  HostName 103.91.190.181
  User deploy
  IdentityFile ~/.ssh/stock_app_deploy
  Port 22
```

ต่อไปเชื่อมต่อได้ด้วยคำสั่งสั้นๆ

```bash
ssh stockapp
```

## 5.4 ตั้งค่า Firewall (UFW) - รันบน server

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

- ตอน enable ระบบเตือนว่าอาจตัด SSH ให้พิมพ์ `y` ยืนยัน (เราเปิด OpenSSH ไว้แล้ว ปลอดภัย)

ตรวจสอบ

```bash
sudo ufw status verbose
```

ผลลัพธ์ที่ถูกต้อง: Status: active และมี rule ALLOW ของ OpenSSH, 80/tcp, 443/tcp

## 5.5 ติดตั้ง fail2ban กันการเดารหัสผ่าน - รันบน server

```bash
sudo apt install -y fail2ban
sudo nano /etc/fail2ban/jail.local
```

วางเนื้อหานี้ลงไป แล้วบันทึก (Ctrl+O, Enter, Ctrl+X)

```ini
[sshd]
enabled = true
maxretry = 5
bantime = 3600
findtime = 600
```

ความหมาย: ถ้า IP ใดใส่รหัสผิดเกิน 5 ครั้งใน 10 นาที (600 วินาที) จะถูกแบน 1 ชั่วโมง (3600 วินาที)

```bash
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
sudo fail2ban-client status sshd
```

ผลลัพธ์ที่ถูกต้อง: แสดง Status for the jail: sshd โดย Banned IP list ยังว่างอยู่

## 5.6 ปิดการ login ด้วย root และรหัสผ่าน - รันบน server

**คำเตือน: ต้องทดสอบข้อ 5.2 ว่า ssh เข้าด้วย key ได้แล้วเท่านั้น จึงทำขั้นตอนนี้ มิฉะนั้นอาจล็อกตัวเองออกจาก server**

```bash
sudo nano /etc/ssh/sshd_config
```

ค้นหาและแก้ไข 3 บรรทัดนี้ (กด `Ctrl+W` เพื่อค้นหาใน nano)

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

- ถ้าบรรทัดใดมี `#` นำหน้า ให้ลบ `#` ออกด้วย
- บันทึกแล้วออก จากนั้น restart ssh

```bash
sudo systemctl restart ssh
```

ทดสอบจากเครื่องเรา (เปิด Terminal ใหม่): `ssh stockapp` ต้องเข้าได้ปกติ และ `ssh root@103.91.190.181` ต้องถูกปฏิเสธ

---

# Part 6: ติดตั้ง Docker Engine บน Server

ทุกคำสั่งรันบน server ด้วย user deploy (`ssh stockapp`)

## 6.1 ติดตั้งจาก Docker Official Repository (ห้ามใช้ snap)

```bash
# 1) ติดตั้งเครื่องมือพื้นฐาน
sudo apt update
sudo apt install -y ca-certificates curl

# 2) เพิ่ม Docker GPG key (กุญแจยืนยันความถูกต้องของแพ็กเกจ)
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 3) เพิ่ม Docker repository เข้าระบบ apt
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4) ติดตั้ง Docker ทั้งชุด
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 6.2 ให้ user deploy ใช้ docker ได้โดยไม่ต้อง sudo

```bash
sudo usermod -aG docker deploy
```

**สำคัญ: ต้อง logout แล้ว login ใหม่เพื่อให้สิทธิ์มีผล**

```bash
exit          # ออกจาก server
ssh stockapp  # เข้าใหม่
```

## 6.3 ตรวจสอบการติดตั้ง

```bash
docker --version        # ต้องแสดง Docker version 27.x.x ขึ้นไป
docker compose version  # ต้องแสดง Docker Compose version v2.x.x
docker run hello-world  # ต้องแสดง "Hello from Docker!" โดยไม่ต้องใช้ sudo
```

ถ้า `docker run hello-world` ขึ้น permission denied แปลว่ายังไม่ได้ logout/login ใหม่

---

# Part 7: เตรียมไฟล์โปรเจ็กต์บน Server

ทุกคำสั่งรันบน server ด้วย user deploy

## 7.1 สร้างโฟลเดอร์โปรเจ็กต์

```bash
mkdir -p /home/deploy/stock-app
cd /home/deploy/stock-app
```

## 7.2 สร้างไฟล์ docker-compose.prod.yml

```bash
nano docker-compose.prod.yml
```

วางเนื้อหาทั้งหมดนี้ แล้วบันทึก (Ctrl+O, Enter, Ctrl+X)

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  app:
    image: ghcr.io/iamsamitdev/stock-app-claude:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: https://stock.aibisec.com
      NEXT_PUBLIC_APP_URL: https://stock.aibisec.com
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network

  # one-off migration runner — ใช้ image `:latest-migrate` (build จาก stage `deps` มี prisma CLI + schema + tsx ครบ)
  # runtime image ของ `app` เป็น Next.js standalone ล้วน ๆ ไม่มี prisma CLI/schema จึง exec migrate ใน app ไม่ได้
  # เรียกด้วย: docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
  migrate:
    image: ghcr.io/iamsamitdev/stock-app-claude:latest-migrate
    profiles: ["tools"]
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network
    # retry สั้น ๆ กัน P1001 ระหว่างรอ db พร้อม (escaping ต้องเป็น $$ ให้ compose ส่ง $ จริงเข้า shell)
    command:
      - sh
      - -c
      - |
        for i in $$(seq 1 10); do
          pnpm exec prisma migrate deploy && exit 0
          echo "migrate deploy failed (attempt $$i/10) — retry in 3s" >&2
          sleep 3
        done
        exit 1

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

หมายเหตุสำคัญ:
- ชื่อ image ต้องตรงกับที่ workflow ใน repo build ขึ้น ghcr.io — โปรเจ็กต์นี้ build **2 image**: `:latest` (แอป standalone) และ `:latest-migrate` (สำหรับรัน migration/seed)
- **ทำไมต้องมี image แยกสำหรับ migrate:** runtime image ของ `app` เป็น Next.js standalone ที่ตัด prisma CLI + `prisma/schema.prisma` ทิ้งหมดแล้ว จึงรัน `prisma migrate deploy` ในตัว app ไม่ได้ ต้องใช้ image `:latest-migrate` (build จาก stage `deps`) ที่ยังมีเครื่องมือครบ
- `networks.app-network.driver: bridge` ระบุชัดเจนไว้ เป็น bridge network ปกติ (service คุยกันด้วยชื่อ service เช่น `db`)

## 7.3 สร้างไฟล์ .env เก็บค่าลับ (ห้าม commit ขึ้น Git เด็ดขาด)

สร้างรหัสลับแบบสุ่มก่อน 2 ค่า

```bash
# รันคำสั่งนี้ 2 ครั้ง ได้ข้อความสุ่ม 2 ชุด จดไว้
openssl rand -base64 32
```

สร้างไฟล์ .env

```bash
nano .env
```

วางเนื้อหานี้ (แทนที่ค่าในวงเล็บด้วยข้อความสุ่มที่จดไว้)

```
POSTGRES_USER=stockuser
POSTGRES_PASSWORD=(ข้อความสุ่มชุดที่ 1)
POSTGRES_DB=stockdb
BETTER_AUTH_SECRET=(ข้อความสุ่มชุดที่ 2)
```

จำกัดสิทธิ์ให้อ่านได้เฉพาะเจ้าของไฟล์

```bash
chmod 600 .env
```

---

# Part 8: Deploy ครั้งแรก (Pull Image และรันระบบ)

## 8.1 สร้าง GitHub Personal Access Token (PAT) สำหรับดึง image

ทำบนเว็บ GitHub (เครื่องเรา)

1. เข้า https://github.com/settings/tokens
2. เลือก Tokens (classic) > Generate new token > Generate new token (classic)
3. ตั้ง Note เช่น `stock-app-server-pull`
4. Expiration เลือก 90 days หรือตามสะดวก
5. ติ๊ก scope: **read:packages** (พอสำหรับดึง image; ถ้าให้ server push ด้วยค่อยเพิ่ม write:packages)
6. กด Generate token แล้ว **copy เก็บทันที** (จะเห็นครั้งเดียว) ขึ้นต้นด้วย `ghp_...`

## 8.2 Login ghcr.io บน server

```bash
echo "ghp_ใส่TOKENของเรา" | docker login ghcr.io -u iamsamitdev --password-stdin
```

ผลลัพธ์ที่ถูกต้อง: `Login Succeeded`

## 8.3 Pull image และ start ระบบ

```bash
cd /home/deploy/stock-app

# ดึง image ล่าสุดจาก ghcr.io
docker compose -f docker-compose.prod.yml pull

# รันทั้งระบบแบบ background
docker compose -f docker-compose.prod.yml up -d

# ตรวจสอบสถานะ
docker compose -f docker-compose.prod.yml ps
```

ผลลัพธ์ที่ถูกต้อง: ทั้ง service `db` และ `app` มี STATUS เป็น `Up` และ db แสดง `(healthy)`

## 8.4 Migrate โครงสร้างฐานข้อมูล

> ⚠️ **ห้ามใช้** `docker compose exec app npx prisma migrate deploy` — runtime image ของ `app` เป็น standalone ไม่มี prisma CLI/schema จะ error ทันที ให้ใช้ service `migrate` (image `:latest-migrate`) แทน

```bash
cd /home/deploy/stock-app

# pull image migrate ด้วย (--profile tools ดึง service ที่อยู่ใน profile มาให้)
docker compose -f docker-compose.prod.yml --profile tools pull

# รัน migration เป็น one-off container แล้วลบทิ้ง (--rm)
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
```

ผลลัพธ์ที่ถูกต้อง: แสดงรายการ migration ที่ถูก apply เช่น `All migrations have been successfully applied.` โดยไม่มี error

## 8.4.1 Seed ข้อมูลตัวอย่าง (ทำครั้งเดียวตอน DB ยังว่าง — ไม่บังคับ)

ถ้าต้องการใส่ข้อมูลตัวอย่าง (สินค้า 7 รายการ + การเคลื่อนไหว 9 รายการ) ใช้ image `:latest-migrate` เดิม override command เป็น `pnpm db:seed`

```bash
cd /home/deploy/stock-app
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate pnpm db:seed
```

ผลลัพธ์ที่ถูกต้อง: `Seed สำเร็จ: สินค้า 7 รายการ, การเคลื่อนไหว 9 รายการ`

> ⚠️ **คำเตือน:** seed script (`prisma/seed.ts`) จะ `deleteMany()` **ล้างตาราง product + stockTransaction ทั้งหมดก่อน** แล้วค่อยใส่ข้อมูลตัวอย่าง — รันได้ปลอดภัยเฉพาะตอน DB ยังว่าง **อย่ารันซ้ำหลังมีข้อมูลจริง** (จะล้างของจริงหาย) ไม่กระทบตาราง auth (user/session)
> 📌 อย่าใส่ seed ลงใน CD อัตโนมัติเด็ดขาด เพราะจะล้างข้อมูล production ทุกครั้งที่ deploy

## 8.5 ทดสอบว่าแอปตอบสนอง

```bash
curl -I http://localhost:3000
```

ผลลัพธ์ที่ถูกต้อง: บรรทัดแรกเป็น `HTTP/1.1 200 OK` (หรือ 307/308 redirect ไปหน้า login ก็ถือว่าแอปทำงานแล้ว)

---

# Part 9: ติดตั้งและตั้งค่า Nginx Reverse Proxy

Nginx ทำหน้าที่รับ request จากอินเทอร์เน็ต (port 80/443) แล้วส่งต่อให้ Next.js (port 3000)

## 9.1 ติดตั้ง Nginx

```bash
sudo apt install -y nginx
systemctl status nginx --no-pager   # ต้องแสดง active (running)
```

## 9.2 สร้าง Server Block Config

```bash
sudo nano /etc/nginx/sites-available/stock-app
```

วางเนื้อหาทั้งหมดนี้ แล้วบันทึก

```nginx
server {
    listen 80;
    server_name stock.aibisec.com;

    # บีบอัดข้อมูลก่อนส่ง ลด bandwidth
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # cache ไฟล์ static ของ Next.js นาน 1 ปี
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        proxy_pass http://127.0.0.1:3000;
        expires 7d;
    }
}
```

## 9.3 เปิดใช้งาน config

```bash
# สร้าง symbolic link ไปยัง sites-enabled
sudo ln -s /etc/nginx/sites-available/stock-app /etc/nginx/sites-enabled/stock-app

# ลบ config default ที่มากับ nginx
sudo rm -f /etc/nginx/sites-enabled/default

# ทดสอบ syntax ก่อนใช้จริงเสมอ
sudo nginx -t
```

ผลลัพธ์ที่ถูกต้อง: `syntax is ok` และ `test is successful`

```bash
sudo systemctl reload nginx
```

## 9.4 ทดสอบผ่านโดเมน (HTTP)

จากเครื่องเราหรือ browser เปิด `http://stock.aibisec.com` ต้องเห็นหน้าเว็บแอป (ยังไม่มีกุญแจ https ถือว่าปกติ เพราะยังไม่ถึงขั้นตอน SSL)

```bash
curl -I http://stock.aibisec.com
```

---

# Part 10: เปิดใช้ HTTPS ฟรีด้วย Let's Encrypt (Certbot)

## 10.1 ติดตั้ง Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

## 10.2 ขอ SSL Certificate

```bash
sudo certbot --nginx -d stock.aibisec.com
```

ระหว่างทางระบบจะถาม

1. อีเมลสำหรับแจ้งเตือนหมดอายุ: ใส่ `samitkoyom@gmail.com`
2. ยอมรับ Terms of Service: พิมพ์ `Y`
3. รับข่าวสารจาก EFF: ตอบ `Y` หรือ `N` ก็ได้

Certbot จะทำให้อัตโนมัติ: ยืนยันความเป็นเจ้าของโดเมน, ออก certificate, แก้ nginx config เพิ่ม port 443, ตั้ง redirect จาก HTTP ไป HTTPS และตั้งระบบต่ออายุอัตโนมัติ (certificate มีอายุ 90 วัน ระบบต่อให้เองทุกประมาณ 60 วัน)

ผลลัพธ์ที่ถูกต้อง: ข้อความ `Successfully deployed certificate for stock.aibisec.com` และ `Congratulations!`

## 10.3 ทดสอบ HTTPS

```bash
# ต้องได้ HTTP/1.1 301 Moved Permanently ชี้ไป https
curl -I http://stock.aibisec.com

# ต้องได้ 200 OK
curl -I https://stock.aibisec.com

# ทดสอบระบบต่ออายุอัตโนมัติ ต้องแสดง "simulated renewals succeeded"
sudo certbot renew --dry-run
```

เปิด browser ที่ **https://stock.aibisec.com** ต้องเห็นไอคอนกุญแจ (padlock) ข้าง URL

หมายเหตุ Cloudflare: ถ้าปิด proxy (เมฆเทา) ไว้ตอนออก certificate แล้ว จะเปิด proxy (เมฆส้ม) กลับได้ โดยตั้ง SSL/TLS mode เป็น Full (strict)

---

# Part 11: ตั้งค่า CD อัตโนมัติด้วย GitHub Actions (push แล้ว deploy เอง)

## 11.1 ตั้งค่า GitHub Secrets

ทำบนเว็บ GitHub

1. เข้า https://github.com/iamsamitdev/stock-app-claude
2. ไปที่ Settings > Secrets and variables > Actions > New repository secret
3. เพิ่ม secret ทีละตัวตามตาราง

| Secret Name | ค่าที่ใส่ |
|---|---|
| VPS_HOST | 103.91.190.181 |
| VPS_USER | deploy |
| VPS_SSH_PRIVATE_KEY | เนื้อหาไฟล์ private key **ทั้งไฟล์** (ดูวิธีข้างล่าง) |
| GHCR_PAT | Token `ghp_...` จากข้อ 8.1 |
| GHCR_USERNAME | iamsamitdev |

วิธีดูเนื้อหา private key เพื่อ copy ไปใส่ VPS_SSH_PRIVATE_KEY (รันบนเครื่องเรา)

```bash
# macOS / Linux
cat ~/.ssh/stock_app_deploy

# Windows PowerShell
type $env:USERPROFILE\.ssh\stock_app_deploy
```

copy ตั้งแต่บรรทัด `-----BEGIN OPENSSH PRIVATE KEY-----` จนถึง `-----END OPENSSH PRIVATE KEY-----` รวมทั้งสองบรรทัดนั้นด้วย

## 11.1.1 คำอธิบายเสริม: แต่ละ Secret มีไว้ทำไม

หลักการสำคัญ: ใน Job `deploy` ของ GitHub Actions เครื่องที่รันคือ server ชั่วคราวของ GitHub (เรียกว่า runner) ซึ่งไม่ใช่ VPS ของเรา ดังนั้น runner ต้อง "SSH ข้ามไปยัง VPS ของเรา" เพื่อไปสั่งคำสั่ง deploy ค่าทั้ง 5 ตัวคือข้อมูลที่ runner จำเป็นต้องรู้เพื่อทำงานให้ครบวงจร

เหตุที่ต้องเก็บเป็น GitHub Secrets แทนการเขียนลงไฟล์ deploy.yml ตรงๆ เพราะเป็นข้อมูลอ่อนไหว ถ้าเขียนในไฟล์ ใครที่เห็น repo ก็จะเห็นรหัสเข้า server ของเราทันที ส่วน Secrets จะถูกเข้ารหัสเก็บไว้ และถูกปิดบังเป็น `***` ใน log ของ Actions อัตโนมัติ

**1. VPS_HOST = 103.91.190.181**

คือ "ที่อยู่ปลายทาง" ที่ runner จะ SSH เข้าไป เปรียบเหมือนบ้านเลขที่ของ server บนอินเทอร์เน็ต ถ้าไม่มีค่านี้ runner จะไม่รู้ว่าต้องเชื่อมต่อไปที่เครื่องไหน ค่านี้ถูกส่งเข้า parameter `host` ของ appleboy/ssh-action

**2. VPS_USER = deploy**

คือ "ชื่อผู้ใช้" ที่จะ login เข้า server เนื่องจากเราปิด root login ไปแล้วใน Part 5 ระบบจึงต้องเข้าด้วย user deploy เท่านั้น การใช้ user ธรรมดาแทน root ยังเป็น security best practice ด้วย เพราะถ้า key รั่วไหล ผู้บุกรุกจะไม่ได้สิทธิ์สูงสุดของเครื่องทันที

**3. VPS_SSH_PRIVATE_KEY = เนื้อหาไฟล์ private key ทั้งไฟล์**

คือ "กุญแจยืนยันตัวตน" แทนรหัสผ่าน SSH ทำงานเป็นคู่กุญแจ: บน server เราวาง public key (แม่กุญแจ) ไว้ใน `authorized_keys` แล้ว ส่วนฝั่งที่จะเข้าต้องถือ private key (ลูกกุญแจ) ที่จับคู่กัน เมื่อ runner ใช้ private key นี้ server จึงยอมให้เข้าโดยไม่ต้องใช้รหัสผ่าน (ซึ่งเราปิดไปแล้วด้วย PasswordAuthentication no)

เหตุที่ต้องวาง "ทั้งไฟล์" รวมบรรทัด BEGIN/END เพราะ SSH client ต้องอ่าน format ให้ครบจึงจะถอดรหัส key ได้ ขาดไปบรรทัดเดียวจะ error ว่า invalid key format ทันที ค่านี้คือค่าที่ต้องระวังที่สุดในทั้ง 5 ตัว ใครได้ไปเท่ากับเข้า server เราได้เลย

**4. GHCR_PAT = Token ghp_... จากข้อ 8.1**

คือ "บัตรผ่าน" สำหรับให้ VPS ของเราดึง (pull) Docker image จาก GitHub Container Registry (ghcr.io) สังเกตว่าใน script มีบรรทัด `docker login ghcr.io` ที่รัน "บน VPS" หลัง SSH เข้าไปแล้ว เพราะ package บน ghcr.io เป็น private โดย default การ pull จึงต้องยืนยันตัวตนก่อน

จุดที่มือใหม่มักสับสน: ใน Job `build-and-push` เราใช้ `GITHUB_TOKEN` ซึ่ง GitHub สร้างให้อัตโนมัติ แต่ token นั้นใช้ได้เฉพาะภายใน runner ของ Actions เท่านั้น VPS ของเราไม่มี token นี้ จึงต้องสร้าง PAT แยกให้ VPS ใช้ และให้สิทธิ์แค่ read:packages ก็พอ (หลัก least privilege ถ้า token รั่วก็ทำได้แค่ดึง image ไม่สามารถแก้ code หรือลบ repo ได้)

**5. GHCR_USERNAME = iamsamitdev**

คือ "ชื่อบัญชีคู่กับ PAT" ใช้ตอนรัน `docker login ghcr.io -u iamsamitdev` เพราะการ login ต้องระบุเสมอว่า token นี้เป็นของบัญชีไหน เปรียบเหมือน username คู่กับ password แยกเป็น secret ไว้เพื่อให้แก้ที่เดียวได้ถ้าเปลี่ยนบัญชี

สรุปการไหลของค่าใน 1 รอบ deploy: runner ใช้ค่า 1-3 เพื่อ SSH เข้า VPS จากนั้นบน VPS ใช้ค่า 4-5 เพื่อ login ghcr.io แล้วจึง pull image ล่าสุดมารัน

## 11.1.2 Diagram การไหลของ Secrets ในกระบวนการ Deploy

```
                         [เครื่องนักพัฒนา]
                          git push main
                                |
                                v
+----------------------------- GitHub -------------------------------+
|                                                                    |
|  Repo: iamsamitdev/stock-app-claude                                |
|      |                                                             |
|      | trigger workflow                                            |
|      v                                                             |
|  +--------------------------+        +--------------------------+  |
|  | Job 1: build-and-push    |        | GitHub Container         |  |
|  | (runner ของ GitHub)      | -----> | Registry (ghcr.io)       |  |
|  |                          |  push  |                          |  |
|  | ใช้ GITHUB_TOKEN         |  image | ghcr.io/iamsamitdev/     |  |
|  | (สร้างให้อัตโนมัติ         |        | stock-app-claude:latest  |  |
|  | ใช้ได้ใน runner เท่านั้น)  |        +--------------------------+  |
|  +--------------------------+                     ^                |
|      | สำเร็จแล้ว (needs)                          |                |
|      v                                            |                |
|  +--------------------------+                     |                |
|  | Job 2: deploy            |                     |                |
|  | (runner ของ GitHub)      |                     |                |
|  |                          |                     |                |
|  | ใช้ Secrets:             |                     |                |
|  |  (1) VPS_HOST            |                     |                |
|  |  (2) VPS_USER            |                     |                |
|  |  (3) VPS_SSH_PRIVATE_KEY |                     |                |
|  +--------------------------+                     |                |
+------|--------------------------------------------|----------------+
       |                                            |
       | SSH ไปที่ deploy@103.91.190.181            | pull image
       | (private key จับคู่กับ public key           | (ต้องยืนยันตัวตน)
       |  ใน authorized_keys บน server)             |
       v                                            |
+----------------------- VPS 103.91.190.181 --------|----------------+
|                                                   |                |
|  รัน script บน server:                             |                |
|   docker login ghcr.io  <--- ใช้ Secrets:          |                |
|     (4) GHCR_PAT        (บัตรผ่านดึง image) -------+                |
|     (5) GHCR_USERNAME   (ชื่อบัญชีคู่กับ PAT)                        |
|   docker compose --profile tools pull   (ดึง image app + migrate)   |
|   docker compose up -d                  (รัน version ใหม่)          |
|   docker compose --profile tools run --rm migrate  (อัปเดต DB)      |
|                                                                    |
|  ผลลัพธ์: https://stock.aibisec.com อัปเดตเป็น version ล่าสุด        |
+--------------------------------------------------------------------+
```

Diagram เดียวกันในรูปแบบ Mermaid (นำไป render ได้ที่ https://mermaid.live)

```mermaid
flowchart TB
    DEV["เครื่องนักพัฒนา<br>git push main"] --> REPO["GitHub Repo<br>iamsamitdev/stock-app-claude"]

    subgraph GHA["GitHub Actions (ci.yml — ไฟล์เดียว)"]
        J0["Job 0: test<br>typecheck + vitest<br>(รันทุก push + PR)"]
        J1["Job 1: build-and-push<br>needs: test<br>ใช้ GITHUB_TOKEN (อัตโนมัติ)<br>build 2 image: :latest + :latest-migrate"]
        J2["Job 2: deploy<br>needs: build-and-push<br>ใช้ (1) VPS_HOST<br>(2) VPS_USER<br>(3) VPS_SSH_PRIVATE_KEY"]
    end

    REPO -->|trigger workflow| J0
    J0 -->|test ผ่าน needs| J1
    J1 -->|push image| GHCR["ghcr.io<br>:latest + :latest-migrate"]
    J1 -->|สำเร็จแล้ว needs| J2
    J2 -->|"scp docker-compose.prod.yml + SSH เข้า deploy@103.91.190.181"| VPS

    subgraph VPS["VPS 103.91.190.181 (Ubuntu 24.04)"]
        LOGIN["docker login ghcr.io<br>ใช้ (4) GHCR_PAT + (5) GHCR_USERNAME"]
        PULL["docker compose --profile tools pull"]
        UP["docker compose up -d"]
        MIG["run --rm migrate<br>(image :latest-migrate)"]
        LOGIN --> PULL --> UP --> MIG
    end

    GHCR -.->|pull image ล่าสุด| PULL
    MIG --> WEB["https://stock.aibisec.com<br>อัปเดตเป็น version ล่าสุด"]
```

## 11.2 ไฟล์ Workflow .github/workflows/ci.yml (CI + CD รวมไฟล์เดียว)

> 📌 **สำคัญ — เปลี่ยนจากแนวทางเดิม:** เดิมแยกเป็น 2 ไฟล์ (`ci.yml` สำหรับเทสต์ + `deploy.yml` สำหรับ deploy) ซึ่ง **ผิด best practice** เพราะ GitHub Actions รัน 2 ไฟล์นี้ **ขนานกันโดยไม่รอกัน** → deploy เกิดขึ้นได้แม้เทสต์ยัง fail และ build image ซ้ำ 2 รอบ
>
> ตอนนี้รวมเป็น **ไฟล์เดียว** `ci.yml` ที่เรียง job ด้วย `needs` เป็น pipeline: **`test` → `build-and-push` → `deploy`** (deploy จะไม่มีทางเกิดถ้าเทสต์ไม่ผ่าน) และลบ `deploy.yml` ทิ้ง

ใน repo stock-app-claude มีไฟล์ `.github/workflows/ci.yml` โครงสร้างดังนี้ (ตัดส่วน `test` ที่เป็น typecheck/vitest ออกให้ดูสั้น เน้น build + deploy)

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # รันทุก push + ทุก PR — typecheck + vitest (มี postgres service ให้ integration test)
  test:
    name: Type check & test
    runs-on: ubuntu-latest
    # ... (setup pnpm/node, pnpm install, prisma migrate deploy, tsc --noEmit, pnpm test)

  # build + push image (เฉพาะ push main และต้องรอ test ผ่านก่อน)
  build-and-push:
    name: Build & push Docker image
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Login to ghcr.io
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # image หลัก (แอป standalone) → :latest + :sha-xxxx
      - name: Docker metadata (tags)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/iamsamitdev/stock-app-claude
          tags: |
            type=sha,prefix=sha-
            type=raw,value=latest
      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      # image migrate (build จาก stage deps) → :latest-migrate + :sha-xxxx-migrate
      - name: Docker metadata (migrate image tags)
        id: meta-migrate
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/iamsamitdev/stock-app-claude
          flavor: |
            suffix=-migrate
          tags: |
            type=sha,prefix=sha-
            type=raw,value=latest
      - name: Build and push migrate image
        uses: docker/build-push-action@v6
        with:
          context: .
          target: deps        # <-- build แค่ถึง stage deps (มี prisma CLI + schema + tsx)
          push: true
          tags: ${{ steps.meta-migrate.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # deploy ขึ้น VPS (เฉพาะ push main และต้องรอ build-and-push ผ่านก่อน)
  deploy:
    name: Deploy to production
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # copy compose file จาก repo ขึ้น server ทุกครั้งก่อน deploy → ไฟล์บน server = ไฟล์ใน git เสมอ
      # (.env ไม่ copy — เป็น secret ที่จัดการบน server เอง)
      - name: Copy compose file to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_PRIVATE_KEY }}
          source: "docker-compose.prod.yml"
          target: "/home/deploy/stock-app"

      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_PRIVATE_KEY }}
          script: |
            set -e
            cd /home/deploy/stock-app
            echo "${{ secrets.GHCR_PAT }}" | docker login ghcr.io -u ${{ secrets.GHCR_USERNAME }} --password-stdin
            docker compose -f docker-compose.prod.yml --profile tools pull
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
            docker image prune -f
            docker compose -f docker-compose.prod.yml ps
```

จุดที่เปลี่ยนจากสคริปต์เดิม (สำคัญ):
- ✅ เพิ่ม step **`scp` copy `docker-compose.prod.yml` ขึ้น server** ก่อน deploy — เพราะ workflow **ไม่ได้ sync ไฟล์ compose ให้อัตโนมัติ** ถ้าไม่ copy ไฟล์บน server จะเป็นของเก่าค้างตลอด (เดิมต้อง SSH เข้าไปแก้เอง)
- ✅ migration เปลี่ยนจาก `exec -T app npx prisma migrate deploy` → **`--profile tools run --rm migrate`** (ใช้ image `:latest-migrate` เพราะ app standalone ไม่มี prisma CLI)
- ✅ `pull` เพิ่ม `--profile tools` เพื่อดึง image `migrate` มาด้วย

## 11.3 ทดสอบระบบ CI/CD ทั้งวงจร

บนเครื่องเรา แก้ไขอะไรเล็กน้อยในโปรเจ็กต์ (เช่น ข้อความในหน้าแรก) แล้ว

```bash
git add .
git commit -m "test: trigger production deploy"
git push origin main
```

จากนั้นเข้า GitHub > repo stock-app-claude > แท็บ **Actions**

1. จะเห็น workflow **"CI/CD"** กำลังรัน (จุดสีเหลืองหมุน)
2. Job `Type check & test` เสร็จก่อน (เครื่องหมายถูกเขียว)
3. Job `Build & push Docker image` รันต่อ (build ทั้ง `:latest` + `:latest-migrate`)
4. Job `Deploy to production` รันต่อจนเขียวทั้งหมด
5. เปิด https://stock.aibisec.com ต้องเห็นการเปลี่ยนแปลงที่เรา push ไป

เท่านี้ทุกครั้งที่ push ขึ้น branch main ระบบจะ **test → build → deploy** ให้อัตโนมัติ (ถ้า test fail จะหยุด ไม่ deploy)

---

# Part 12: การดูแลระบบหลัง Deploy

## 12.1 Backup ฐานข้อมูลอัตโนมัติทุกวัน

รันบน server

```bash
# สร้างโฟลเดอร์เก็บ backup
mkdir -p /home/deploy/backups

# ทดสอบ backup ทันที 1 ครั้ง
cd /home/deploy/stock-app
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U stockuser stockdb > /home/deploy/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# ตรวจว่าไฟล์ถูกสร้างและมีขนาด
ls -lh /home/deploy/backups/
```

ตั้ง cron job ให้ backup ทุกวันตี 2

```bash
crontab -e
# ครั้งแรกระบบถามว่าใช้ editor ไหน เลือกหมายเลขของ nano
```

เพิ่มบรรทัดนี้ท้ายไฟล์ แล้วบันทึก

```
0 2 * * * cd /home/deploy/stock-app && docker compose -f docker-compose.prod.yml exec -T db pg_dump -U stockuser stockdb > /home/deploy/backups/db_$(date +\%Y\%m\%d).sql 2>&1
```

ลบ backup เก่ากว่า 30 วันอัตโนมัติ (เพิ่มอีกบรรทัดใน crontab)

```
30 2 * * * find /home/deploy/backups -name "*.sql" -mtime +30 -delete
```

## 12.2 การดู Log และ Monitor ระบบ

```bash
cd /home/deploy/stock-app

docker compose -f docker-compose.prod.yml logs -f            # log realtime ทุก service (Ctrl+C เพื่อออก)
docker compose -f docker-compose.prod.yml logs app --tail=50 # log 50 บรรทัดล่าสุดของแอป
docker stats                                                 # CPU/RAM ของแต่ละ container
sudo tail -f /var/log/nginx/access.log                       # ใครเข้าเว็บบ้าง
sudo tail -f /var/log/nginx/error.log                        # ข้อผิดพลาดฝั่ง nginx
df -h                                                        # พื้นที่ disk คงเหลือ
free -h                                                      # RAM คงเหลือ
```

## 12.3 Rollback กลับ version เก่าเมื่อ deploy แล้วพัง

สร้างไฟล์ `rollback.sh` บน server

```bash
nano /home/deploy/stock-app/rollback.sh
```

```bash
#!/bin/bash
IMAGE_TAG=$1
[[ -z "$IMAGE_TAG" ]] && echo "Usage: $0 IMAGE_TAG" && exit 1

cd /home/deploy/stock-app
sed -i "s/:latest/:${IMAGE_TAG}/g" docker-compose.prod.yml
docker compose -f docker-compose.prod.yml --profile tools pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
docker compose -f docker-compose.prod.yml ps
```

```bash
chmod +x /home/deploy/stock-app/rollback.sh
```

วิธีใช้: ดู tag เก่าได้ที่ GitHub > repo > Packages > stock-app-claude (จะเห็น tag แบบ `sha-a1b2c3d`) แล้วรัน

```bash
./rollback.sh sha-a1b2c3d
```

หลัง rollback เสร็จ อย่าลืมแก้ `docker-compose.prod.yml` กลับมาใช้ `:latest` เมื่อแก้ปัญหาเรียบร้อยแล้ว

---

# Troubleshooting ปัญหาที่มือใหม่เจอบ่อย

| อาการ | สาเหตุที่พบบ่อย | วิธีแก้ |
|---|---|---|
| ssh ไม่เข้า ถาม password ตลอด | authorized_keys ผิด permission หรือวาง key ผิด | ตรวจ chmod 700 `.ssh` / 600 `authorized_keys` และ key ต้องอยู่บรรทัดเดียว |
| docker: permission denied | ยังไม่ได้ logout/login หลัง usermod | `exit` แล้ว `ssh stockapp` ใหม่ |
| pull image ไม่ได้ (denied) | PAT หมดอายุ หรือไม่มีสิทธิ์ read:packages หรือ package เป็น private | สร้าง PAT ใหม่ หรือเช็ค Package settings |
| เปิดโดเมนไม่ขึ้น | DNS ยังไม่ propagate หรือ UFW ไม่เปิด 80/443 | เช็ค dnschecker.org และ `sudo ufw status` |
| certbot ล้มเหลว | DNS ยังไม่ชี้มาที่ server หรือ Cloudflare proxy เปิดอยู่ | รอ DNS หรือปิด proxy เป็น DNS only ก่อน |
| 502 Bad Gateway | container app ไม่ทำงาน | `docker compose -f docker-compose.prod.yml ps` และดู `logs app` |
| Actions job deploy ล้มเหลว | Secret ผิด โดยเฉพาะ private key ไม่ครบไฟล์ | วาง key ใหม่ทั้งไฟล์รวมบรรทัด BEGIN/END |
| Database ต่อไม่ติด | .env ไม่ตรงกับ DATABASE_URL | เช็คค่าใน .env และ restart ด้วย `up -d` |
| migrate `exec app npx prisma` error (ไม่มี prisma CLI) | app เป็น standalone image ตัด prisma ทิ้ง | ใช้ `--profile tools run --rm migrate` (image `:latest-migrate`) แทน |
| migrate `P1001: Can't reach database server at db:5432` ทั้งที่ db healthy | service alias `db` ไม่ถูก register ใน embedded DNS (`nslookup db` = SERVFAIL แต่ container name resolve ได้) — มักเกิดหลัง `systemctl restart docker` | **recreate เต็ม:** `docker compose ... down && docker compose ... up -d` (volume ไม่หายถ้าไม่ใส่ `-v`) ดูรายละเอียด Appendix A |
| container คุยกันไม่ได้ (แต่ resolve ชื่อได้) | DNS/alias ปัญหา ไม่ใช่ firewall | เทียบ `pg_isready -h db` กับ `-h <ip>` และ `nslookup db` จาก container สด — ดู Appendix A |

---

# Appendix A: Postmortem — CD fail เพราะ migrate ต่อ db ไม่ได้ (P1001) จากปัญหา DNS alias

บันทึกจากเคสจริง (2026-07): CI ผ่าน แต่ CD fail ทุกครั้งที่ step migrate ด้วย error `P1001: Can't reach database server at db:5432` ทั้งที่ container `db` ขึ้น `healthy` ปกติ กว่าจะเจอต้นตอต้องไล่หลายชั้น — สรุปไว้กันเสียเวลาในอนาคต

## อาการ
- `docker compose ps` → db `Up (healthy)`, app `Up`
- migrate (one-off) → `P1001: Can't reach database server at db:5432` ทุก attempt (รอ ~5 วิ/ครั้งแล้ว fail)

## ขั้นตอนไล่หา (ตัดทีละชั้น)

| ทดสอบ | คำสั่ง | ผล/ความหมาย |
|---|---|---|
| db listen TCP ไหม | `docker exec stock-app-db-1 pg_isready -h 172.18.0.2 -p 5432 -U stockuser` | `accepting` → postgres ปกติ |
| container คุยกันได้ไหม (by IP) | `docker run --rm --network stock-app_app-network postgres:16-alpine pg_isready -h 172.18.0.2 -p 5432 -U stockuser` | `accepting` → **network L3/L4 ปกติ** |
| resolve ชื่อ service ได้ไหม | `docker run --rm --network stock-app_app-network postgres:16-alpine nslookup db` | **SERVFAIL** ← ตัวการ |
| resolve container name ได้ไหม | `... nslookup stock-app-db-1` | `172.18.0.2` → DNS engine ปกติ แต่ **alias `db` หาย** |
| db register alias อะไรไว้ | `docker inspect stock-app-db-1 --format '{{json .NetworkSettings.Networks}}'` | `DNSNames: ["stock-app-db-1", "<shortid>"]` — **ไม่มี "db"** |

## Root cause
Docker Compose ปกติจะลงทะเบียน **service name (`db`) เป็น network alias** ใน embedded DNS (127.0.0.11) แต่ container `db` ตัวนี้ถูกสร้างมาแบบ**ไม่มี alias `db`** แล้วไม่เคยถูก recreate เลย (ทุก deploy มัน "Running" ไม่ใช่ "Recreated" เพราะ config db ไม่เปลี่ยน) → `db` resolve ไม่ได้ = SERVFAIL → app/migrate ต่อ `db:5432` ไม่ติด

จุดที่หลอกให้ไขว้เขว: อาการ "รอ 5 วิแล้ว fail" **ไม่ใช่** TCP timeout แต่เป็น **DNS lookup timeout** (resolv.conf timeout default = 5 วิ) และ embedded DNS forward ชื่อที่หาไม่เจอไป upstream (`127.0.0.53`) จนได้ SERVFAIL

## วิธีแก้ (ที่ได้ผลจริง)
```bash
cd /home/deploy/stock-app
docker compose -f docker-compose.prod.yml down     # ลบ container + network (volume ไม่หาย ถ้าไม่ใส่ -v)
docker compose -f docker-compose.prod.yml up -d     # สร้างใหม่หมด → db ได้ alias "db" กลับมา

# verify — ต้องได้ accepting
docker run --rm --network stock-app_app-network postgres:16-alpine \
  pg_isready -h db -p 5432 -U stockuser
```

## บทเรียน / กันซ้ำ
- **`systemctl restart docker` หรือ `restart` เดี่ยว ๆ ไม่ re-register service alias ให้สะอาด** — ถ้าต้องรื้อ network/DNS ให้ใช้ `compose down && up` เสมอ (อย่าใช้แค่ restart)
- วิธีเช็คเร็ว ๆ ว่าเป็นปัญหา DNS หรือ network: เทียบ `pg_isready -h db` (ชื่อ) กับ `-h <ip>` (IP) — ถ้า **IP ได้ แต่ชื่อไม่ได้ = DNS/alias** ไม่ใช่ firewall
- เรื่อง ufw (`DEFAULT_FORWARD_POLICY`) **ไม่ใช่ตัวการ** ในเคสนี้ (traffic ระหว่าง container บน bridge เดียวกันเป็น L2 ไม่ผ่าน iptables — เครื่องนี้ `br_netfilter` ไม่ได้โหลดด้วยซ้ำ) — ถ้าจะปรับ ufw ก็ไม่เสียหาย แต่ไม่เกี่ยวกับอาการนี้

---

# สถาปัตยกรรมระบบโดยรวม

```
ผู้ใช้งาน (Browser)
   |
   v
https://stock.aibisec.com (DNS A Record -> 103.91.190.181)
   |
   v
HTTPS :443 / HTTP :80 (redirect 301)
   |
   v
Nginx Reverse Proxy (SSL จาก Let's Encrypt, gzip, cache)
   |
   v
proxy_pass -> http://127.0.0.1:3000
   |
   v
Docker Container: Next.js (ghcr.io/iamsamitdev/stock-app-claude)
   |
   v
Prisma ORM
   |
   v
Docker Container: PostgreSQL 16 (:5432 ภายใน network เท่านั้น)
   |
   v
Volume: postgres_data (ข้อมูลถาวร)

GitHub (push main) -> GitHub Actions (ci.yml) -> test -> build 2 image (:latest + :latest-migrate) -> ghcr.io -> scp compose + SSH deploy -> Server -> run --rm migrate
```

---

# Checklist สรุปความสำเร็จ

- [ ] จดโดเมนและตั้ง A Record: stock.aibisec.com ชี้ไป 103.91.190.181 (dig ตอบถูก)
- [ ] SSH เข้า server ด้วย key ได้ (`ssh stockapp`) และ root/password login ถูกปิด
- [ ] UFW เปิดเฉพาะ OpenSSH, 80, 443 และ fail2ban ทำงาน
- [ ] Docker และ Docker Compose ติดตั้งสำเร็จ รันได้โดยไม่ต้อง sudo
- [ ] docker-compose.prod.yml และ .env (chmod 600) พร้อมบน server
- [ ] Container db (healthy) และ app (Up) รันปกติ พร้อม migrate สำเร็จ (ผ่าน `--profile tools run --rm migrate`)
- [ ] `nslookup db` จาก container สดบน network resolve เจอ (service alias ปกติ — ดู Appendix A)
- [ ] (ถ้าต้องการ) seed ข้อมูลตัวอย่างสำเร็จตอน DB ยังว่าง
- [ ] Nginx reverse proxy ทำงาน เปิดผ่านโดเมนได้
- [ ] HTTPS ทำงาน มี padlock และ `certbot renew --dry-run` ผ่าน
- [ ] Push code ขึ้น main แล้ว GitHub Actions (CI/CD) รัน test → build → deploy อัตโนมัติสำเร็จ
- [ ] ระบบ backup อัตโนมัติทุกวันตี 2 และ rollback.sh พร้อมใช้งาน

---

# เอกสารอ้างอิง

- ต้นฉบับ: [Day5_note.md - claude-code-deep-dive](https://github.com/iamsamitdev/claude-code-deep-dive/blob/main/Notes/Day5_note.md)
- Repository โปรเจ็กต์: [stock-app-claude](https://github.com/iamsamitdev/stock-app-claude)
- Install Docker Engine on Ubuntu: https://docs.docker.com/engine/install/ubuntu/
- Certbot Instructions (Nginx + Ubuntu): https://certbot.eff.org/instructions
- Nginx Reverse Proxy Guide: https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/
- UFW - Ubuntu Documentation: https://help.ubuntu.com/community/UFW
- fail2ban Official: https://github.com/fail2ban/fail2ban
- GitHub: Managing your personal access tokens: https://docs.github.com/en/authentication/keeping-your-account-secure/managing-your-personal-access-tokens
- GitHub Actions - Publishing Docker images: https://docs.github.com/en/actions/publishing-packages/publishing-docker-images
- appleboy/ssh-action: https://github.com/appleboy/ssh-action
- Cloudflare DNS Records: https://developers.cloudflare.com/dns/manage-dns-records/
- DNS Checker: https://dnschecker.org
