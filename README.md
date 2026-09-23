# 🏟️ SportRental — ระบบจองสนามกีฬาออนไลน์

ค้นหา / จองสนามกีฬา **พร้อมเช่าอุปกรณ์** ชำระเงินจำลองผ่าน **PromptPay QR** และมีแดชบอร์ดสำหรับเจ้าของสนาม (Admin)
Frontend **Vue 3 + Vite** · Backend **Node.js (Express) + SQLite** · Deploy บน **Render**

> ## 🌐 🔴 ลองเล่น (Live Demo)
>
> **[https://rental-d9hq.onrender.com](https://rental-d9hq.onrender.com)**
>
> 👤 **Admin:** `admin@gmail.com` / `123456` · 👤 **ผู้ใช้:** สมัครได้ที่หน้า Register

## ✨ ฟีเจอร์หลัก

- **ระบบสมาชิก** – สมัคร/เข้าสู่ระบบด้วย JWT แยกสิทธิ์ `user` (ลูกค้า) และ `admin` (เจ้าของสนาม)
- **จัดการสนามกีฬา** – เพิ่ม / แก้ไข / ลบสนาม, อัปโหลดรูปสนาม, ตรวจสอบช่วงเวลาว่าง (availability)
- **จองสนาม** – เลือกสนาม + ช่วงเวลา + เช่าอุปกรณ์เสริม แล้วเข้าสู่หน้าชำระเงินทันที
- **ชำระเงินจำลอง** – หน้า Checkout สรุปยอด + สร้าง **QR PromptPay** (สแกนจ่าย) หรือบัตรเครดิต (หน้าจำลอง) → ยืนยันแล้วสถานะเป็น `confirmed`
- **เช็คอินที่สนาม** – หน้ารายละเอียดการจองแสดง **QR สำหรับเช็คอิน** ให้เจ้าหน้าที่สแกนยืนยัน
- **รีวิวสนาม** – ให้คะแนน/คอมเมนต์หลังใช้งาน
- **แดชบอร์ด Admin** – สถิติ, จัดการผู้ใช้, จัดการอุปกรณ์, ดู Audit Log
- **Real-time** – แจ้งเตือน/อัปเดตผ่าน Socket.io

## 🔄 ขั้นตอนการใช้งาน (User Flow)

```
หน้าแรก (ค้นหา/กรอง)  →  เลือกสนาม  →  เลือกช่วงเวลา + อุปกรณ์เสริม
        │
        ▼
   สร้างการจอง  (status: pending-payment)
        │
        ▼
   หน้าชำระเงิน (/checkout)  →  PromptPay QR  หรือ  บัตรเครดิต (จำลอง)
        │
        ▼
   ยืนยันการชำระเงิน  →  status: confirmed, paid: true  →  หน้าสรุปการจอง
        │
        ▼
   ประวัติการจอง  (การจองที่ยังไม่จ่ายมีปุ่ม "ชำระเงิน" ให้กดชำระได้)
        │
        ▼
   หน้ารายละเอียดการจอง  →  QR สำหรับเช็คอิน  →  เจ้าหน้าที่สแกน  →  status: checked-in
```

## 🗂️ โครงสร้างโปรเจกต์

```
Rental/
├─ client/                       # Frontend (Vue 3 + Vite)
│  ├─ index.html
│  ├─ vite.config.js
│  └─ src/
│     ├─ main.js                 # entry point ของ Vue
│     ├─ App.vue
│     ├─ router/                 # กำหนดเส้นทางหน้าเว็บ + guard auth
│     ├─ stores/                 # Pinia (authen.js, booking.js)
│     ├─ services/               # เรียก API ผ่าน Axios
│     ├─ components/             # หน้า/ส่วนประกอบ UI (fields, bookings, admin, Users…)
│     └─ views/
├─ server/                       # Backend (Express + Sequelize)
│  ├─ src/
│  │  ├─ app.js                  # entry point ของ API
│  │  ├─ routes.js               # รวม endpoint ทั้งหมด
│  │  ├─ config/config.js        # port, ฐานข้อมูล, JWT secret
│  │  ├─ models/                 # Sequelize models (User, Field, Booking, Equipment, Review, AuditLog)
│  │  ├─ controllers/            # logic ของแต่ละ route
│  │  ├─ middleware/             # upload รูปภาพ ฯลฯ
│  │  ├─ seed.js                 # สร้างข้อมูลตัวอย่าง (รันได้ด้วยคำสั่ง npm run seed)
│  │  └─ socket.js               # ตั้งค่า Socket.io
│  ├─ public/uploads/            # พื้นที่เก็บรูปที่อัปโหลด
│  └─ coffeeshop-db.sqlite       # 🗄️ ฐานข้อมูล SQLite (ไฟล์เดียวจบ ไม่ต้องติดตั้ง DB)
└─ deploy/                       # ไฟล์ช่วย Deploy ขึ้นเซิร์ฟเวอร์ (EC2 + PM2)
```

## ✅ สิ่งที่ต้องเตรียม (Prerequisites)

- **Node.js** เวอร์ชัน 20.19 ขึ้นไป หรือ 22.12 ขึ้นไป (Vite 7 / Express 5 ต้องการ Node ใหม่) — แนะนำ LTS
- **npm** (มาพร้อมกับ Node)
- ไม่ต้องติดตั้งฐานข้อมูลภายนอก เพราะใช้ **SQLite** เป็นไฟล์ในโปรเจกต์แล้ว

> ตรวจสอบเวอร์ชัน Node/npm: `node -v && npm -v`

## 🚀 วิธีรัน (Local)

ตอนนี้ Backend ทำหน้าที่ **serve ทั้งหน้าเว็บและ API บนพอร์ตเดียว (`8081`)** แล้ว จึงรันได้ 2 แบบ:

### แบบ A — รันแบบ production (แนะนำ พอร์ตเดียว 8081)

```bash
# 1) ติดตั้ง + build หน้าเว็บ
cd client
npm install
npm run build            # สร้างไฟล์ static ลง client/dist

# 2) ติดตั้ง + รัน Backend (serve หน้าเว็บ + API พร้อมกัน)
cd ../server
npm install
npm start
```

แล้วเปิดเบราว์เซอร์ไปที่ **http://localhost:8081** ได้เลย ✅ (ไม่มี `Cannot GET /` อีกต่อไป)

### แบบ B — รันแบบ development (Hot reload)

เปิด **2 เทอร์มินัล** พร้อมกัน:

| หน้าต่าง | คำสั่ง | URL |
|---|---|---|
| เทอร์มินัล 1 (Backend/API) | `cd server && npm install && npm start` | http://localhost:8081 |
| เทอร์มินัล 2 (Frontend dev) | `cd client && npm install && npm run dev` | http://localhost:5173 |

> Vite dev server ถูกตั้ง proxy `/api` และ `/socket.io` ไปที่ `http://localhost:8081` ไว้แล้วใน `client/vite.config.js` — จึงไม่ต้องแก้ URL ใด ๆ

### หมายเหตุ: API ใช้ prefix `/api`

API ทั้งหมดถูกย้ายไปอยู่ใต้ `/api/*` (เช่น `GET /api/fields`, `POST /api/login`) เพื่อไม่ชนกับเส้นทางของหน้าเว็บ

## 🧪 ทดสอบ (Tests)

Backend มี automated tests (Vitest + Supertest) แล้ว:

```bash
cd server
npm install
npm test    # 7 tests: register / login / wrong-password / duplicate / protected-route / fields
```

## 🔑 บัญชีสำหรับทดลองใช้

| บทบาท | อีเมล | รหัสผ่าน |
|---|---|---|
| Admin | `admin@gmail.com` | `123456` |
| Admin (จาก seed script) | `admin@rental.local` | `admin123` |
| User | สมัครใหม่ได้ที่หน้า Register | — |

> ข้อมูลแอดมินด้านบนอยู่ในฐานข้อมูลจริง (`server/coffeeshop-db.sqlite`) แล้ว พร้อมใช้งานได้ทันที

## 🗄️ ฐานข้อมูล และการ Seed ข้อมูล

- ระบบใช้ **SQLite** เก็บในไฟล์ `server/coffeeshop-db.sqlite` — มีข้อมูลพร้อมใช้แล้ว
- เมื่อ Backend เริ่มทำงาน Sequelize จะ `sync()` สร้างตารางที่ยังไม่มีให้อัตโนมัติ
- ถ้าต้องการสร้าง **ข้อมูลตัวอย่าง** (สนาม/อุปกรณ์/แอดมิน) หรือการันตีว่าแอดมินมีอยู่:

```bash
cd server
npm run seed
```

> `seed.js` จะสร้างตาราง + เพิ่มสนามตัวอย่าง 2 สนาม, อุปกรณ์ 8 รายการ และแอดมิน `admin@rental.local / admin123` (ไม่ลบข้อมูลเดิม — เช็คก่อนสร้างจึงรันซ้ำได้อย่างปลอดภัย)

## ⚙️ ค่าตั้งค่า (Configuration)

ค่าทั้งหมดอยู่ที่ `server/src/config/config.js` และอ่านจาก Environment Variables:

| ตัวแปร | ค่าเริ่มต้น | รายละเอียด |
|---|---|---|
| `PORT` | `8081` | พอร์ตของ API Server |
| `JWT_SECRET` | `secret` | secret สำหรับเซ็น JWT |

ตัวอย่างการเปลี่ยนพอร์ต (Windows PowerShell):

```powershell
$env:PORT=9000
cd server
npm start
```

> หน้า Frontend เรียก API แบบ relative (`/api`) — ไม่ต้องแก้ URL เมื่อ deploy ไปยัง host อื่น (ในโหมด dev ใช้ Vite proxy ไปที่ 8081 อัตโนมัติ)

## 📦 สร้าง Production Build

```bash
cd client
npm install
npm run build          # ผลลัพธ์อยู่ที่ client/dist
```

## ☁️ Deploy ฟรี (แนะนำ: Render)

โปรเจกต์นี้เป็น **single-service** (Backend serve หน้าเว็บ + API บนพอร์ตเดียว) จึง deploy ขึ้น Render ได้ง่าย:

1. อัปโหลดโค้ดขึ้น GitHub/GitLab (อย่าลืม commit `server/coffeeshop-db.sqlite` ไปด้วยเพื่อให้มีข้อมูลติดไป)
2. ที่ [render.com](https://render.com) → **New → Web Service** → เลือก repo
3. ตั้งค่า:
   - **Build Command:** `cd server && npm install && cd ../client && npm install && npm run build`
   - **Start Command:** `cd server && node src/app.js`
   - **Environment Variable:** `JWT_SECRET` = ค่าสุ่มใด ๆ (เช่น `my-super-secret`)
4. กด Deploy → Render จะให้ URL มาใช้ได้เลย (Render ใส่ `PORT` ให้อัตโนมัติ ซึ่ง server อ่านจาก `process.env.PORT` อยู่แล้ว)

> ⚠️ ข้อจำกัด Free tier: Render free ใช้ disk ชั่วคราว (ephemeral) → ข้อมูล SQLite อาจถูกรีเซ็ตเมื่อ **redeploy** (แค่ restart ไม่หาย) — เหมาะสำหรับ demo/ส่งงาน แต่ถ้าอยากให้ข้อมูลอยู่ถาวร ควรเปลี่ยนไปใช้ Postgres/MySQL ฟรี (เช่น Neon/Supabase) ภายหลัง

หรือ deploy บนเซิร์ฟเวอร์ EC2 + PM2 ตามคำแนะนำใน **[`deploy/README.md`](deploy/README.md)**

## 🛠️ ปัญหาที่พบบ่อย (Troubleshooting)

- **เข้าหน้าเว็บแล้วข้อมูลไม่ขึ้น / เรียก API ไม่ได้** → ตรวจว่า Backend รันอยู่ที่พอร์ต 8081 ก่อน (ลองเปิด `http://localhost:8081/api/fields`)
- **พอร์ต 8081 ไม่ว่าง (EADDRINUSE)** → ปิดโปรแกรมที่ครอบพอร์ตอยู่ หรือเปลี่ยนพอร์ตตามหัวข้อ Configuration
- **ติดตั้ง npm แล้ว error เรื่อง bcrypt / sqlite3** → ใช้ Node.js LTS (เช่น 20.x/22.x) แล้วลบ `node_modules` + `package-lock.json` ในโฟลเดอร์นั้นก่อนรัน `npm install` ใหม่
- **เปิดหน้าเว็บไม่ขึ้นตอน `npm run dev`** → ตรวจว่าไฟร์วอลล์ไม่ได้บล็อกพอร์ต 5173 และรันคำสั่งในโฟลเดอร์ `client/`
- **จำรหัสผ่านแอดมินไม่ได้** → รัน `npm run seed` ที่โฟลเดอร์ `server/` จะสร้าง/การันตีแอดมิน `admin@rental.local / admin123`

---

**หมายเหตุ:** ไม่จำเป็นต้อง `npm install` ที่โฟลเดอร์ root (มี `package.json` ไว้สำหรับ dependency ย่อยเท่านั้น) — ให้ install ที่ `server/` และ `client/` แทน
