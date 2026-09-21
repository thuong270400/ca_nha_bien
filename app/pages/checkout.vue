<script setup lang="ts">
import type { AddressView } from '#shared/types/order'
import type { CouponPublicView } from '#shared/types/coupon'
import type { DeliverySettingView, DepositSettingView } from '#shared/types/setting'
import { formatDays, groupByAvailabilityDays } from '#shared/utils/sourcing'

const cartStore = useCartStore()
await cartStore.ensureLoaded()

const { data: depositSetting } = await useFetch<DepositSettingView>('/api/settings/deposit', { key: 'deposit-setting' })
const { data: deliverySetting } = await useFetch<DeliverySettingView>('/api/settings/delivery', { key: 'delivery-setting' })
const deliveryDaysText = computed(() => formatDays(deliverySetting.value?.deliveryDays))

const router = useRouter()
const toast = useToast()
const { loggedIn } = useUserSession()

if (!cartStore.cart?.items.length) {
  await navigateTo('/cart')
}

const { data: addresses } = await useFetch<AddressView[]>('/api/addresses', {
  key: 'my-addresses',
  immediate: loggedIn.value,
})

const form = reactive({
  recipientName: '',
  recipientPhone: '',
  province: '',
  district: '',
  ward: '',
  addressLine: '',
  note: '',
  addressId: undefined as string | undefined,
  saveAddress: false,
  paymentMethod: 'COD' as 'COD' | 'BANK_TRANSFER',
  deliveryMode: 'SINGLE' as 'SINGLE' | 'SPLIT',
})

// Nhóm sản phẩm trong giỏ theo số ngày dự kiến có hàng (vd hàng có sẵn ~2 ngày,
// hàng theo chuyến ~7 ngày) — chỉ khi có từ 2 nhóm trở lên mới cần hỏi khách chọn
// giao 1 lần hay giao nhiều lần, xem shared/utils/sourcing.ts#groupByAvailabilityDays.
const availabilityGroups = computed(() => cartStore.cart ? groupByAvailabilityDays(cartStore.cart.items) : [])
const hasMultipleAvailabilityGroups = computed(() => availabilityGroups.value.length > 1)
const maxAvailabilityDays = computed(() => availabilityGroups.value.reduce((max, g) => Math.max(max, g.days), 0))

const selectedAddressId = ref<string | undefined>(undefined)

function applyAddress(address: AddressView | undefined) {
  if (!address) return
  form.recipientName = address.fullName
  form.recipientPhone = address.phone
  form.province = address.province
  form.district = address.district
  form.ward = address.ward
  form.addressLine = address.addressLine
  form.note = address.note ?? ''
  form.addressId = address.id
}

watch(addresses, (list) => {
  const defaultAddress = list?.find(a => a.isDefault) ?? list?.[0]
  if (defaultAddress) {
    selectedAddressId.value = defaultAddress.id
    applyAddress(defaultAddress)
  }
}, { immediate: true })

watch(selectedAddressId, (id) => {
  if (id === 'new') {
    form.addressId = undefined
    return
  }
  applyAddress(addresses.value?.find(a => a.id === id))
})

const loading = ref(false)

interface AppliedCoupon {
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  discountAmount: string
  categoryId: string
  categoryName: string
}

const couponInput = ref('')
const applyingCoupon = ref(false)
// Keyed by categoryId so applying a second coupon from the same category
// naturally replaces the first — at most 1 coupon per category, any number of categories at once.
const appliedCoupons = reactive<Record<string, AppliedCoupon>>({})
const appliedCouponsList = computed(() => Object.values(appliedCoupons))

