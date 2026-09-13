# Roadmap — Storefront gaps vs reference sites

Ghi lại ngày 2026-09-06, sau khi so sánh storefront fiship với 2 site cá tham khảo:
- **Cá Ngừ Đại Dương** — nặng về nội dung/widget
- **Fish and More VN** — nặng về filter/UX

Đây là backlog để làm dần qua nhiều phiên, không cần làm hết một lần. Trước khi bắt đầu một mục, kiểm tra lại code hiện tại vì có thể đã được làm từ lúc ghi danh sách này.

## Priority 1 — Quick UX wins (header/widgets) — ✅ Done (2026-09-06)

- [x] Mega-menu dropdown danh mục trong `AppHeader.vue`
- [x] Số hotline hiển thị ở header
- [x] Nút chat nổi Zalo/Messenger (`FloatingContact.vue`)
- [x] Nút scroll-to-top (`FloatingContact.vue`)
- [x] Breadcrumb ở trang danh sách sản phẩm/danh mục

## Priority 2 — Content — ✅ Done (2026-09-06)

- [x] Mục Blog/Tin tức (`/blog`, model `Post` dùng chung với recipe qua field `type`)
- [x] Mục Tư vấn món ngon / recipe (`/recipes`, cùng model `Post`)
- [x] Banner/slider trang chủ quản lý qua CMS (model `Banner`, admin `/admin/banners`, fallback về hero tĩnh cũ nếu chưa có banner nào)
- [x] Trang liên hệ có form submit thật (`/api/contact` lưu vào `ContactMessage`, admin inbox `/admin/contacts`)

## Priority 3 — Advanced product filtering (schema/backend lớn hơn)

Site tham khảo "Fish and More VN" filter theo: Thương hiệu, Trọng lượng, Xứ biển, Đơn vị, Size, Họ (species/family), Khối lượng, cùng quick-filter tag chips (vd "Cá fillet", "Ready to BBQ").

`productListQuerySchema` (`server/utils/schemas/product.schema.ts`) hiện chỉ hỗ trợ: category, minPrice/maxPrice, inStock, q (text search), sort.

- [x] ~~Lọc theo Xứ biển (Origin)~~ — đã cài rồi **gỡ bỏ theo yêu cầu ngày 2026-09-06**: fiship hiện chỉ nhập hàng từ 1 nguồn, filter theo xứ biển không có ý nghĩa với mô hình kinh doanh hiện tại. Đừng làm lại mục này trừ khi fiship mở rộng nhập nhiều nguồn.
- [x] Lọc theo Đơn vị/Trọng lượng (2026-09-06, dùng `ProductVariant.unit` có sẵn — sidebar `/products` và `/categories/[slug]`)
- [x] Tag nhanh (2026-09-06) — model `Tag` mới (m2m với `Product`), quản lý ở `/admin/tags`, gắn tag trong `ProductForm`, hiển thị dạng chip lọc nhanh trên storefront. Admin cần tự tạo tag và gắn cho sản phẩm — chưa có tag mặc định nào.
- [ ] Thương hiệu + Họ cá (species) — cần field mới VÀ phải tự nhập giá trị thật cho từng sản phẩm, hiện catalog không có dữ liệu này. Nên hỏi lại mức độ cần thiết trước khi làm, giống origin có thể không áp dụng được cho mô hình kinh doanh của fiship.

## Không cần làm lại — đã có sẵn

Wishlist, đánh giá/rating sản phẩm (có kiểm duyệt), hệ thống coupon/giảm giá, mục sản phẩm liên quan, các carousel trang chủ (bán chạy/mới/khuyến mãi), trang FAQ, trang chính sách vận chuyển.

- [x] ~~Chính sách đổi trả~~ — đã gỡ bỏ theo yêu cầu ngày 2026-09-13 (link footer, mục `#doi-tra` trên `/policy`, câu hỏi liên quan trên `/faq`). Hàng tươi sống nên không áp dụng đổi trả; đừng thêm lại trừ khi có yêu cầu mới.

## Bảng màu thương hiệu — ✅ Đã wire vào theme (2026-09-06)

Chọn ngày 2026-09-06: **Xanh dương lạnh + Trắng**, gợi cảm giác biển/hải sản đông lạnh tươi sạch.

| Vai trò | Màu | Hex | Dùng cho |
|---|---|---|---|
| Primary (xanh đậm) | Xanh dương đậm | `#0B5ED7` hoặc `#023E8A` | Header, logo, nút chính |
| Accent (xanh băng) | Xanh cyan/băng | `#48CAE4` hoặc `#90E0EF` | Hover, icon, highlight |
| Base background | Trắng | `#FFFFFF` | Nền trang chính |
| Secondary background | Xám nhạt | `#F1F3F5` | Nền phụ, product card |

Đã wire cả 2 mã màu mỗi vai trò làm 2 sắc độ trong cùng 1 dải màu (không chọn 1 bỏ 1):
- **Primary → `ocean`**: `#0B5ED7` = shade 600 (giá trị mặc định dùng cho nút/link), `#023E8A` = shade 900 (dùng cho hover/dark mode). Định nghĩa ở `app/assets/css/main.css` (`--color-ocean-*`), map vào Nuxt UI qua `app/app.config.ts` (`ui.colors.primary = 'ocean'`).
- **Accent → `secondary`/`ice`**: `#48CAE4` = shade 400 (mặc định), `#90E0EF` = shade 200 (sắc độ sáng hơn). Cùng file `main.css`/`app.config.ts`, map vào `ui.colors.secondary = 'ice'`.
- Base background/Secondary background gần khớp mặc định của Nuxt UI sẵn có nên chưa đổi `neutral` — nếu thấy nền/border chưa đúng ý thì báo lại.

Nếu muốn đảo ngược (mã nhạt làm mặc định, mã đậm làm shade phụ) thì chỉ cần sửa lại vị trí anchor trong `main.css`, không cần đổi cấu trúc.
