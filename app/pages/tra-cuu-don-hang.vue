<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { trackOrderSchema, type TrackOrderInput } from '#shared/schemas/order.schema'

const route = useRoute()

// Link chia sẻ được dạng /tra-cuu-don-hang?code=ORD-... điền sẵn mã đơn,
// khách chỉ cần nhập SĐT.
const state = reactive<Partial<TrackOrderInput>>({
  orderNumber: typeof route.query.code === 'string' ? route.query.code : '',
  phone: '',
})
const loading = ref(false)
const errorMessage = ref('')

async function onSubmit(event: FormSubmitEvent<TrackOrderInput>) {
  loading.value = true
  errorMessage.value = ''
  try {
    const { id } = await $fetch<{ id: string }>('/api/orders/track', { method: 'POST', body: event.data })
    await navigateTo(`/order/${id}`)
  } catch (err) {
    errorMessage.value = (err as { data?: { message?: string } })?.data?.message ?? 'Không tra cứu được đơn hàng, vui lòng thử lại'
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Tra cứu đơn hàng - Cá Nhà Biển' })
</script>

<template>
  <UContainer class="flex min-h-[60vh] items-center justify-center py-12">
    <div class="w-full max-w-md rounded-xl border border-default p-6">
      <div class="mb-5 text-center">
        <UIcon name="i-lucide-package-search" class="size-10 text-primary" />
        <h1 class="mt-2 text-2xl font-bold text-highlighted">
          Tra cứu đơn hàng
        </h1>
        <p class="mt-1 text-sm text-muted">
          Nhập mã đơn hàng và số điện thoại người nhận để xem tình trạng đơn.
        </p>
      </div>

      <UForm :schema="trackOrderSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Mã đơn hàng" name="orderNumber" required>
          <UInput v-model="state.orderNumber" placeholder="VD: ORD-20261013-1234" class="w-full" autocomplete="off" />
        </UFormField>
        <UFormField label="Số điện thoại người nhận" name="phone" required>
          <UInput v-model="state.phone" type="tel" placeholder="Số điện thoại lúc đặt hàng" class="w-full" />
        </UFormField>

        <UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorMessage" />

        <UButton type="submit" block :loading="loading" icon="i-lucide-search">
          Tra cứu
        </UButton>
      </UForm>
    </div>
  </UContainer>
</template>
