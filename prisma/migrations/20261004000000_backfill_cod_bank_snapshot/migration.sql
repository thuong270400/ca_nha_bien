-- Data-only migration: đơn COD đặt trước khi COD có QR chuyển khoản không có
-- payments."bankSnapshot", nên không dựng được QR và webhook SePay không đối
-- chiếu được tài khoản. Điền bù 1 lần bằng tài khoản hiện tại trong settings
-- (cùng shape với getBankSettings ở setting.service.ts) — chỉ cho đơn COD còn
-- chờ thanh toán, chưa huỷ. Nếu lúc chạy settings chưa có bankCode/số tài
-- khoản thì không điền được đơn nào (migration vẫn được đánh dấu đã chạy).
UPDATE "payments" p
SET "bankSnapshot" = jsonb_build_object(
      'bankTransferEnabled', s."bankTransferEnabled",
      'bankName', s."bankName",
      'bankCode', s."bankCode",
      'bankAccountNumber', s."bankAccountNumber",
      'bankAccountName', s."bankAccountName"
    ),
    "updatedAt" = NOW()
FROM "settings" s, "orders" o
WHERE s."id" = 'default'
  AND s."bankCode" IS NOT NULL
  AND s."bankAccountNumber" IS NOT NULL
  AND o."id" = p."orderId"
  AND o."status" <> 'CANCELLED'
  AND p."method" = 'COD'
  AND p."status" = 'PENDING'
  AND p."bankSnapshot" IS NULL;
