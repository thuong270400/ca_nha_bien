<script setup lang="ts">
import type { OrderView } from '#shared/types/order'

// Hoá đơn (phiếu) của đơn hàng — dùng chung cho admin (/admin/bills) và trang
// đơn của khách. Style nằm trong BILL_CSS (app/utils/bill.ts) và được render
// ngay trong root để printBill() copy nguyên outerHTML sang iframe in.
const props = defineProps<{ order: OrderView }>()

const root = ref<HTMLElement | null>(null)
defineExpose({ root })

const { contact } = useAppConfig()
const site = useSiteConfig()
const website = computed(() => site.url?.replace(/^https?:\/\//, '').replace(/\/$/, ''))

const payment = computed(() => billPaymentSummary(props.order))
const address = computed(() =>
  [props.order.addressLine, props.order.ward, props.order.district, props.order.province].filter(Boolean).join(', '),
)
const fmt = (value: string | number) => formatVnd(value)
</script>

<template>
  <div ref="root" class="bill">
    <component :is="'style'">
      {{ BILL_CSS }}
    </component>

    <div class="bill-header">
      <div class="bill-shop">
        <img src="/images/logo/logo.png" alt="Cá Nhà Biển">
        <div>
          <p class="bill-shop-name">
            Cá Nhà Biển
          </p>
          <p>SĐT: {{ contact.hotline }}</p>
          <p v-if="website">
            Website: {{ website }}
          </p>
          <p>Địa chỉ: {{ contact.address }}</p>
        </div>
      </div>
      <div class="bill-title">
        <h2>HOÁ ĐƠN</h2>
        <p>Mã đơn: <strong>{{ order.orderNumber }}</strong></p>
        <p>{{ new Date(order.createdAt).toLocaleString('vi-VN') }}</p>
      </div>
    </div>

    <div class="bill-section">
      <h3>Thông tin đơn hàng</h3>
      <div class="bill-info">
        <span>Mã đơn</span><span>{{ order.orderNumber }}</span>
        <span>Ngày giờ đặt</span><span>{{ new Date(order.createdAt).toLocaleString('vi-VN') }}</span>
        <span>Khách hàng</span><span>{{ order.recipientName }}</span>
        <span>SĐT</span><span>{{ order.recipientPhone }}</span>
        <span>Địa chỉ giao</span><span>{{ address }}</span>
        <span>Thanh toán</span><span>{{ paymentMethodLabels[order.paymentMethod] }} — {{ paymentStatusLabels[order.paymentStatus] }}</span>
        <template v-if="order.note">
          <span>Ghi chú KH</span><span>{{ order.note }}</span>
        </template>
      </div>
    </div>

    <div class="bill-section">
      <h3>Chi tiết hàng</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 36px">
              #
            </th>
            <th>Sản phẩm</th>
            <th class="num">
              SL
            </th>
            <th class="num">
              Đơn giá
            </th>
            <th class="num">
              Thành tiền
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in order.items" :key="item.id">
            <td>{{ idx + 1 }}</td>
            <td>{{ item.productName }}</td>
            <td class="num">
              {{ item.quantity }} {{ item.unit }}
            </td>
            <td class="num">
              {{ fmt(item.price) }}
            </td>
            <td class="num">
              {{ fmt(item.lineTotal) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="bill-summary">
        <div><span>Tiền hàng</span><span>{{ fmt(order.subtotal) }}</span></div>
        <div>
          <span>Phí vận chuyển</span>
          <span>{{ Number(order.shippingFee) === 0 ? 'Miễn phí' : fmt(order.shippingFee) }}</span>
        </div>
        <div>
          <span>Giảm giá<template v-if="order.coupons.length"> ({{ order.coupons.map(c => c.couponCode).join(', ') }})</template></span>
          <span>{{ Number(order.discountAmount) > 0 ? `-${fmt(order.discountAmount)}` : fmt(0) }}</span>
        </div>
        <div class="total">
          <span>Tổng thanh toán</span><span>{{ fmt(order.total) }}</span>
        </div>
        <div class="paid">
          <span>Đã thanh toán</span><span>{{ fmt(payment.paid) }}</span>
        </div>
        <div :class="{ due: payment.remaining > 0 }">
          <span>{{ payment.remainingLabel }}</span><span>{{ fmt(payment.remaining) }}</span>
        </div>
      </div>
    </div>

    <div class="bill-note">
      <p><strong>Ghi chú:</strong> Hàng đông lạnh, vui lòng kiểm tra khi nhận.</p>
      <p>Mọi thắc mắc xin liên hệ {{ contact.hotline }}.</p>
    </div>

    <p class="bill-footer">
      Cảm ơn quý khách đã mua hàng tại Cá Nhà Biển!
    </p>
  </div>
</template>
