<script setup lang="ts">
import type { SettingView } from '#shared/types/setting'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToast()

const { data } = await useFetch<SettingView>('/api/admin/settings', { key: 'admin-settings' })
const { data: banks } = await useFetch<{ code: string, bin: string, name: string, logo: string }[]>(
  '/api/admin/settings/banks',
  { key: 'admin-vietqr-banks' },
)
const bankItems = computed(() => (banks.value ?? []).map(b => ({ label: `${b.name} (${b.code})`, value: b.code })))

const form = reactive({
  shippingFee: 0,
  freeShippingThreshold: 0,
  bankTransferEnabled: false,
  bankName: '',
  bankCode: '',
  bankAccountNumber: '',
  bankAccountName: '',
})

watch(data, (value) => {
  if (!value) return
  form.shippingFee = value.shippingFee
  form.freeShippingThreshold = value.freeShippingThreshold
  form.bankTransferEnabled = value.bankTransferEnabled
  form.bankName = value.bankName ?? ''
  form.bankCode = value.bankCode ?? ''
  form.bankAccountNumber = value.bankAccountNumber ?? ''
  form.bankAccountName = value.bankAccountName ?? ''
}, { immediate: true })

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    await $fetch('/api/admin/settings', { method: 'PATCH', body: form })
    toast.add({ title: 'Đã lưu cài đặt', color: 'success' })
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu cài đặt'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

watch(() => form.bankCode, (code) => {
  const bank = banks.value?.find(b => b.code === code)
  if (bank) form.bankName = bank.name
})

useSeoMeta({ title: 'Cài đặt - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <h1 class="text-xl font-bold text-highlighted">
      Cài đặt
    </h1>

    <div class="max-w-lg space-y-4 rounded-xl border border-default p-5">
      <h2 class="font-semibold text-highlighted">
        Phí vận chuyển
      </h2>
      <UFormField label="Phí vận chuyển mặc định (đ)" required>
        <UInputNumber v-model="form.shippingFee" :min="0" :step="1000" class="w-full" />
      </UFormField>
      <UFormField label="Miễn phí vận chuyển cho đơn từ (đ)" required>
        <UInputNumber v-model="form.freeShippingThreshold" :min="0" :step="10000" class="w-full" />
      </UFormField>
      <p class="text-xs text-muted">
        Đơn hàng có giá trị tạm tính từ mức trên trở lên sẽ được miễn phí vận chuyển.
      </p>
      <UButton :loading="saving" @click="save">
        Lưu cài đặt
      </UButton>
    </div>

    <div class="max-w-lg space-y-4 rounded-xl border border-default p-5">
      <h2 class="font-semibold text-highlighted">
        Thanh toán
      </h2>
      <UCheckbox v-model="form.bankTransferEnabled" label="Bật thanh toán chuyển khoản ngân hàng (VietQR)" />
      <UFormField label="Ngân hàng">
        <USelectMenu
          v-model="form.bankCode"
          value-key="value"
          :items="bankItems"
          placeholder="Chọn ngân hàng"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Số tài khoản">
        <UInput v-model="form.bankAccountNumber" class="w-full" />
      </UFormField>
      <UFormField label="Tên tài khoản">
        <UInput v-model="form.bankAccountName" placeholder="Không dấu, viết hoa" class="w-full" />
      </UFormField>
      <p class="text-xs text-muted">
        Mã QR chuyển khoản của khách dựng trực tiếp từ thông tin trên (VietQR) — đổi ngân hàng/số tài
        khoản ở đây đổi luôn nơi nhận tiền cho đơn mới; đơn cũ giữ nguyên tài khoản đã dùng lúc đặt hàng.
      </p>
      <p class="text-xs text-muted">
        Số tài khoản phải khớp với tài khoản đã kết nối webhook SePay thì đơn mới mới được tự động xác
        nhận khi khách chuyển khoản (cấu hình webhook/khoá bí mật ở biến môi trường
        SEPAY_WEBHOOK_HMAC_SECRET hoặc SEPAY_WEBHOOK_API_KEY, tuỳ phương thức bảo mật chọn ở SePay).
      </p>
      <UButton :loading="saving" @click="save">
        Lưu cài đặt
      </UButton>
    </div>
  </div>
</template>