async function applyCoupon() {
  const code = couponInput.value.trim()
  if (!code) return
  applyingCoupon.value = true
  try {
    // Path typed as `string` (not a literal) to sidestep Nitro's typed-route inference, which
    // hits a TS "excessive stack depth" error on this project's large route map for this path.
    const validateUrl: string = '/api/coupons/validate'
    const result = await $fetch<AppliedCoupon>(validateUrl, { method: 'POST', body: { code } })
    const replaced = appliedCoupons[result.categoryId]
    appliedCoupons[result.categoryId] = result
    couponInput.value = ''
    toast.add({
      title: replaced && replaced.code !== result.code ? `Đã thay mã "${replaced.code}" bằng "${result.code}"` : 'Đã áp dụng mã giảm giá',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Mã giảm giá không hợp lệ'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    applyingCoupon.value = false
  }
}

function removeCoupon(categoryId: string) {
  delete appliedCoupons[categoryId]
}

const couponModalOpen = ref(false)
const loadingCoupons = ref(false)
const availableCoupons = ref<CouponPublicView[]>([])

async function openCouponModal() {
  couponModalOpen.value = true
  loadingCoupons.value = true
  try {
    // Path typed as `string`, see the note on validateUrl above.
    const couponsUrl: string = '/api/coupons'
    availableCoupons.value = await $fetch<CouponPublicView[]>(couponsUrl)
  } catch {
    availableCoupons.value = []
  } finally {
    loadingCoupons.value = false
  }
}

function selectCoupon(code: string) {
  couponInput.value = code
  applyCoupon()
}

const total = computed(() => {
  const subtotal = Number(cartStore.cart?.subtotal ?? 0)
  const shippingFee = Number(cartStore.cart?.shippingFee ?? 0)
  const discount = appliedCouponsList.value.reduce((sum, c) => sum + Number(c.discountAmount), 0)
  return Math.max(subtotal - discount, 0) + shippingFee
})

// Xem trước số tiền cọc sẽ cần chuyển khoản ngay khi chọn BANK_TRANSFER — chỉ
// áp dụng khi có % cọc cấu hình (< 100%, xem order.service.ts#attemptCreateOrder,
// depositPercent >= 100 coi như không tách cọc). Giá trị thật (làm tròn) chỉ
// được chốt khi tạo đơn, đây chỉ là số xem trước để khách không bị bất ngờ.
const depositAmount = computed(() => {
  const percent = depositSetting.value?.depositPercent
  if (form.paymentMethod !== 'BANK_TRANSFER' || !percent || percent >= 100) return null
  return Math.round(total.value * percent / 100)
})

async function submitOrder() {
  loading.value = true
  try {
    const payload = {
      ...form,
      addressId: selectedAddressId.value === 'new' ? undefined : form.addressId,
      note: form.note || undefined,
      couponCodes: appliedCouponsList.value.map(c => c.code),
    }
    const order = await $fetch('/api/orders', { method: 'POST', body: payload })
    await cartStore.fetchCart()
    if (form.paymentMethod === 'BANK_TRANSFER') {
      router.push(`/order/${order.id}`)
    } else {
      router.push(`/order/success?id=${order.id}`)
    }
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể đặt hàng, vui lòng thử lại'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Thanh toán - Cá Nhà Biển' })
</script>

<template>
  <UContainer v-if="cartStore.cart?.items.length" class="py-8">
    <h1 class="mb-6 text-2xl font-bold text-highlighted">
      Thanh toán
    </h1>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div class="space-y-6">
        <div v-if="loggedIn && addresses?.length" class="rounded-xl border border-default p-5">
          <h2 class="mb-3 font-semibold text-highlighted">
            Địa chỉ giao hàng
          </h2>
          <URadioGroup
            v-model="selectedAddressId"
            :items="[
              ...addresses.map(a => ({ label: `${a.fullName} - ${a.addressLine}, ${a.ward}, ${a.district}, ${a.province}`, value: a.id })),
              { label: 'Nhập địa chỉ mới', value: 'new' },
            ]"
          />
        </div>

        <div class="rounded-xl border border-default p-5">
          <h2 class="mb-4 font-semibold text-highlighted">
            Thông tin giao hàng
          </h2>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="Họ tên người nhận" required class="sm:col-span-2">
              <UInput v-model="form.recipientName" class="w-full" />
            </UFormField>
            <UFormField label="Số điện thoại" required>
              <UInput v-model="form.recipientPhone" class="w-full" />
            </UFormField>
            <UFormField label="Tỉnh/Thành phố" required>
              <UInput v-model="form.province" class="w-full" />
            </UFormField>
            <UFormField label="Quận/Huyện" required>
              <UInput v-model="form.district" class="w-full" />
            </UFormField>
            <UFormField label="Phường/Xã" required>
              <UInput v-model="form.ward" class="w-full" />
            </UFormField>
            <UFormField label="Địa chỉ chi tiết" required class="sm:col-span-2">
              <UInput v-model="form.addressLine" placeholder="Số nhà, tên đường..." class="w-full" />
            </UFormField>
            <UFormField label="Ghi chú" class="sm:col-span-2">
              <UTextarea v-model="form.note" class="w-full" :rows="2" />
            </UFormField>
          </div>
          <UCheckbox
            v-if="loggedIn && selectedAddressId === 'new'"
            v-model="form.saveAddress"
            label="Lưu địa chỉ này cho lần sau"
            class="mt-3"
          />
        </div>

        <div v-if="hasMultipleAvailabilityGroups" class="rounded-xl border border-default p-5">
          <h2 class="mb-2 font-semibold text-highlighted">
            Giao hàng
          </h2>
          <p class="mb-3 text-sm text-muted">
            Đơn hàng có sản phẩm với thời gian dự kiến có hàng khác nhau. Chọn cách giao phù hợp:
          </p>
          <URadioGroup
            v-model="form.deliveryMode"
            :items="[
              { label: `Giao 1 lần — chung 1 hoá đơn, dự kiến có hàng trong tối đa ${formatDays(maxAvailabilityDays)}`, value: 'SINGLE' },
              { label: `Giao nhiều lần — tách thành ${availabilityGroups.length} đợt theo thời gian có hàng`, value: 'SPLIT' },
            ]"
          />
          <div v-if="form.deliveryMode === 'SPLIT'" class="mt-3 space-y-2">
            <div v-for="(group, idx) in availabilityGroups" :key="idx" class="rounded-lg bg-elevated p-3 text-sm">
              <p class="font-medium text-highlighted">
                Đợt {{ idx + 1 }} — dự kiến có hàng trong {{ formatDays(group.days) }}
              </p>
              <p class="text-muted">
                {{ group.items.map(i => i.product.name).join(', ') }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-default p-5">
          <h2 class="mb-4 font-semibold text-highlighted">
            Phương thức thanh toán
          </h2>
          <URadioGroup
            v-model="form.paymentMethod"
            :items="[
              { label: 'Thanh toán khi nhận hàng (COD)', value: 'COD' },
              { label: 'Chuyển khoản ngân hàng (quét mã QR VietQR)', value: 'BANK_TRANSFER' },
              { label: 'VNPay (sắp ra mắt)', value: 'VNPAY', disabled: true },
              { label: 'MoMo (sắp ra mắt)', value: 'MOMO', disabled: true },
              { label: 'ZaloPay (sắp ra mắt)', value: 'ZALOPAY', disabled: true },
            ]"
          />
          <p v-if="depositAmount" class="mt-3 flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
            <UIcon name="i-lucide-circle-alert" class="mt-0.5 size-4 shrink-0" />
            <span>Bạn chỉ cần chuyển khoản trước {{ formatVnd(depositAmount) }} khi đặt hàng, phần còn lại {{ formatVnd(total - depositAmount) }} sẽ thu sau.</span>
          </p>
          <p v-if="deliveryDaysText" class="mt-3 flex items-center gap-1.5 text-sm text-muted">
            <UIcon name="i-lucide-truck" class="size-4 shrink-0" />
            <span>Thời gian dự kiến giao hàng: {{ deliveryDaysText }}</span>
          </p>
        </div>
      </div>

      <div class="h-fit rounded-xl border border-default p-5">
        <h2 class="mb-4 font-semibold text-highlighted">
          Đơn hàng của bạn
        </h2>
        <div class="max-h-64 space-y-3 overflow-y-auto">
          <div v-for="item in cartStore.cart.items" :key="item.id" class="flex justify-between gap-2 text-sm">
            <span class="text-muted">{{ item.product.name }} × {{ item.quantity }} ({{ item.unit }})</span>
            <span class="shrink-0 font-medium">{{ formatVnd(item.lineTotal) }}</span>
          </div>
        </div>
        <USeparator class="my-4" />

        <div class="mb-4 space-y-2">
          <div class="flex gap-2">
            <UInput v-model="couponInput" placeholder="Mã giảm giá" class="w-full" @keyup.enter="applyCoupon" />
            <UButton variant="outline" :loading="applyingCoupon" @click="applyCoupon">
              Áp dụng
            </UButton>
          </div>
          <div
            v-for="c in appliedCouponsList"
            :key="c.categoryId"
            class="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2 text-sm"
          >
            <span class="flex items-center gap-1 text-success">
              <UIcon name="i-lucide-ticket-check" class="size-4" /> Đã áp dụng mã "{{ c.code }}" ({{ c.categoryName }})
            </span>
            <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" @click="removeCoupon(c.categoryId)" />
          </div>
          <UButton variant="link" color="primary" size="sm" icon="i-lucide-ticket-percent" class="h-auto p-0" @click="openCouponModal">
            Xem mã giảm giá
          </UButton>
        </div>

        <UModal v-model:open="couponModalOpen" title="Mã giảm giá">
          <template #body>
            <div v-if="loadingCoupons" class="py-8 text-center text-sm text-muted">
              Đang tải...
            </div>
            <div v-else-if="!availableCoupons.length" class="py-8 text-center text-sm text-muted">
              Hiện chưa có mã giảm giá nào
            </div>
            <div v-else class="max-h-[60vh] space-y-3 overflow-y-auto">
              <div
                v-for="c in availableCoupons"
                :key="c.code"
                class="rounded-lg border p-3"
                :class="c.eligible ? 'border-primary/30' : 'border-default'"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-semibold text-highlighted">
                      {{ c.code }}
                      <UBadge size="xs" variant="subtle" color="neutral" class="ml-1">
                        {{ c.categoryName }}
                      </UBadge>
                    </p>
                    <p class="text-sm text-muted">
                      <template v-if="c.type === 'PERCENTAGE'">
                        Giảm {{ Number(c.value) }}%<template v-if="c.maxDiscount"> (tối đa {{ formatVnd(c.maxDiscount) }})</template>
                      </template>
                      <template v-else>
                        Giảm {{ formatVnd(c.value) }}
                      </template>
                    </p>
                    <p class="text-xs text-muted">
                      {{ c.minOrderValue && Number(c.minOrderValue) > 0 ? `Áp dụng cho đơn từ ${formatVnd(c.minOrderValue)}` : 'Áp dụng cho mọi đơn hàng' }}
                    </p>
                    <p v-if="!c.eligible" class="mt-1 text-xs text-warning">
                      Mua thêm {{ formatVnd(c.missingAmount) }} để áp dụng mã này
                    </p>
                    <p v-else-if="appliedCoupons[c.categoryId]?.code === c.code" class="mt-1 text-xs text-success">
                      Đang áp dụng
                    </p>
                    <p v-else-if="appliedCoupons[c.categoryId]" class="mt-1 text-xs text-muted">
                      Danh mục này đang áp mã "{{ appliedCoupons[c.categoryId]?.code }}" — chọn để thay thế
                    </p>
                  </div>
                  <UButton size="sm" :disabled="!c.eligible" class="shrink-0" @click="selectCoupon(c.code)">
                    Áp dụng
                  </UButton>
                </div>
              </div>
            </div>
          </template>
        </UModal>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">Tạm tính</span>
            <span>{{ formatVnd(cartStore.cart.subtotal) }}</span>
          </div>
          <div v-for="c in appliedCouponsList" :key="c.categoryId" class="flex justify-between text-success">
            <span>Giảm giá ({{ c.code }})</span>
            <span>-{{ formatVnd(c.discountAmount) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Phí giao hàng</span>
            <span>{{ Number(cartStore.cart.shippingFee) === 0 ? 'Miễn phí' : formatVnd(cartStore.cart.shippingFee) }}</span>
          </div>
          <USeparator />
          <div class="flex justify-between text-base font-semibold text-highlighted">
            <span>Tổng cộng</span>
            <span class="text-primary">{{ formatVnd(total) }}</span>
          </div>
          <template v-if="depositAmount">
            <USeparator />
            <div class="flex justify-between font-medium text-primary">
              <span>Cần chuyển khoản ngay (cọc)</span>
              <span>{{ formatVnd(depositAmount) }}</span>
            </div>
            <div class="flex justify-between text-muted">
              <span>Còn lại (thu sau)</span>
              <span>{{ formatVnd(total - depositAmount) }}</span>
            </div>
          </template>
        </div>

        <UButton class="mt-4" size="lg" block :loading="loading" @click="submitOrder">
          Đặt hàng
        </UButton>
      </div>
    </div>
  </UContainer>
</template>
