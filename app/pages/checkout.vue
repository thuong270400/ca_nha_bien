<script setup lang="ts">
import type { AddressView } from '#shared/types/order'

const cartStore = useCartStore()
await cartStore.ensureLoaded()

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
  paymentMethod: 'COD' as const,
})

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

const couponInput = ref('')
const applyingCoupon = ref(false)
const appliedCoupon = ref<{ code: string, type: 'PERCENTAGE' | 'FIXED', discountAmount: string } | null>(null)

async function applyCoupon() {
  const code = couponInput.value.trim()
  if (!code) return
  applyingCoupon.value = true
  try {
    // Path typed as `string` (not a literal) to sidestep Nitro's typed-route inference, which
    // hits a TS "excessive stack depth" error on this project's large route map for this path.
    const validateUrl: string = '/api/coupons/validate'
    appliedCoupon.value = await $fetch<{ code: string, type: 'PERCENTAGE' | 'FIXED', discountAmount: string }>(validateUrl, { method: 'POST', body: { code } })
    toast.add({ title: 'Đã áp dụng mã giảm giá', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (err) {
    appliedCoupon.value = null
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Mã giảm giá không hợp lệ'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    applyingCoupon.value = false
  }
}

function removeCoupon() {
  appliedCoupon.value = null
  couponInput.value = ''
}

const total = computed(() => {
  const subtotal = Number(cartStore.cart?.subtotal ?? 0)
  const shippingFee = Number(cartStore.cart?.shippingFee ?? 0)
  const discount = Number(appliedCoupon.value?.discountAmount ?? 0)
  return Math.max(subtotal - discount, 0) + shippingFee
})

async function submitOrder() {
  loading.value = true
  try {
    const payload = {
      ...form,
      addressId: selectedAddressId.value === 'new' ? undefined : form.addressId,
      note: form.note || undefined,
      couponCode: appliedCoupon.value?.code,
    }
    const order = await $fetch('/api/orders', { method: 'POST', body: payload })
    await cartStore.fetchCart()
    router.push(`/order/success?id=${order.id}`)
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể đặt hàng, vui lòng thử lại'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Thanh toán - Cá nhà biển' })
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

        <div class="rounded-xl border border-default p-5">
          <h2 class="mb-4 font-semibold text-highlighted">
            Phương thức thanh toán
          </h2>
          <URadioGroup
            :model-value="form.paymentMethod"
            :items="[
              { label: 'Thanh toán khi nhận hàng (COD)', value: 'COD' },
              { label: 'VNPay (sắp ra mắt)', value: 'VNPAY', disabled: true },
              { label: 'MoMo (sắp ra mắt)', value: 'MOMO', disabled: true },
              { label: 'ZaloPay (sắp ra mắt)', value: 'ZALOPAY', disabled: true },
            ]"
          />
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

        <div class="mb-4">
          <div v-if="!appliedCoupon" class="flex gap-2">
            <UInput v-model="couponInput" placeholder="Mã giảm giá" class="w-full" @keyup.enter="applyCoupon" />
            <UButton variant="outline" :loading="applyingCoupon" @click="applyCoupon">
              Áp dụng
            </UButton>
          </div>
          <div v-else class="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2 text-sm">
            <span class="flex items-center gap-1 text-success">
              <UIcon name="i-lucide-ticket-check" class="size-4" /> Đã áp dụng mã "{{ appliedCoupon.code }}"
            </span>
            <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" @click="removeCoupon" />
          </div>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">Tạm tính</span>
            <span>{{ formatVnd(cartStore.cart.subtotal) }}</span>
          </div>
          <div v-if="appliedCoupon" class="flex justify-between text-success">
            <span>Giảm giá</span>
            <span>-{{ formatVnd(appliedCoupon.discountAmount) }}</span>
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
        </div>

        <UButton class="mt-4" size="lg" block :loading="loading" @click="submitOrder">
          Đặt hàng
        </UButton>
      </div>
    </div>
  </UContainer>
</template>
