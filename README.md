# Fiship — Cá tươi mỗi ngày

Website thương mại điện tử bán cá tươi / hải sản, xây dựng full-stack bằng Nuxt 4 (Nuxt Server API làm backend), Prisma ORM và PostgreSQL.

## Tech stack

- **Frontend**: Nuxt 4, Vue 3, TypeScript, Tailwind CSS, Nuxt UI, Pinia
- **Backend**: Nuxt Server API (`server/api`), TypeScript, Prisma ORM (driver adapter `@prisma/adapter-pg`)
- **Database**: PostgreSQL (schema `fiship` trong database `e_commerce`)
- **Auth**: `nuxt-auth-utils` (sealed HTTP-only session cookie) + `bcryptjs` cho password hashing

## Yêu cầu môi trường

- Node.js ≥ 20
- PostgreSQL đang chạy local hoặc remote

## Cài đặt

```bash
npm install
cp .env.example .env
# Sửa .env: điền đúng mật khẩu Postgres và một NUXT_SESSION_PASSWORD ngẫu nhiên ≥ 32 ký tự
```

Tạo schema `fiship` trong database (nếu chưa có):

```sql
CREATE DATABASE e_commerce;
\c e_commerce
CREATE SCHEMA IF NOT EXISTS fiship;
```

Chạy migration và tạo Prisma Client:

```bash
npm run db:migrate
```

Seed dữ liệu mẫu (5 danh mục, 25 sản phẩm, 1 admin, 3 khách hàng — **script này sẽ xoá sạch dữ liệu hiện có** trước khi seed):

```bash
npm run db:seed
```

Tài khoản sau khi seed:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@fiship.vn` | `Admin@123456` |
| Customer | `an.nguyen@example.com` | `Customer@123` |

> Đổi mật khẩu admin ngay sau khi triển khai thật.

## Chạy dev

```bash
npm run dev
```

Mở `http://localhost:3000`. Trang quản trị tại `/admin` (đăng nhập bằng tài khoản admin ở trên).

## Build production

```bash
npm run build
node .output/server/index.mjs
```

Server đọc biến môi trường trực tiếp từ `process.env` (không tự động đọc file `.env` khi chạy bản build) — khi deploy, hãy đảm bảo `DATABASE_URL`, `DB_SCHEMA`, `NUXT_SESSION_PASSWORD` đã được set thật (qua platform env vars, hoặc `source .env` trước khi chạy).

## Các script hữu ích

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm run typecheck` | Kiểm tra TypeScript toàn bộ dự án |
| `npm run db:migrate` | Tạo/áp dụng Prisma migration (dev) |
| `npm run db:deploy` | Áp dụng migration đã có (production) |
| `npm run db:seed` | Xoá sạch dữ liệu và seed lại dữ liệu mẫu |
| `npm run db:studio` | Mở Prisma Studio để xem/sửa dữ liệu |
| `npm run db:reset` | Reset database (drop + migrate lại) |

## Kiến trúc thư mục

```text
app/                  Frontend (Nuxt 4 srcDir)
  components/         storefront/, account/, admin/
  layouts/            default.vue (storefront), admin.vue (dashboard)
  pages/              routing theo file
  stores/             Pinia (cart)
  composables/, utils/
  middleware/         auth.ts (customer), admin.ts (admin)

server/
  api/                REST endpoints (Nuxt Server API)
  routes/uploads/      route stream file ảnh đã upload (ngoài build pipeline của public/)
  services/           business logic (gọi Prisma trực tiếp)
  utils/              prisma client singleton, error handling, schemas Zod, cart/guest-order cookie, rate-limit...
  generated/prisma/   Prisma Client đã generate (gitignored, tự tạo lại bằng `npx prisma generate`)

shared/
  schemas/            Zod schemas dùng chung giữa client & server (auth, address, order)
  types/               TypeScript types cho response API, dùng chung app/ và server/

prisma/
  schema.prisma
  migrations/
  seed.ts

uploads/              Ảnh sản phẩm admin upload lúc runtime (gitignored, xem server/services/upload.service.ts)
```

## Ghi chú triển khai

- **Giá & tồn kho**: server luôn tính lại giá và kiểm tra tồn kho từ database khi tạo đơn hàng — không tin dữ liệu giá gửi từ client.
- **Ảnh upload**: lưu ở thư mục `uploads/` (ngoài `public/`) và được một Nitro route stream lại tại runtime, để hoạt động đúng cả ở `nuxt dev` lẫn bản build production (khác với ảnh trong `public/` chỉ được snapshot lúc build).
- **Thanh toán**: hiện chỉ COD hoạt động đầy đủ; enum `PaymentMethod` đã có sẵn `VNPAY`/`MOMO`/`ZALOPAY` để mở rộng sau.
- **Prisma 7**: generator `client` dùng `moduleFormat = "cjs"` — cần thiết để tránh lỗi `import.meta.url` khi Nitro bundle client đã generate vào một file duy nhất lúc build production trên Windows.
