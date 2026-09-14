<script setup lang="ts">
import type { SettingView } from '#shared/types/setting'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToast()

const { data } = await useFetch<SettingView>('/api/admin/settings', { key: 'admin-settings' })

const form = reactive({
  shippingFee: 0,
  freeShippingThreshold: 0,
})

watch(data, (value) => {
  if (!value) return
  form.shippingFee = value.shippingFee
  form.freeShippingThreshold = value.freeShippingThreshold
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
  </div>
</template>
