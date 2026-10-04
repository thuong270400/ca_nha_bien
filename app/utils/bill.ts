import type { OrderView } from '#shared/types/order'

// CSS riêng của hoá đơn (không dùng Tailwind) để in ra luôn đen-trên-trắng bất
// kể theme sáng/tối, và để copy nguyên khối HTML sang iframe in (printBill)
// mà không phải kéo theo stylesheet của cả app.
export const BILL_CSS = `
.bill { font-family: 'Be Vietnam Pro', Arial, Helvetica, sans-serif; color: #111; background: #fff; font-size: 13px; line-height: 1.45; padding: 20px; max-width: 760px; margin: 0 auto; }
.bill * { box-sizing: border-box; }
.bill-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; border-bottom: 2px solid #0b4f7a; padding-bottom: 12px; }
.bill-shop { display: flex; gap: 12px; align-items: center; }
.bill-shop img { width: 56px; height: 56px; object-fit: contain; }
.bill-shop-name { font-size: 18px; font-weight: 700; color: #0b4f7a; margin: 0; }
.bill-shop p { margin: 1px 0; color: #444; font-size: 12px; }
.bill-title { text-align: right; }
.bill-title h2 { margin: 0; font-size: 20px; letter-spacing: 1px; color: #0b4f7a; }
.bill-title p { margin: 2px 0; font-size: 12px; color: #444; }
.bill-section { margin-top: 14px; }
.bill-section h3 { font-size: 12px; text-transform: uppercase; color: #0b4f7a; margin: 0 0 6px; letter-spacing: .5px; }
.bill-info { display: grid; grid-template-columns: 110px 1fr; gap: 3px 8px; }
.bill-info span:nth-child(odd) { color: #555; }
.bill table { width: 100%; border-collapse: collapse; }
.bill th, .bill td { border: 1px solid #ccd6dd; padding: 6px 8px; text-align: center; vertical-align: middle; }
.bill th { background: #eef5fa; font-size: 12px; }
.bill .num { white-space: nowrap; }
.bill-bottom { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-top: 10px; }
.bill-qr { text-align: center; font-size: 11px; color: #444; max-width: 200px; }
.bill-qr img { width: 140px; height: 140px; display: block; margin: 0 auto 4px; border: 1px solid #ccd6dd; border-radius: 4px; }
.bill-qr p { margin: 1px 0; }
.bill-qr strong { color: #0b4f7a; }
.bill-summary { margin-left: auto; width: 100%; max-width: 330px; }
.bill-summary div { display: flex; justify-content: space-between; padding: 3px 0; }
.bill-summary .total { border-top: 1px solid #111; margin-top: 4px; padding-top: 6px; font-size: 15px; font-weight: 700; }
.bill-summary .due { font-weight: 700; color: #b42318; }
.bill-summary .paid { color: #067647; }
.bill-note { margin-top: 16px; border: 1px dashed #0b4f7a; border-radius: 6px; padding: 8px 10px; background: #f5fafd; }
.bill-note p { margin: 2px 0; }
.bill-footer { margin-top: 16px; text-align: center; font-size: 12px; color: #555; }
@media print { .bill { padding: 0; max-width: none; } }
`

export interface BillPaymentSummary {
  paid: number
  remaining: number
  /** Nhãn cho phần còn lại: COD thì shipper thu hộ, chuyển khoản thì khách còn nợ. */
  remainingLabel: string
  /**
   * Số tiền cho QR của bước đang chờ — cọc trước (PENDING) hoặc phần còn lại
   * (DEPOSIT_PAID), cùng cách tính với admin OrderDetail/trang đơn của khách vì
   * webhook SePay so khớp đúng số tiền này. `null` khi không còn gì để quét.
   */
  qrAmount: number | null
}

export function billPaymentSummary(order: OrderView): BillPaymentSummary {
  const total = Number(order.total)
  let paid = 0
  if (order.paymentStatus === 'PAID') paid = total
  else if (order.paymentStatus === 'DEPOSIT_PAID') paid = Number(order.payment?.depositAmount ?? 0)
  const remaining = Math.max(total - paid, 0)
  let qrAmount: number | null = null
  if (order.paymentMethod === 'BANK_TRANSFER' || order.paymentMethod === 'COD') {
    if (order.paymentStatus === 'PENDING') qrAmount = Number(order.payment?.depositAmount ?? total)
    else if (order.paymentStatus === 'DEPOSIT_PAID') qrAmount = remaining
  }
  return {
    paid,
    remaining,
    remainingLabel: order.paymentMethod === 'COD' ? 'Thu hộ (COD)' : 'Còn phải thanh toán',
    qrAmount: qrAmount && qrAmount > 0 ? qrAmount : null,
  }
}

/**
 * In hoá đơn qua một iframe ẩn — trình duyệt mở hộp thoại in, chọn "Lưu dưới
 * dạng PDF" để xuất file. Tiêu đề iframe đặt theo mã đơn nên tên file PDF mặc
 * định là "Hoa-don-<mã đơn>".
 */
export function printBill(el: HTMLElement, orderNumber: string) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument
  const win = iframe.contentWindow
  if (!doc || !win) {
    iframe.remove()
    return
  }
  doc.open()
  doc.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><base href="${location.origin}/"><title>Hoa-don-${orderNumber}</title><style>@page{size:A4;margin:12mm}body{margin:0;background:#fff}</style></head><body>${el.outerHTML}</body></html>`)
  doc.close()

  const images = Array.from(doc.images)
  Promise.all(images.map(img => img.complete
    ? Promise.resolve()
    : new Promise(resolve => {
        img.onload = resolve
        img.onerror = resolve
      }))).then(() => {
    // Chrome dùng title của document cha làm tên file PDF khi in iframe.
    const originalTitle = document.title
    document.title = `Hoa-don-${orderNumber}`
    win.focus()
    win.print()
    document.title = originalTitle
    setTimeout(() => iframe.remove(), 1000)
  })
}
